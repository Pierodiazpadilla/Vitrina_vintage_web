# Vitrina Vintage Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks in **Fase B** (interfaz) se ejecutan además con `/frontend-design:frontend-design` para las decisiones visuales, siempre dentro de `CLAUDE.md`.

**Goal:** Tienda web de Vitrina Vintage: catálogo público rápido con checkout a WhatsApp, importador masivo por OCR desde `raw-catalog/` y panel `/admin` con revisión rápida.

**Architecture:** SPA React + Vite + Tailwind sobre Supabase (Postgres + Storage + Auth). La lógica de negocio vive en `src/shared/` como JS puro compartido por el navegador y el script Node (`parseBanner`, reglas de carpetas, precios, checkout). El catálogo se carga en una sola consulta y se busca/filtra en memoria; OCR con tesseract.js en Node (importador) y en el navegador (admin, chunk lazy).

**Tech Stack:** React 18, Vite, React Router, Tailwind CSS, @supabase/supabase-js v2, tesseract.js (spa), sharp (solo Node), vitest + @testing-library/react + jsdom, dotenv.

**Spec:** `docs/superpowers/specs/2026-11-24-vitrina-vintage-web-design.md` (aprobado). Leer también `CLAUDE.md`, `docs/politicas_y_condiciones_de_vitrina_vintage.md`, `docs/wireframes/home-wireframe.md`.

## Global Constraints

- Colores solo vía variables CSS de `CLAUDE.md` (`--color-primary #1798B7`, `--color-navy #1D2B58`, `--color-surface #F7F9FC`, `--color-card #FFFFFF`, `--color-accent-warm #F59E0B`, derivados); ningún hex suelto en componentes.
- Fuentes: Silkscreen (display), Chakra Petch 600–700 (títulos), DM Sans (cuerpo), JetBrains Mono (precios/códigos). Prohibido Inter, Roboto, Arial (ni como fallback; usar `system-ui, sans-serif`).
- Mobile-first: diseñar a 360–390 px; áreas táctiles ≥ 44×44 px; nada que dependa solo de hover; respetar `prefers-reduced-motion`.
- WhatsApp de ventas: `51941392619` → `https://wa.me/51941392619` (vía `VITE_WHATSAPP_NUMBER`).
- Plazo de reclamos: **5 días** en todo texto de la web.
- Moneda: soles (`S/`); PayPal muestra `$10 USD` aparte, sin conversión.
- `SUPABASE_SERVICE_ROLE_KEY` solo en `.env` local para scripts; nunca con prefijo `VITE_`, nunca en el bundle.
- Bundle JS inicial público < 200 KB gzip; admin y tesseract.js en chunks lazy.
- Todo producto importado entra como `status = 'draft'`.
- Idioma de la UI: español (Perú).

## Review Focus

1. **Texto OCR sucio** (`S/.250`, `250soles`, `Cod.\nDB 1082`, `C0d. DBl082`, tildes perdidas) → el parser igual extrae precio y código. *Test en Task 4.*
2. **`localStorage` bloqueado o corrupto** (navegador in-app de Instagram/TikTok, modo privado, JSON inválido) → catálogo y lista de pedido funcionan sin persistencia, sin pantalla en blanco. *Tests en Task 7 y Task 8.*
3. **Lista guardada desactualizada** (producto vendido, stock bajado, preventa que perdió precio) → se ajusta o excluye y se avisa; nunca entra al mensaje con total incorrecto. *Test en Task 8.*
4. **Caracteres especiales en el mensaje** (`&`, `#`, `ñ`, emoji, `+`) y listas largas → el enlace `wa.me` abre con el texto íntegro; > 1800 caracteres se compacta. *Test en Task 6.*
5. **Nombres de carpeta en Unicode NFD** (zip de Google Drive en Windows: `POKÉMON` descompuesto) y re-ejecución del importador tras ediciones en admin → categoría correcta; ediciones nunca pisadas. *Tests en Task 3 y Task 12.*

---

## Estructura de archivos

```
.env.example
index.html
package.json · vite.config.js · vitest.config.js · tailwind.config.js · postcss.config.js
supabase/schema.sql
scripts/
  import-catalog.mjs          CLI (orquesta)
  lib/scan.mjs                escaneo + md5 + agrupación de archivos
  lib/images.mjs              sharp: franjas OCR, webp full/thumb
  lib/ocr.mjs                 worker tesseract (Node)
  lib/upsertPlan.mjs          dedupe + decisión insert/update (puro)
  verify-rls.mjs              comprobación manual de RLS con anon key
src/
  main.jsx · App.jsx (router) · index.css (tokens + fuentes)
  shared/
    text.js                   normalizeText
    fileGrouping.js           normalizeBaseName, prefixOf, sortPhotos
    catalogRules.js           CATEGORIES, isIgnoredPath, metaFromPath, metaFromPrefix, licenseFromText, resolveMeta
    parseBanner.js            cleanBanner, parseBanner
    pricing.js                unitPrice, lineTotal, subtotal, surchargeFor, stockBadge, isPriceOnRequest
    countries.js              COUNTRIES, isAmericas
    checkoutRules.js          LOCATIONS, DELIVERY_OPTIONS, PAYMENT_METHODS, deliveryOptionsFor, paymentMethodsFor
    whatsapp.js               WHATSAPP_NUMBER, waLink, buildProductMessage, buildOrderMessage
    search.js                 searchProducts, filterProducts, sortProducts, filtersFromParams, filtersToParams
    validation.js             validateForPublish
    navigation.js             NAV_ITEMS, matchesNavItem
  lib/
    supabase.js               cliente anon
    storage.js                safeStorage (try/catch)
    products.js               PUBLIC_COLUMNS, fetchPublicProducts, useProducts
  features/
    layout/                   Navbar, Footer, FloatingWhatsApp, Layout
    catalog/                  Hero, CategoryTiles, ProductGrid, ProductCard, Filters, SearchBox, Badges
    product/                  ProductDetail, Gallery, VariantPicker
    cart/                     cartStore.js, CartPanel, CheckoutForm, OrderSummary
    policies/                 PoliciesPage
    admin/                    auth.js, AdminGuard, LoginPage, ReviewQueue, NewProduct, ProductsAdmin, ProductForm, browserOcr.js, browserImages.js, adminApi.js
tests/
  fixtures/banners.js         textos reales transcritos
  fixtures/products.js        productos de muestra
  shared/*.test.js · lib/*.test.js · features/**/*.test.jsx · scripts/*.test.mjs
```

---

# Fase A — Núcleo (sin interfaz)

### Task 1: Scaffold, tooling y tokens de marca

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `.env.example`, `tests/smoke.test.jsx`
- Modify: `.gitignore` (agregar `import-errors.json`, `import-preview.json`)

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `test` (`vitest run`), `import` (`node scripts/import-catalog.mjs`); clases Tailwind `bg-primary`, `bg-primary-dark`, `text-navy`, `bg-surface`, `bg-card`, `bg-accent`, `text-muted`, `font-display`, `font-title`, `font-body`, `font-mono`, `shadow-hard`, `shadow-hard-sm`, `rounded-brand`, todas mapeadas a las variables CSS.

