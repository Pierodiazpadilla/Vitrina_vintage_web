import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sql = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8')
const flat = sql.replace(/\s+/g, ' ').toLowerCase()

describe('supabase/schema.sql', () => {
  it.each([
    'id uuid primary key default gen_random_uuid()',
    'code text not null unique',
    'code_is_temp boolean not null default false',
    'title text not null',
    'price numeric(10,2)',
    'discount_percent smallint not null default 0',
    'category text not null',
    'is_original boolean',
    'era text',
    'condition text',
    "tags text[] not null default '{}'",
    'editorial text',
    'year smallint',
    'extras text',
    "variants jsonb not null default '[]'",
    'featured_rank smallint',
    'stock integer not null default 1',
    'is_preorder boolean not null default false',
    'preorder_eta text',
    "images jsonb not null default '[]'",
    'image_url text',
    "status text not null default 'draft'",
    'raw_ocr_text text',
    "ocr_warnings text[] not null default '{}'",
    "source_files text[] not null default '{}'",
    "file_hashes text[] not null default '{}'",
    'source_key text',
    'admin_edited boolean not null default false',
    'created_at timestamptz not null default now()',
    'updated_at timestamptz not null default now()',
    'published_at timestamptz',
  ])('declares column: %s', (col) => {
    expect(flat).toContain(col)
  })

  it('constrains status, era, discount and stock', () => {
    expect(flat).toContain("check (status in ('draft','published','sold','hidden'))")
    expect(flat).toContain("check (era in ('retro','moderna'))")
    expect(flat).toContain('check (discount_percent between 0 and 90)')
    expect(flat).toContain('check (stock >= 0)')
  })

  it('enables RLS and public read only for published/sold', () => {
    expect(flat).toContain('alter table public.products enable row level security')
    expect(flat).toContain("using (status in ('published','sold'))")
  })

  it('restricts writes to is_admin()', () => {
    for (const op of ['insert', 'update', 'delete']) {
      expect(flat).toMatch(new RegExp(`on public\.products for ${op} to authenticated .*?is_admin\(\)`))
    }
    expect(flat).toContain('security definer')
  })

  it('creates the public catalog bucket with admin-only writes', () => {
    expect(flat).toContain("values ('catalog', 'catalog', true)")
    expect(flat).toMatch(/on storage\.objects for insert to authenticated with check \(bucket_id = 'catalog' and public\.is_admin\(\)\)/)
  })

  it('is idempotent', () => {
    expect(flat).toContain('create table if not exists public.products')
    expect((flat.match(/create policy/g) || []).length).toBe((flat.match(/drop policy if exists/g) || []).length)
  })
})
