-- Vitrina Vintage — esquema de Supabase
-- Idempotente: se puede ejecutar varias veces en el SQL editor.
-- Spec: docs/superpowers/specs/2026-11-24-vitrina-vintage-web-design.md §5

create extension if not exists pgcrypto;

-- ─────────────────────────── products ───────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  code_is_temp boolean not null default false,
  title text not null,
  price numeric(10,2),
  discount_percent smallint not null default 0 check (discount_percent between 0 and 90),
  category text not null,
  is_original boolean,
  era text check (era in ('retro','moderna')),
  condition text,
  tags text[] not null default '{}',
  editorial text,
  year smallint,
  extras text,
  variants jsonb not null default '[]',
  featured_rank smallint,
  stock integer not null default 1 check (stock >= 0),
  is_preorder boolean not null default false,
  preorder_eta text,
  images jsonb not null default '[]',
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','sold','hidden')),
  raw_ocr_text text,
  ocr_warnings text[] not null default '{}',
  source_files text[] not null default '{}',
  file_hashes text[] not null default '{}',
  source_key text,
  admin_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists products_file_hashes_idx on public.products using gin (file_hashes);
create index if not exists products_source_key_idx on public.products (source_key);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─────────────────────────── admins ───────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────────────────── RLS ───────────────────────────
alter table public.products enable row level security;
alter table public.admins enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated
  using (status in ('published','sold'));

drop policy if exists "products_admin_read" on public.products;
create policy "products_admin_read" on public.products
  for select to authenticated
  using (public.is_admin());

drop policy if exists "catalog_public_select" on storage.objects;
create policy "catalog_public_select" on storage.objects
  for select
  using (bucket_id = 'catalog');
  
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────── Storage ───────────────────────────
insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do nothing;

drop policy if exists "catalog_admin_insert" on storage.objects;
create policy "catalog_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog' and public.is_admin());

drop policy if exists "catalog_admin_update" on storage.objects;
create policy "catalog_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog' and public.is_admin())
  with check (bucket_id = 'catalog' and public.is_admin());

drop policy if exists "catalog_admin_delete" on storage.objects;
create policy "catalog_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog' and public.is_admin());

-- ─────────────────────────── Pasos manuales (una sola vez) ───────────────────────────
-- 1. Authentication → Providers → Email: desactivar "Allow new users to sign up".
-- 2. Authentication → Users → "Add user": crear el usuario del dueño (email + contraseña).
-- 3. Copiar su UUID y ejecutar:
--      insert into public.admins (user_id) values ('<uuid-del-usuario>');
-- 4. Verificar: node scripts/verify-rls.mjs  → debe imprimir "RLS OK".