- [ ] **Step 1:** `npm create vite@latest . -- --template react` (en la raíz, conservando archivos existentes); instalar `react-router-dom @supabase/supabase-js`, dev: `tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event sharp tesseract.js dotenv`. Borrar CSS/demo de la plantilla.
- [ ] **Step 2:** `src/index.css`: bloque `:root` copiado literal de `CLAUDE.md`; `body { background: var(--color-surface); color: var(--color-text); font-family: 'DM Sans', system-ui, sans-serif; }`. Fuentes desde Google Fonts en `index.html` con `display=swap` y `preconnect`. `tailwind.config.js` extiende `colors`, `fontFamily`, `boxShadow`, `borderRadius` con `var(--…)`.
- [ ] **Step 3:** `.env.example`:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  VITE_WHATSAPP_NUMBER=51941392619
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] **Step 4: Test** `tests/smoke.test.jsx`: renderiza `<App />` en `MemoryRouter` y espera que no lance; además lee `src/index.css` y afirma que no contiene `Inter`, `Roboto` ni `Arial`.
- [ ] **Step 5:** `npm test` → PASS; `npm run build` → sin errores.
- [ ] **Step 6: Commit** `chore: scaffold React + Vite + Tailwind con tokens de marca`

### Task 2: Esquema Supabase y RLS

**Files:**
- Create: `supabase/schema.sql`, `scripts/verify-rls.mjs`

**Interfaces:**
- Produces: tabla `products` (todas las columnas de spec §5 con sus tipos, defaults y checks exactos: `code` unique not null, `status` check in `('draft','published','sold','hidden')`, `era` check in `('retro','moderna')`, `discount_percent` 0–90, `stock` ≥ 0 default 1, `images`/`variants` jsonb default `'[]'`, `tags`/`ocr_warnings`/`source_files`/`file_hashes` text[]), tabla `admins(user_id)`, función `public.is_admin()`, trigger `updated_at`, bucket `catalog`.

- [ ] **Step 1:** Escribir `schema.sql` idempotente (`create table if not exists`, `drop policy if exists` antes de cada `create policy`). Índices: `unique(code)`, `gin(file_hashes)`, `(source_key)`, `(status)`, `(category)`.
- [ ] **Step 2:** RLS `products`: select anon/authenticated `using (status in ('published','sold'))`; select/insert/update/delete `is_admin()`. `admins`: select `user_id = auth.uid()`. `is_admin()` `security definer`, `set search_path = public`.
- [ ] **Step 3:** Storage: `insert into storage.buckets (id, name, public) values ('catalog','catalog',true) on conflict do nothing`; políticas en `storage.objects` para `bucket_id = 'catalog'`: insert/update/delete solo `is_admin()`.
- [ ] **Step 4:** Al final del archivo, comentario con los pasos manuales: deshabilitar signups, crear el usuario admin, `insert into admins values ('<uuid>')`.
- [ ] **Step 5:** `scripts/verify-rls.mjs` con la anon key: (a) `insert` en `products` → espera error; (b) `select` con `status = 'draft'` → espera `[]`; (c) `upload` a `catalog/rls-test.txt` → espera error. Imprime `RLS OK` o lista de fallos y sale con código 1.
- [ ] **Step 6:** Aplicar el SQL en el proyecto Supabase (SQL editor) y correr `node scripts/verify-rls.mjs` → `RLS OK`. Si no hay proyecto Supabase aún, dejar este paso marcado como pendiente del dueño y continuar.
- [ ] **Step 7: Commit** `feat(db): esquema products, admins, RLS y bucket catalog`

### Task 3: Agrupación de archivos y reglas de carpetas

**Files:**
- Create: `src/shared/text.js`, `src/shared/fileGrouping.js`, `src/shared/catalogRules.js`
- Test: `tests/shared/fileGrouping.test.js`, `tests/shared/catalogRules.test.js`

**Interfaces:**
- Produces:
  - `normalizeText(s: string): string` — NFC→NFD sin diacríticos, minúsculas, espacios colapsados, trim.
  - `normalizeBaseName(filename: string): { key: string, photoIndex: string | null }`
  - `prefixOf(key: string): string` — texto entre `vitrina` y ` (`.
  - `sortPhotos<T extends {photoIndex}>(items: T[]): T[]` — `null` primero, luego alfanumérico.
  - `CATEGORIES: Record<slug, label>` con `dragon-ball: 'Dragon Ball'`, `pokemon: 'Pokémon'`, `caballeros-del-zodiaco: 'Caballeros del Zodiaco'`, `digimon: 'Digimon'`, `futbol: 'Mundiales y Fútbol'`, `variado: 'Variados'`, `anime: 'Anime'`.
  - `isIgnoredPath(relPath: string): boolean`
  - `metaFromPath(relPath: string): { category: string|null, isOriginal: boolean|null, era: 'retro'|'moderna'|null, discountPercent: number }`
  - `metaFromPrefix(prefix: string): { category, isOriginal, era }` (mismo shape sin descuento)
  - `licenseFromText(text: string): boolean | null`
  - `resolveMeta(paths: string[], prefix: string, ocrText: string): { category, isOriginal, era, discountPercent }` — carpeta no-descuento > prefijo > texto; `discountPercent = 35` si algún path está en `_ 35__ DESC`.

- [ ] **Step 1: Tests fileGrouping:**
  ```js
  expect(normalizeBaseName('VITRINAdblic (16)a.jpg')).toEqual({ key: 'vitrinadblic (16)', photoIndex: 'a' })
  expect(normalizeBaseName('VITRINAdblic (16)b.jpg')).toEqual({ key: 'vitrinadblic (16)', photoIndex: 'b' })
  expect(normalizeBaseName('VITRINAcabdz (0)c.png')).toEqual({ key: 'vitrinacabdz (0)', photoIndex: 'c' })
  expect(normalizeBaseName('VITRINAvarm (0)C.jpg')).toEqual({ key: 'vitrinavarm (0)', photoIndex: 'c' })
  expect(normalizeBaseName('VITRINAvarlicm (10)4.jpg.jpg')).toEqual({ key: 'vitrinavarlicm (10)', photoIndex: '4' })
  expect(normalizeBaseName('VITRINAdblic (1)b.jpg.jpg')).toEqual({ key: 'vitrinadblic (1)', photoIndex: 'b' })
  expect(normalizeBaseName('VITRINAdblic (24).jpg')).toEqual({ key: 'vitrinadblic (24)', photoIndex: null })
  expect(normalizeBaseName('VITRINAdigimon (2).JPG').key).toBe('vitrinadigimon (2)')
  expect(prefixOf('vitrinavarlicm (10)')).toBe('varlicm')
  expect(sortPhotos([{photoIndex:'b'},{photoIndex:null},{photoIndex:'a'}]).map(p=>p.photoIndex)).toEqual([null,'a','b'])
  ```
