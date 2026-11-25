# Vitrina Vintage — tienda web

Catálogo público de álbumes de colección con pedido por WhatsApp, importador masivo por OCR y panel `/admin`.
React + Vite + Tailwind sobre Supabase (Postgres, Storage y Auth).

## Correr en local

```bash
npm install
npm run dev:fixtures   # con los productos de ejemplo (no necesita Supabase)
npm run dev            # con Supabase (requiere .env.local, ver abajo)
npm test               # pruebas (vitest)
npm run build          # build de producción en dist/
```

`.env.local` (no se versiona; plantilla en `.env.example`):

```
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_WHATSAPP_NUMBER=51941392619
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # solo para el importador; NUNCA con prefijo VITE_
```

`VITE_USE_FIXTURES=true` en `.env.local` hace que `npm run dev` use los productos de ejemplo.
Las pruebas (`.env.test`) y el build de producción (`.env.production`) lo apagan siempre.

## Configurar Supabase (una sola vez)

1. **SQL editor** → pegar y ejecutar `supabase/schema.sql` (es idempotente). Crea `products`, `admins`,
   `is_admin()`, la RLS y el bucket público `catalog`.
2. **Authentication → Providers → Email**: desactivar *Allow new users to sign up*.
3. **Authentication → Users → Add user**: crear el usuario del dueño (correo + contraseña).
4. En el SQL editor: `insert into public.admins (user_id) values ('<uuid-del-usuario>');`
5. `node scripts/verify-rls.mjs` → debe imprimir `RLS OK` (la anon key no puede escribir ni ver borradores).

## Importar el catálogo

Las fotos van en `raw-catalog/` (no se versiona; puede ser el zip de Google Drive descomprimido tal cual).

```bash
npm run import -- --dry-run                         # no sube nada: escribe import-preview.json
npm run import -- --dry-run --only "_1 DRAGON BALL"  # una carpeta
npm run import -- --only "_1 DRAGON BALL" --limit 10 # carga real de prueba
npm run import                                      # todo (≈5 min de OCR)
```

- Todo entra como **borrador**; se publica desde la revisión rápida.
- Se puede correr las veces que haga falta: empareja por foto (MD5) o por nombre de archivo, y nunca pisa
  lo que el admin editó ni lo ya publicado (solo agrega fotos nuevas y el 35 % de `_ 35__ DESC`).
- El catálogo **reutiliza códigos** entre productos distintos: si un código ya está tomado, el siguiente
  producto recibe `-2`, `-3`… y el aviso “Código repetido” para revisarlo.
- Los fallos por archivo quedan en `import-errors.json`; el proceso sigue.

## Panel `/admin`

- `/admin/revision` — **Revisión rápida** de borradores: foto + datos leídos por OCR.
  Atajos: `Enter`/`Ctrl+Enter` aprueba y pasa al siguiente · `S` o `→` salta · `←` vuelve · `H` oculta ·
  `1`–`9` cambia de foto. Filtros por carpeta, categoría y avisos.
- `/admin/nuevo` — Alta desde el celular: foto (cámara o galería) → OCR en el navegador → formulario
  prellenado → borrador o publicar. Si la foto o el código ya existen, ofrece agregar las fotos al existente.
- `/admin/productos` — Búsqueda (incluye borradores y ocultos), marcar vendido / −1 vendido / reponer,
  destacar en el inicio, editar, reordenar o quitar fotos, eliminar.

## Desplegar

Hosting estático (Netlify o Vercel). Build `npm run build`, carpeta `dist/`.
Variables en el hosting: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`.
**No** subir `SUPABASE_SERVICE_ROLE_KEY` al hosting.

La reescritura de rutas de la SPA ya está incluida: `public/_redirects` (Netlify) y `vercel.json` (Vercel).

## Estructura

```
src/shared/    reglas de negocio puras (precios, checkout, WhatsApp, parser OCR, búsqueda)
src/features/  catálogo, detalle, lista de pedido, políticas, admin (lazy)
scripts/       importador (Node + sharp + tesseract.js) y verificación de RLS
supabase/      esquema SQL
tests/         vitest (fixtures con banners reales del catálogo)
```