- [ ] **Step 2: Tests catalogRules** (rutas relativas a la raíz del catálogo; incluir una con `'POKÉMON'` en NFD):
  ```js
  expect(isIgnoredPath('GRATIS/ARMABLE (1).jpg')).toBe(true)
  expect(isIgnoredPath('IMPORTANTE/ImportanteVV (1).JPG')).toBe(true)
  expect(isIgnoredPath('BIENVENIDO.JPG')).toBe(true)
  expect(isIgnoredPath('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg')).toBe(false)
  expect(metaFromPath('_1 DRAGON BALL/LICENCIADOS/x.jpg')).toEqual({ category:'dragon-ball', isOriginal:true, era:null, discountPercent:0 })
  expect(metaFromPath('_2 POKÉMON/SIN LICENCIA/x.jpg').category).toBe('pokemon')
  expect(metaFromPath('_6 VARIADO/LICENCIADOS/MODERNAS , VIGENTES/x.jpg')).toEqual({ category:'variado', isOriginal:true, era:'moderna', discountPercent:0 })
  expect(metaFromPath('_6 VARIADO/SIN LICENCIA/RETRO/x.jpg')).toEqual({ category:'variado', isOriginal:false, era:'retro', discountPercent:0 })
  expect(metaFromPath('_ 35__ DESC/VITRINAdblic (24).jpg')).toEqual({ category:null, isOriginal:null, era:null, discountPercent:35 })
  expect(metaFromPrefix('dblic')).toEqual({ category:'dragon-ball', isOriginal:true, era:null })
  expect(metaFromPrefix('db')).toEqual({ category:'dragon-ball', isOriginal:false, era:null })
  expect(metaFromPrefix('varlicr')).toEqual({ category:'variado', isOriginal:true, era:'retro' })
  expect(metaFromPrefix('varm')).toEqual({ category:'variado', isOriginal:false, era:'moderna' })
  expect(metaFromPrefix('digimonlic').isOriginal).toBe(true)
  expect(metaFromPrefix('fut').category).toBe('futbol')
  expect(licenseFromText('Navarrete original, año 1999')).toBe(true)
  expect(licenseFromText('Replica de excelente calidad')).toBe(false)
  expect(licenseFromText('Panini licenciado')).toBe(true)
  expect(licenseFromText('Album Walt Disney')).toBe(null)
  expect(resolveMeta(['_1 DRAGON BALL/LICENCIADOS/a.jpg','_ 35__ DESC/a.jpg'],'dblic','')).toEqual({ category:'dragon-ball', isOriginal:true, era:null, discountPercent:35 })
  expect(resolveMeta(['_ 35__ DESC/VITRINAvarlic (32).jpg'],'varlic','').category).toBe('variado')
  ```
- [ ] **Step 3:** Run `npx vitest run tests/shared` → FAIL (módulos no existen).
- [ ] **Step 4:** Implementar. Antes de cerrar, listar los prefijos reales: `find raw-catalog -type f | sed -E 's#.*/VITRINA([a-zA-Z]+) ?\(.*#\1#I' | sort -u` y asegurar que todos tienen entrada en la tabla de prefijos (agregar un test por cada prefijo que aparezca y no esté arriba). Comparar carpetas siempre con `normalizeText`.
- [ ] **Step 5:** Run → PASS.
- [ ] **Step 6: Commit** `feat(shared): agrupación de fotos y metadatos por carpeta/prefijo`

### Task 4: `parseBanner`

**Files:**
- Create: `src/shared/parseBanner.js`, `tests/fixtures/banners.js`
- Test: `tests/shared/parseBanner.test.js`

**Interfaces:**
- Consumes: `normalizeText`, `licenseFromText` (Task 3).
- Produces:
  - `cleanBanner(text: string): string` — quita líneas de aviso legal (contienen `reclamos`, `solo se aceptan`, `no nos hacemos responsables`, `coleccion revisada`, comparación normalizada) y une líneas.
  - `parseBanner(text: string, opts?: { confidence?: number }): ParsedBanner` donde
    `ParsedBanner = { price: number|null, variants: {label:string, price:number}[], title: string|null, condition: string|null, tags: string[], editorial: string|null, year: number|null, code: string|null, extras: string|null, isOriginalHint: boolean|null, warnings: string[] }`
  - `EDITORIALS: string[]` (Navarrete, Panini, Salo, Cromy, Pacosa, Bandai, Upper Deck, Topps, Merlin).

- [ ] **Step 1: Fixtures** `tests/fixtures/banners.js` exporta objetos `{ file, text, expected }`. Los tres obligatorios:
  ```js
  { file: '_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg',
    text: '250 soles. Dragon Ball Z 3 álbum + caja de 100 sobres sellados.\nNavarrete original, año 1999. (Cod. DB1082)\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO, ÚNICO CAMBIO POR HUECO DE POLILLA, NO NOS HACEMOS RESPONSABLES POR EL ESTADO DE LAS FIGURAS',
    expected: { price: 250, code: 'DB1082', editorial: 'Navarrete', year: 1999, isOriginalHint: true, tagsInclude: ['sellado','combo','sobres'] } },
  { file: '_5 FUTBOL/VITRINAfut (16)b.jpg',
    text: '250 soles. Álbum Tapa dura, COPA MUNDIAL 2026,Panini licenciado.\n(Cod. VR1149)\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 05 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCION REVISADA TAL CUAL INDICA LA DESCRIPCION.',
    expected: { price: 250, code: 'VR1149', editorial: 'Panini', year: 2026, isOriginalHint: true, tagsInclude: ['tapa-dura'] } },
  { file: '_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg',
    text: 'Album WALT DISNEY TU Y YO y set completo a pegar - Replica de excelente calidad\nVersión TAPA BLANDA a 60 soles\nSOLO SE ACEPTAN RECLAMOS DENTRO DE LOS 07 DÍAS MÁXIMO LUEGO DE LA ENTREGA O ENVÍO. COLECCIÓN REVISADA TAL CUAL INDICA LA DESCRIPCIÓN',
    expected: { price: 60, code: null, editorial: null, isOriginalHint: false, tagsInclude: ['set-a-pegar','tapa-blanda'], warningsInclude: ['code_missing'] } },
  ```
  El implementador agrega ≥ 12 fixtures más transcribiendo banners reales de **todas** las carpetas (abrir las fotos), incluyendo al menos uno con dos precios.
- [ ] **Step 2: Tests** — un `it.each(fixtures)` que compara cada campo de `expected` presente; más casos sintéticos:
  ```js
  expect(parseBanner('S/.250 Album X (Cod. DB1082)').price).toBe(250)
  expect(parseBanner('250soles Album X').price).toBe(250)
  expect(parseBanner('120 soles. Album X (Cod.\nDB 1082)').code).toBe('DB1082')
  expect(parseBanner('120 soles. Album X (C0d. DBl082)').code).toBe('DB1082')
  expect(parseBanner('Album X sin precio').warnings).toContain('price_missing')
  const v = parseBanner('Album X. Versión TAPA DURA a 250 soles. Versión TAPA BLANDA a 60 soles')
  expect(v.variants).toEqual([{label:'Tapa dura',price:250},{label:'Tapa blanda',price:60}])
  expect(v.price).toBe(60); expect(v.warnings).toContain('multiple_prices')
  expect(parseBanner('100 soles. Album Mundial 2026 (Cod. VR1)').year).toBe(2026)
  expect(parseBanner('x', { confidence: 55 }).warnings).toContain('low_confidence')
  expect(parseBanner('').warnings).toEqual(expect.arrayContaining(['price_missing','code_missing','title_missing']))
  expect(cleanBanner('Album\nSOLO SE ACEPTAN RECLAMOS dentro...')).not.toMatch(/reclamos/i)
  ```
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Implementar siguiendo spec §6 (reglas 1–8). Corrección OCR `O→0`, `l/I→1` solo en la parte numérica del código. Etiqueta de variante: texto inmediatamente anterior al precio, sin "versión"/"a", en formato oración. `title` ≤ 90 caracteres cortado en límite de palabra. Tags: `sellado`, `set-a-pegar`, `completo`, `incompleto`, `tapa-dura`, `tapa-blanda`, `combo` (hay `+` uniendo productos), `sobres` (sobres/paquetón/caja de sobres).
- [ ] **Step 5:** Run → PASS.
- [ ] **Step 6: Commit** `feat(shared): parseBanner con fixtures reales del catálogo`

### Task 5: Precios, stock y validación de publicación

**Files:**
- Create: `src/shared/countries.js`, `src/shared/pricing.js`, `src/shared/validation.js`
- Test: `tests/shared/pricing.test.js`, `tests/shared/validation.test.js`

**Interfaces:**
- Produces:
  - `COUNTRIES: { code, name, americas: boolean }[]` (≥ los 12 países DHL de las políticas: MX, CR, CL, BO, ES, AR, BR, IT, SV, EC, FR, US; resto de América; y `{ code:'OTRO', name:'Otro país', americas:false }`) y `isAmericas(code): boolean` en `countries.js`.
  - `isPriceOnRequest(p): boolean` — `p.is_preorder && !(p.price > 0)`.
  - `unitPrice(p, variantLabel?: string|null): number|null` — precio de la variante (o `price`), con descuento, `round2`.
  - `listPrice(p, variantLabel?): number|null` — sin descuento.
  - `lineTotal(line: {product, variant, qty}): number`
  - `subtotal(lines): number`
  - `surchargeFor(methodId: string, subtotal: number, countryCode?: string): { percent: number, amount: number, fixedUsd: number, note: string|null }`
  - `stockBadge(p): null | { label: string, tone: 'neutral'|'warm' }`
  - `maxQty(p): number` — `stock` para normales; `Infinity` para preventa con precio; `0` para precio a consultar.
  - `validateForPublish(p): string[]` — mensajes en español; `[]` = publicable.

- [ ] **Step 1: Tests:**
  ```js
  expect(unitPrice({ price: 250, discount_percent: 35, variants: [] })).toBe(162.5)
  expect(unitPrice({ price: 60, discount_percent: 0, variants: [{label:'Tapa dura',price:250},{label:'Tapa blanda',price:60}] }, 'Tapa dura')).toBe(250)
  expect(unitPrice({ price: null, is_preorder: true, discount_percent: 0, variants: [] })).toBe(null)
  expect(isPriceOnRequest({ is_preorder: true, price: 0 })).toBe(true)
  expect(isPriceOnRequest({ is_preorder: false, price: 0 })).toBe(false)
  expect(surchargeFor('mercadopago', 412.5)).toMatchObject({ percent: 7, amount: 28.88, fixedUsd: 0 })
  expect(surchargeFor('paypal', 100, 'MX')).toMatchObject({ percent: 8, amount: 8, fixedUsd: 10 })
  expect(surchargeFor('paypal', 100, 'ES')).toMatchObject({ percent: 0, amount: 0, fixedUsd: 10 })
  expect(surchargeFor('paypal', 100, 'ES').note).toMatch(/8 ?% podría aplicar/)
  expect(surchargeFor('yape', 100)).toMatchObject({ amount: 0 })
  expect(stockBadge({ stock: 1 })).toBe(null)
  expect(stockBadge({ stock: 3 })).toEqual({ label: 'Últimas unidades', tone: 'warm' })
  expect(stockBadge({ stock: 5 })).toEqual({ label: 'Quedan 5', tone: 'neutral' })
  expect(maxQty({ stock: 4, is_preorder: false, price: 10 })).toBe(4)
  expect(maxQty({ is_preorder: true, price: 0 })).toBe(0)
  const ok = { price: 100, stock: 1, title: 'X', category: 'pokemon', is_original: true, code: 'PK0001', is_preorder: false }
  expect(validateForPublish(ok)).toEqual([])
  expect(validateForPublish({ ...ok, price: 0 })).toContain('Falta el precio')
  expect(validateForPublish({ ...ok, price: null, is_preorder: true })).toEqual([])
  expect(validateForPublish({ ...ok, is_original: null })).toContain('Indica si es original o réplica')
  expect(validateForPublish({ ...ok, stock: 0 })).toContain('El stock debe ser al menos 1')
  ```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar (`round2 = n => Math.round(n*100)/100`; `surchargeFor` usa `isAmericas` de `countries.js`). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(shared): precios, recargos, stock y validación de publicación`

### Task 6: Reglas de checkout y mensajes de WhatsApp

**Files:**
- Create: `src/shared/checkoutRules.js`, `src/shared/whatsapp.js`
- Test: `tests/shared/checkoutRules.test.js`, `tests/shared/whatsapp.test.js`

**Interfaces:**
- Consumes: `unitPrice`, `subtotal`, `surchargeFor`, `isPriceOnRequest` (Task 5).
- Produces:
  - `LOCATIONS = ['lima','provincias','extranjero']`
  - `DELIVERY_OPTIONS: { id, label, locations: string[], shippingNote: string, pickupPoints?: string[] }[]` con ids `punto-lima`, `motorizado-indrive`, `motorizado-propio`, `olva`, `shalom`, `dhl` y textos de spec §9 (puntos: Real Plaza Centro Cívico; Metropolitano Naranjal, Canaval, Moreyra; Los Olivos/SMP: Canta Callao con Los Alisos o Naranjal).
  - `PAYMENT_METHODS: { id, label, scope: 'peru'|'extranjero', note?: string }[]` ids `yape-plin`, `transferencia`, `efectivo`, `mercadopago`, `wu-mg`, `paypal`.
  - Reexporta `COUNTRIES`, `isAmericas` de `countries.js` (Task 5).
  - `deliveryOptionsFor(location): DeliveryOption[]`
  - `paymentMethodsFor(location, deliveryId): PaymentMethod[]` — `efectivo` solo con `punto-lima`.
  - `WHATSAPP_NUMBER` (de `import.meta.env.VITE_WHATSAPP_NUMBER ?? '51941392619'`; en Node `process.env`).
  - `waLink(text: string, number = WHATSAPP_NUMBER): string`
  - `buildProductMessage(p, { variant?, kind: 'pedir'|'reservar'|'consultar'|'avisar' }): string`
  - `buildOrderMessage(order: { lines, location, country?, deliveryId, pickupPoint?, paymentId, name, city, acceptedPolicies: true }): string`

- [ ] **Step 1: Tests checkoutRules:**
  ```js
  expect(deliveryOptionsFor('lima').map(d=>d.id)).toEqual(['punto-lima','motorizado-indrive','motorizado-propio','olva'])
  expect(deliveryOptionsFor('provincias').map(d=>d.id)).toEqual(['olva','shalom'])
  expect(deliveryOptionsFor('extranjero').map(d=>d.id)).toEqual(['dhl'])
  expect(paymentMethodsFor('lima','punto-lima').map(m=>m.id)).toContain('efectivo')
  expect(paymentMethodsFor('lima','olva').map(m=>m.id)).not.toContain('efectivo')
  expect(paymentMethodsFor('extranjero','dhl').map(m=>m.id)).toEqual(['wu-mg','paypal'])
  expect(isAmericas('CL')).toBe(true); expect(isAmericas('IT')).toBe(false)
  ```
- [ ] **Step 2: Tests whatsapp** (usar productos de `tests/fixtures/products.js`, crear ese fixture aquí con ≥ 6 productos que cubran: pieza única, stock 5, descuento 35, variantes, preventa con precio, preventa sin precio):
  ```js
  const msg = buildOrderMessage(sampleOrder) // DB1082 S/250 + VR1149 -35%, mercadopago, olva, Arequipa, 'Juan Pérez'
  expect(msg).toContain('• DB1082 — ')
  expect(msg).toContain('S/ 250.00')
  expect(msg).toContain('(-35%)')
  expect(msg).toContain('S/ 162.50')
  expect(msg).toContain('Subtotal: S/ 412.50')
  expect(msg).toContain('+7%: S/ 28.88')
  expect(msg).toContain('Total productos: S/ 441.38')
  expect(msg).toContain('Olva Courier — Arequipa (envío a cotizar)')
  expect(msg).toContain('✅ Acepto las políticas de compra, envíos y preventa.')
  expect(buildOrderMessage({ ...sampleOrder, paymentId:'paypal', location:'extranjero', country:'MX', deliveryId:'dhl' })).toContain('+ $10 USD')
  expect(buildProductMessage(preorderNoPrice, { kind:'consultar' })).toMatch(/precio/i)
  const link = waLink('Hola & #1 ñandú 👋 + más')
  expect(link.startsWith('https://wa.me/51941392619?text=')).toBe(true)
  expect(decodeURIComponent(link.split('text=')[1])).toBe('Hola & #1 ñandú 👋 + más')
  const long = buildOrderMessage({ ...sampleOrder, lines: Array.from({length:40}, () => sampleOrder.lines[0]) })
  expect(long.length).toBeLessThanOrEqual(1800); expect(long).toContain('DB1082')
  expect(() => buildOrderMessage({ ...sampleOrder, acceptedPolicies: false })).toThrow()
  expect(buildOrderMessage({ ...sampleOrder, lines: [...sampleOrder.lines, { product: preorderNoPrice, qty: 1 }] })).not.toContain(preorderNoPrice.code)
  ```
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implementar. Formato del mensaje exactamente como spec §9; compactación: si > 1800 caracteres, líneas pasan a `• CODE xQ — S/ X` sin título. Montos con `toFixed(2)`. **Step 5:** Run → PASS.
- [ ] **Step 6: Commit** `feat(shared): reglas de checkout y mensajes de WhatsApp`

### Task 7: Búsqueda, filtros, navegación y capa de datos

**Files:**
- Create: `src/shared/search.js`, `src/shared/navigation.js`, `src/lib/storage.js`, `src/lib/supabase.js`, `src/lib/products.js`
- Test: `tests/shared/search.test.js`, `tests/lib/products.test.js`, `tests/lib/storage.test.js`

**Interfaces:**
- Consumes: `normalizeText`, `CATEGORIES` (Task 3); `unitPrice` (Task 5).
- Produces:
  - `searchProducts(products, query: string): Product[]` — coincidencia exacta de `code` primero; luego todos los tokens deben aparecer en `code + title + editorial + label de categoría + year`.
  - `Filters = { q?, cat?: string[], orig?: 'original'|'replica', era?, tags?: string[], preorder?: boolean, discount?: boolean, min?: number, max?: number, sold?: boolean, sort?: 'new'|'price-asc'|'price-desc'|'discount' }`
  - `filterProducts(products, filters): Product[]` — oculta `sold` salvo `filters.sold`.
  - `sortProducts(products, sort): Product[]` — vendidos siempre al final.
  - `filtersFromParams(URLSearchParams): Filters` / `filtersToParams(Filters): URLSearchParams`
  - `NAV_ITEMS: { id, label, filters: Filters }[]` en el orden de spec §8 (Preventas, Dragon Ball, Pokémon, Caballeros del Zodiaco, Digimon, Mundiales y Fútbol, Variados, Retro, Ofertas, Combos, Sobres); `matchesNavItem(product, item): boolean`; `visibleNavItems(products): NavItem[]` (oculta los vacíos).
  - `safeStorage: { get(key, fallback), set(key, value) }` — JSON, nunca lanza.
  - `PUBLIC_COLUMNS: string` (lista exacta de spec §8).
  - `fetchPublicProducts(client = supabase): Promise<Product[]>`
  - `useProducts(): { products: Product[], loading: boolean, error: Error|null }` — pinta desde `safeStorage('vv:products:v1')` y revalida en segundo plano. Con `VITE_USE_FIXTURES=true` devuelve `tests/fixtures/products.js` (para desarrollar la interfaz sin Supabase).

- [ ] **Step 1: Tests search:**
  ```js
  expect(searchProducts(P, 'db1082')[0].code).toBe('DB1082')
  expect(searchProducts(P, 'navarrete 1999').map(p=>p.code)).toContain('DB1082')
  expect(searchProducts(P, 'pokemon').length).toBeGreaterThan(0)   // sin tilde encuentra "Pokémon"
  expect(filterProducts(P, {}).some(p=>p.status==='sold')).toBe(false)
  expect(filterProducts(P, { sold: true }).some(p=>p.status==='sold')).toBe(true)
  expect(filterProducts(P, { orig: 'replica' }).every(p=>p.is_original===false)).toBe(true)
  expect(filterProducts(P, { discount: true }).every(p=>p.discount_percent>0)).toBe(true)
  expect(sortProducts(P, 'price-asc').at(-1).status).toBe('sold')
  const f = { q:'goku', cat:['dragon-ball'], orig:'original', sort:'price-asc' }
  expect(filtersFromParams(filtersToParams(f))).toEqual(f)
  expect(visibleNavItems([]).length).toBe(0)
  ```
- [ ] **Step 2: Tests storage/products:** `safeStorage.get` con `localStorage.getItem` que lanza → devuelve fallback; con JSON inválido → fallback; `set` que lanza → no lanza. `fetchPublicProducts(mockClient)` llama `.from('products').select(PUBLIC_COLUMNS).in('status',['published','sold'])`. `useProducts` (renderHook) devuelve primero los productos cacheados y luego los del cliente mock.
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implementar. **Step 5:** Run → PASS.
- [ ] **Step 6: Commit** `feat: búsqueda en memoria, navegación y capa de datos con caché`

---

# Fase B — Interfaz pública (ejecutar con `/frontend-design:frontend-design`)

> Estructura de páginas: `docs/wireframes/home-wireframe.md`, con la taxonomía y reglas de spec §8. Estética, tokens y tarjetas: `CLAUDE.md`. Las decisiones visuales finas (composición del hero, ritmo de la grilla, stickers, microinteracciones) quedan a `/frontend-design`; lo que sigue fija comportamiento y datos. Desarrollar contra `tests/fixtures/products.js` si Supabase aún no tiene datos (`VITE_USE_FIXTURES=true` hace que `useProducts` devuelva los fixtures).

### Task 8: Lista de pedido (store)

**Files:**
- Create: `src/features/cart/cartStore.js`
- Test: `tests/features/cartStore.test.js`

**Interfaces:**
- Consumes: `safeStorage` (Task 7), `maxQty`, `isPriceOnRequest` (Task 5).
- Produces: `CartProvider` y `useCart(): { lines: {code, variant, qty}[], count, add(product, variant?), remove(code, variant?), setQty(code, variant, qty), clear(), revalidate(products): { lines, notices: string[] } }`. Clave de storage `vv:cart:v1`.

- [ ] **Step 1: Tests:** `add` dos veces una pieza única → qty 1; `add` producto con stock 4 cinco veces → qty 4; `add` preventa sin precio → no agrega; `revalidate` con producto ahora `sold` → línea eliminada y notice `"<code> ya fue vendido"`; con stock bajado de 4 a 2 y qty 4 → qty 2 y notice; con storage lanzando errores el provider renderiza y `add` funciona en memoria.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar con `useReducer` + contexto. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(cart): lista de pedido con tope de stock y revalidación`

### Task 9: Layout, navbar, buscador y botón flotante

**Files:**
- Create: `src/features/layout/{Layout,Navbar,Footer,FloatingWhatsApp}.jsx`, `src/features/catalog/SearchBox.jsx`
- Modify: `src/App.jsx` (rutas `/`, `/p/:code`, `/politicas`, `/admin/*` lazy)
- Test: `tests/features/layout.test.jsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `visibleNavItems`, `filtersToParams` (Task 7), `useCart` (Task 8), `waLink` (Task 6), `useProducts`.
- Produces: `<Layout>` con `<Outlet/>`; el buscador navega a `/?q=…`; chips de navbar navegan a `/?<filtros del item>`.

- [ ] **Step 1: Tests:** el logo `public/images/logo_vitrina_vintage.jpeg` está en la navbar con `alt="Vitrina Vintage"`; escribir `db1082` + Enter navega a `/?q=db1082`; el contador del carrito muestra `count`; el botón flotante es un enlace a `https://wa.me/51941392619…`; los chips mostrados son `visibleNavItems(products)`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar mobile-first (navbar sticky; chips con scroll horizontal; en escritorio, nav en una línea según wireframe §1). Footer con redes, WhatsApp y enlace a `/politicas`. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(ui): layout, navbar con buscador y WhatsApp flotante`

### Task 10: Home — hero, accesos, catálogo filtrable y tarjetas

**Files:**
- Create: `src/features/catalog/{Hero,CategoryTiles,ProductGrid,ProductCard,Filters,Badges,TrustSection}.jsx`, `src/pages/Home.jsx`
- Test: `tests/features/productCard.test.jsx`, `tests/features/home.test.jsx`

**Interfaces:**
- Consumes: `useProducts`, `searchProducts`, `filterProducts`, `sortProducts`, `filtersFromParams/ToParams`, `NAV_ITEMS` (Task 7); `unitPrice`, `listPrice`, `stockBadge`, `isPriceOnRequest` (Task 5); `buildProductMessage`, `waLink` (Task 6); `useCart` (Task 8).
- Produces: `<ProductCard product featured?>` reutilizado en admin; `<Badges product>`.

- [ ] **Step 1: Tests ProductCard** (con fixtures):
  - original → badge "Original"; `is_original=false` → "Réplica".
  - `discount_percent=35`, price 250 → muestra `S/ 162.50`, `S/ 250.00` tachado (`<s>` o `line-through`) y `-35%`.
  - stock 5 → "Quedan 5"; stock 3 → "Últimas unidades"; stock 1 → ninguno de los dos.
  - preventa sin precio → "Precio a consultar", botón "Consultar por WhatsApp" con `href` a `wa.me`, y **no** hay botón "+ a mi lista".
  - preventa con precio → badge "Preventa" y CTA "Reservar".
  - `status='sold'` → texto "Vendido" y CTA "Avísame si llega otro".
  - imagen usa `images[0].thumb`, `loading="lazy"` y `width/height`.
- [ ] **Step 2: Tests Home:** con `?q=db1082` solo se ve DB1082; el toggle "Mostrar vendidos" agrega los vendidos; cambiar un filtro actualiza la URL; el hero muestra productos con `featured_rank` ordenados, y si no hay, las preventas publicadas más recientes, y si tampoco, no renderiza la sección; la sección de confianza menciona "5 días".
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Implementar con `/frontend-design:frontend-design`: tarjeta (borde duro, sombra desplazada, press effect ≤120 ms), tarjeta doble ancho para `featured_rank` o descuento como máximo una cada 6–8, filtros en bottom sheet en móvil y columna lateral en escritorio, estado vacío con la carita `^ ^`. Grilla 2 col móvil / 4 col escritorio.
- [ ] **Step 5:** Run → PASS. Revisar visualmente a 360 px y 1280 px (`npm run dev`).
- [ ] **Step 6: Commit** `feat(ui): home con hero, catálogo filtrable y tarjetas`

### Task 11: Detalle de producto

**Files:**
- Create: `src/features/product/{ProductDetail,Gallery,VariantPicker}.jsx`, `src/pages/ProductPage.jsx`
- Test: `tests/features/productDetail.test.jsx`

**Interfaces:**
- Consumes: igual que Task 10; ruta `/p/:code` (código case-insensitive).
- Produces: —

- [ ] **Step 1: Tests:** `/p/db1082` muestra DB1082; código inexistente → mensaje "No encontramos este producto" con enlace al catálogo; producto con variantes obliga a elegir una antes de agregar, y el precio cambia según la variante; "+ a mi lista" agrega `{code, variant}`; galería navega entre `images` con botones accesibles; `extras` aparece en "Incluye"; barra inferior fija con CTA.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar (galería con swipe táctil + botones; `full` en detalle). Setear `document.title` y meta OG con `image_url`. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(ui): página de detalle con galería y variantes`

### Task 12a: Panel de lista y checkout

**Files:**
- Create: `src/features/cart/{CartPanel,CheckoutForm,OrderSummary}.jsx`
- Test: `tests/features/checkout.test.jsx`

**Interfaces:**
- Consumes: `useCart` (Task 8); `deliveryOptionsFor`, `paymentMethodsFor`, `COUNTRIES`, `buildOrderMessage`, `waLink` (Task 6); `subtotal`, `surchargeFor` (Task 5).

- [ ] **Step 1: Tests:** al abrir el panel se llama `revalidate` y se muestran los notices; cambiar ubicación a "Provincias" deja solo Olva y Shalom; "Efectivo contraentrega" solo aparece con "Entrega gratuita en punto de encuentro"; elegir Mercado Pago muestra el recargo 7 % y el total; Extranjero muestra selector de país, y PayPal con `ES` muestra la nota "podría aplicar"; el botón "Enviar pedido por WhatsApp" está deshabilitado hasta marcar la casilla de políticas y completar nombre y ciudad/país; con una preventa en la lista aparece el resumen de política de preventa; al enviar se abre `waLink(buildOrderMessage(...))`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar (panel lateral/bottom sheet; cantidades ± topadas con `maxQty`). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(ui): lista de pedido y checkout a WhatsApp`

### Task 12b: Página de políticas

**Files:**
- Create: `src/features/policies/PoliciesPage.jsx`, `src/features/policies/content.js`
- Test: `tests/features/policies.test.jsx`

- [ ] **Step 1: Tests:** pestañas "Lima gratis", "Envíos Perú", "Internacional DHL", "Preventas", "Garantía y reclamos"; la de reclamos dice "5 días"; `/politicas#preventas` abre esa pestaña; las pestañas son navegables con teclado (roles `tablist`/`tab`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar; `content.js` transcribe `docs/politicas_y_condiciones_de_vitrina_vintage.md` §1–5 (reclamos en 5 días). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(ui): guía de compra y envíos`

---

# Fase C — Importador y panel administrador

### Task 13: Importador masivo

**Files:**
- Create: `scripts/import-catalog.mjs`, `scripts/lib/scan.mjs`, `scripts/lib/images.mjs`, `scripts/lib/ocr.mjs`, `scripts/lib/upsertPlan.mjs`
- Test: `tests/scripts/scan.test.mjs`, `tests/scripts/upsertPlan.test.mjs`, `tests/scripts/images.test.mjs`

**Interfaces:**
- Consumes: `normalizeBaseName`, `prefixOf`, `sortPhotos`, `isIgnoredPath`, `resolveMeta` (Task 3); `parseBanner` (Task 4).
- Produces:
  - `scanCatalog(root: string): Promise<FileGroup[]>` donde `FileGroup = { key, prefix, files: { absPath, relPath, md5, photoIndex }[] }` (sin duplicados por md5, fotos ordenadas, todas las carpetas no ignoradas).
  - `ocrStrips(buffer): Promise<{ top: Buffer, bottom: Buffer }>` — 25 % superior e inferior, ×2, escala de grises.
  - `webpVariants(buffer): Promise<{ full: Buffer, thumb: Buffer, w: number, h: number }>` — 1200 px q80 / 480 px q75, `.rotate()`.
  - `createOcr(): Promise<{ read(buffer): Promise<{ text, confidence }>, close() }>`
  - `findExisting(candidate: { code, codeIsTemp, md5s, sourceKey }, existing: Row[]): Row | null` — orden code (no temporal) → md5 → source_key.
  - `planUpsert(candidate, existingRow | null): { action: 'insert'|'update-full'|'update-append', patch: object }`
  - `mergeByCode(candidates): Candidate[]` — fusiona grupos con el mismo código no temporal y agrega warning `merged_by_code`.

- [ ] **Step 1: Tests scan** con un árbol temporal (`fs.mkdtemp`) que replica: `_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (24).jpg`, la misma imagen en `_ 35__ DESC/`, `VITRINAdblic (16)a.jpg` + `(16)b.jpg`, `GRATIS/ARMABLE (1).jpg`, carpeta `_2 POKÉMON/SIN LICENCIA/`. Afirmar: `GRATIS` no aparece; `(24)` es un grupo con 2 relPaths y 1 md5 distinto; `(16)` es un grupo con fotos `[a,b]`.
- [ ] **Step 2: Tests upsertPlan:**
  ```js
  expect(findExisting({ code:'DB1082', codeIsTemp:false, md5s:['x'], sourceKey:'k' }, [{ code:'DB1082' }])).toEqual({ code:'DB1082' })
  expect(findExisting({ code:'TMP-ab12cd34', codeIsTemp:true, md5s:['m1'], sourceKey:'k' }, [{ code:'ZZ1', file_hashes:['m1'] }]).code).toBe('ZZ1')
  expect(findExisting({ code:'TMP-1', codeIsTemp:true, md5s:['n'], sourceKey:'vitrinadblic (24)' }, [{ code:'Q', file_hashes:[], source_key:'vitrinadblic (24)' }]).code).toBe('Q')
  expect(planUpsert(cand, null).action).toBe('insert')
  expect(planUpsert(cand, null).patch.status).toBe('draft')
  expect(planUpsert(cand, { status:'draft', admin_edited:false }).action).toBe('update-full')
  const p = planUpsert({ ...cand, price: 999, discountPercent: 35 }, { status:'published', admin_edited:true, price: 250, images:[{path:'a'}], file_hashes:['old'] })
  expect(p.action).toBe('update-append'); expect(p.patch.price).toBeUndefined(); expect(p.patch.discount_percent).toBe(35)
  expect(p.patch.file_hashes).toEqual(expect.arrayContaining(['old', ...cand.md5s]))
  expect(mergeByCode([c1DB1082, c2DB1082]).length).toBe(1)
  ```
- [ ] **Step 3: Tests images** con una imagen generada por sharp (1000×1000): `ocrStrips` devuelve franjas de 2000×500; `webpVariants` devuelve `full` con lado mayor 1200 y `thumb` 480, ambos webp.
- [ ] **Step 4:** Run → FAIL. **Step 5:** Implementar los módulos.
- [ ] **Step 6:** `import-catalog.mjs`: flags `--dry-run`, `--only "<subcarpeta>"`, `--limit N`, `--concurrency 3` (default 3). Flujo de spec §7 pasos 1–12: lee filas existentes una vez (`code, file_hashes, source_key, status, admin_edited, images`), OCR foto principal y luego las demás si faltan precio y código, código temporal `TMP-` + 8 hex del md5 de la principal, sube a `products/<code>/<n>-full.webp` y `-thumb.webp` con `upsert: true`, escribe `import-errors.json` con `{ file, group, stage, error, at }` y en dry-run `import-preview.json`. Al final imprime el resumen (archivos, grupos, insertados, actualizados, fusionados, con warnings, fallidos).
- [ ] **Step 7:** Run tests → PASS.
- [ ] **Step 8: Verificación real:** `npm run import -- --dry-run --only "_1 DRAGON BALL"` → `import-preview.json` con `DB1082` (precio 250, Navarrete, 1999, `is_original: true`). Luego `npm run import -- --dry-run` completo → sin errores fatales; los 4 duplicados de `_ 35__ DESC` aparecen como un solo producto con `discount_percent: 35`; ninguna entrada de `GRATIS`/`IMPORTANTE`. Ajustar `parseBanner` con nuevos fixtures si la preview muestra fallas sistemáticas (volver a Task 4 con el fixture que falla).
- [ ] **Step 9:** Con Supabase configurado: corrida real con `--only "_1 DRAGON BALL" --limit 10`, luego la misma corrida otra vez → la segunda reporta 0 insertados.
- [ ] **Step 10: Commit** `feat(import): importador masivo con OCR, webp y dedupe`

### Task 14: Autenticación de admin y API de escritura

**Files:**
- Create: `src/features/admin/{auth.js,AdminGuard.jsx,LoginPage.jsx,adminApi.js,AdminLayout.jsx}`
- Modify: `src/App.jsx` (rutas `/admin/login`, `/admin/revision`, `/admin/nuevo`, `/admin/productos`, todas lazy)
- Test: `tests/features/adminGuard.test.jsx`, `tests/features/adminApi.test.js`

**Interfaces:**
- Produces:
  - `useAdminSession(): { status: 'loading'|'anon'|'not-admin'|'admin', user, signIn(email, password), signOut() }` — admin = existe fila en `admins` para `auth.uid()`.
  - `<AdminGuard>` redirige a `/admin/login` si no es admin.
  - `adminApi`: `listDrafts({ category?, folder?, warningsOnly?, cleanOnly? })`, `listAll()`, `saveProduct(id, patch)` (marca `admin_edited: true`), `publish(id, patch)` (valida con `validateForPublish`, setea `status:'published'`, `published_at`), `hide(id)`, `markSold(id)` (stock 1 → 0 y `sold`), `decrementStock(id)` (al llegar a 0 → `sold`), `restock(id, n)`, `setFeatured(id, rank|null)`, `deleteProduct(id)` (fila + objetos de Storage), `uploadImages(code, files[]) → images[]`, `findDuplicates({ code, md5s })`, `folderOf(row): string` (de `source_files[0]`).

- [ ] **Step 1: Tests:** guard con sesión `anon` → redirige; `not-admin` → mensaje "Esta cuenta no tiene acceso"; `publish` con producto inválido rechaza con los mensajes de `validateForPublish` y no llama al cliente; `decrementStock` sobre stock 1 envía `{ stock: 0, status: 'sold' }`; `saveProduct` siempre incluye `admin_edited: true` (cliente Supabase mockeado).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS. **Step 5:** Verificar con `npm run build` que el chunk inicial no contiene código de `src/features/admin` (revisar `dist/assets`).
- [ ] **Step 6: Commit** `feat(admin): login con Supabase Auth, guard y API de escritura`

### Task 15: Revisión rápida

**Files:**
- Create: `src/features/admin/{ReviewQueue.jsx,ProductForm.jsx,useReviewShortcuts.js}`
- Test: `tests/features/reviewQueue.test.jsx`

**Interfaces:**
- Consumes: `adminApi` (Task 14), `validateForPublish` (Task 5), `CATEGORIES`.
- Produces: `<ProductForm value onChange errors />` (reutilizado en Tasks 16 y 17); `useReviewShortcuts({ onApprove, onSkip, onPrev, onHide, onPhoto })`.

- [ ] **Step 1: Tests:** muestra el primer draft con campos prellenados y `raw_ocr_text` plegable; `ocr_warnings` visibles; `code_is_temp` resaltado; `Ctrl+Enter` aprueba y pasa al siguiente (llama `publish`); `Enter` en un campo de una línea aprueba; con foco en `textarea`, `S`/`H` escriben texto y no disparan atajos; fuera de campos, `S`/`→` salta, `←` vuelve, `H` oculta, `2` muestra la segunda foto; producto inválido → el botón muestra lo que falta y no avanza; filtro por carpeta reduce la cola; contador `n / total`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar (dos columnas en escritorio, foto arriba y botón fijo en móvil; prefetch de `images[0].full` del siguiente). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(admin): revisión rápida con aprobar y siguiente`

### Task 16: Nuevo producto con OCR en el navegador

**Files:**
- Create: `src/features/admin/{NewProduct.jsx,browserOcr.js,browserImages.js}`
- Test: `tests/features/newProduct.test.jsx`, `tests/features/browserImages.test.js`

**Interfaces:**
- Consumes: `parseBanner`, `licenseFromText`; `adminApi.uploadImages`, `findDuplicates`, `saveProduct`, `publish`; `<ProductForm>`.
- Produces:
  - `browserOcr.read(file: File): Promise<{ text, confidence }>` — carga tesseract.js con `import()` dinámico, recorta franjas superior e inferior (25 %) en canvas, ×2, gris.
  - `browserImages.toWebpVariants(file): Promise<{ full: Blob, thumb: Blob, w, h }>` — canvas `toBlob('image/webp', 0.8 | 0.75)`, 1200/480 px.
  - `md5OfFile(file): Promise<string>` (librería pequeña, p. ej. `spark-md5`).

- [ ] **Step 1: Tests** (OCR y canvas mockeados): al elegir fotos se llama `read` y el formulario se prellena con `parseBanner`; si `findDuplicates` encuentra un producto, aparece "Agregar fotos al producto existente"; "Guardar borrador" guarda `status:'draft'`; "Publicar" respeta `validateForPublish`; sin código se propone `TMP-<8 hex del md5>`; marcar "Preventa" permite publicar sin precio. `toWebpVariants` calcula dimensiones correctas para 3000×2000 → full 1200×800, thumb 480×320.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar (input con `accept="image/*"` y `capture` opcional, multi-archivo; indicador de progreso de OCR). **Step 4:** Run → PASS.
- [ ] **Step 5:** Verificación manual: subir `public/catalogo/WhatsApp Image 2026-11-24 at 2.31.52 PM.jpeg` (preventa DBZ), marcar preventa, publicar sin precio → aparece en la home con "Precio a consultar".
- [ ] **Step 6: Commit** `feat(admin): alta de productos con OCR en el navegador`

### Task 17: Listado de productos del admin

**Files:**
- Create: `src/features/admin/ProductsAdmin.jsx`
- Test: `tests/features/productsAdmin.test.jsx`

**Interfaces:**
- Consumes: `adminApi` (Task 14), `searchProducts` (Task 7), `<ProductForm>` (Task 15).

- [ ] **Step 1: Tests:** búsqueda incluye drafts y ocultos; fila con stock 1 muestra "Marcar como vendido" y no "−1 vendido"; stock 5 muestra "−1 vendido" y campo reponer; "Destacar" pide posición y llama `setFeatured`; "Eliminar" pide confirmación antes de `deleteProduct`; reordenar fotos guarda `images` y `image_url = images[0].full`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(admin): listado con vendido, stock, destacar y edición`

### Task 18: Rendimiento, despliegue y verificación final

**Files:**
- Create: `public/_redirects` (Netlify) **o** `vercel.json` (según hosting elegido), `README.md` (cómo correr, importar, crear admin, desplegar)
- Modify: `vite.config.js` (`manualChunks` para admin/tesseract si hiciera falta)

- [ ] **Step 1:** `npm run build` y medir: chunk inicial < 200 KB gzip (`npx vite-bundle-visualizer` o tamaño gzip de `dist/assets/index-*.js`); ningún asset inicial importa `tesseract`.
- [ ] **Step 2:** `grep -r "SERVICE_ROLE" dist/` → sin resultados.
- [ ] **Step 3:** Lighthouse móvil sobre `npm run preview` (Home con datos reales): performance ≥ 85, accesibilidad ≥ 90. Corregir lo que baje de ahí.
- [ ] **Step 4:** Reescritura SPA de todas las rutas a `index.html`; probar recargar `/p/db1082` y `/admin/revision` en el preview.
- [ ] **Step 5:** `node scripts/verify-rls.mjs` → `RLS OK`. `npm test` → todo PASS.
- [ ] **Step 6:** Flujo completo en celular real o emulación 360 px: buscar `DB1082` → agregar → checkout Olva/Provincias/Mercado Pago → se abre WhatsApp con el mensaje correcto a `51941392619`.
- [ ] **Step 7: Commit** `chore: configuración de despliegue y verificación final`
