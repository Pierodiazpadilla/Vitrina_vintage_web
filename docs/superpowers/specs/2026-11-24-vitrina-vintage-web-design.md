# Diseño — Web comercial Vitrina Vintage

**Fecha:** 2026-11-24 · **Estado:** cerrado, pendiente de aprobación final del dueño
**Stack (decidido por el dueño):** React + Vite + Tailwind + Supabase (Postgres, Storage, Auth)

Referencias obligatorias:
- Identidad visual y reglas de UI: `CLAUDE.md`
- Reglas de negocio (pagos, envíos, preventas, reclamos): `docs/politicas_y_condiciones_de_vitrina_vintage.md`
- Estructura de la home: `docs/wireframes/home-wireframe.md`
- Catálogo crudo (no versionado): `raw-catalog/` · Fotos de muestra de preventas: `public/catalogo/`

---

## 1. Intención

Vitrina Vintage vende álbumes de figuritas coleccionables (Dragon Ball, Pokémon, Caballeros del Zodiaco, Digimon, fútbol, variados retro y modernos; originales y réplicas) a clientes de Lima, provincias y el extranjero que llegan desde Instagram, TikTok y Facebook, casi siempre desde el celular. Hoy el catálogo vive como ~500 fotos con un banner de texto (precio, descripción, editorial, año, código) y la venta se cierra por WhatsApp.

La web debe:
1. **Poner el catálogo completo en línea sin cargarlo a mano**, leyendo el banner de cada foto.
2. **Que el cliente encuentre y entienda el producto en segundos** (código, nombre, editorial, categoría; original o réplica; precio y descuento).
3. **Que el pedido llegue al WhatsApp ya armado** y respetando las políticas (entrega, método de pago, recargos, aceptación de políticas), para que el dueño no tenga que preguntar lo básico.
4. **Que el dueño mantenga el catálogo solo**, subiendo fotos nuevas y publicando en segundos.

### Metas
- Importar el catálogo existente de forma idempotente y sin duplicados.
- Revisar y publicar el lote inicial rápidamente (flujo "Aprobar y siguiente" con teclado).
- Catálogo público rápido en datos móviles; búsqueda instantánea.
- Checkout a WhatsApp con las reglas de pago/envío de las políticas.

### No-metas
- Pago online integrado (pasarela, cobro con tarjeta en la web). Mercado Pago se usa vía link que envía el dueño por WhatsApp.
- Cálculo automático del costo de envío (Olva, Shalom, motorizado, DHL se cotizan por WhatsApp).
- Cuentas de cliente, historial de pedidos, inventario multi-unidad avanzado.
- Multi-administrador con roles.

### Anti-metas (sería un fracaso aunque funcione)
- Publicar un precio mal leído por OCR sin que el dueño lo haya visto.
- Productos duplicados en el catálogo.
- Que alguien sin cuenta de admin pueda escribir en la base de datos o el Storage.
- Un catálogo lento en celular (imágenes originales de 1–4 MB, consultas por cada tecla).
- Look genérico de IA (ver `CLAUDE.md`).

---

## 2. Hallazgos sobre el catálogo real (`raw-catalog/`)

- 546 archivos, 426 MB (jpg/JPG/jpeg/png; 64 pasan de 1 MB).
- Raíz real: `raw-catalog/Catálogo Vitrina Vintage-<timestamp>/Catálogo Vitrina Vintage/`. El importador recorre `raw-catalog/` recursivamente y no depende de ese nombre.
- Carpetas:
  ```
  _1 DRAGON BALL/{LICENCIADOS, SIN LICENCIA}
  _2 POKÉMON/{LICENCIADOS, SIN LICENCIA}
  _3 CABALL DEL ZOD/{LICENCIADOS, SIN LICENCIA}
  _4 DIGIMON/                       (sin subcarpeta de licencia)
  _5 FUTBOL/                        (sin subcarpeta de licencia)
  _6 VARIADO/LICENCIADOS/{MODERNAS , VIGENTES, RETRO}
  _6 VARIADO/SIN LICENCIA/{MODERNAS, RETRO}
  _ 35__ DESC/                      (descuento 35 %; mezcla productos de varias categorías)
  GRATIS/, IMPORTANTE/, BIENVENIDO.JPG, ...   (no son productos → se ignoran)
  ```
- **Banner:** la mayoría tiene texto **arriba** con el formato
  `"250 soles. Dragon Ball Z 3 álbum + caja de 100 sobres sellados. Navarrete original, año 1999. (Cod. DB1082)"`.
  Algunas lo tienen **abajo** y sin código: `"Album WALT DISNEY TU Y YO y set completo a pegar - Replica de excelente calidad / Versión TAPA BLANDA a 60 soles"`.
  Casi todas tienen además un **aviso legal abajo** ("SOLO SE ACEPTAN RECLAMOS…") que **no** es dato del producto y debe descartarse.
- **Varias fotos por producto:** `VITRINAdblic (16)a.jpg`, `VITRINAdblic (16)b.jpg`. Hay variantes de nombre: sufijo en mayúscula (`(0)C`), sufijo numérico (`(10)4.jpg.jpg`), doble extensión (`.jpg.jpg`).
- **Prefijo del archivo = categoría + licencia:** `dblic` (Dragon Ball, licenciado), `db` (Dragon Ball, sin licencia), `pokemon…`, `cabdz…`, `digimon` / `digimonlic`, `fut`, `varlicm` / `varlicr` (variado licenciado moderno/retro), `varm` / `varr` (variado sin licencia moderno/retro), `varlic`.
- **`_ 35__ DESC` duplica productos:** 4 de sus 15 archivos son idénticos por nombre a archivos de `_1 DRAGON BALL/LICENCIADOS/`.
- Las 5 fotos de `public/catalogo/` (preventas DBZ, Yu Yu Hakusho, Street Fighter II; Saint Seiya 40th; Naruto) **no** están en `raw-catalog/` y no siguen el formato de banner → se cargan desde `/admin`.

---

## 3. Enfoques considerados

| | Enfoque | Trade-off | Decisión |
|---|---|---|---|
| **1** | **Todo en cliente con módulo compartido.** `parseBanner()` común para el script Node y `/admin`; OCR con tesseract.js en el navegador del admin; catálogo cargado una vez y filtrado en memoria. | Sin servidor propio ni costos extra; búsqueda instantánea. El primer OCR en `/admin` descarga ~15 MB de datos de idioma (luego queda en caché). | **Elegido por el dueño** |
| 2 | OCR en Supabase Edge Functions + búsqueda con Postgres full-text. | Edge Functions (Deno) no soportan `sharp`; tesseract ahí es frágil; cada búsqueda es un viaje de red en datos móviles. Solo vale con decenas de miles de productos. | Descartado |
| 3 | Sitio estático generado en build (Astro/SSG). | Rápido, pero cada cambio de stock exige rebuild y deploy; contradice el stack elegido. | Descartado |

---

## 4. Arquitectura

```
                       ┌──────────────────────────────┐
 raw-catalog/ ──► scripts/import-catalog.mjs (Node, local, service_role)
                       │  sharp + tesseract.js + parseBanner()
                       ▼
               ┌──────────────── Supabase ────────────────┐
               │ Postgres: products, admins               │
               │ Storage:  bucket "catalog" (lectura pública)
               │ Auth:     email/contraseña (solo admin)  │
               └──────────────────────────────────────────┘
                 ▲ lectura anon (RLS)        ▲ escritura autenticada (RLS)
                 │                           │
   React SPA ── Catálogo público        React SPA ── /admin (login + revisión + alta)
                                              tesseract.js en navegador + parseBanner()
```

### Estructura de archivos (propuesta)
```
supabase/
  schema.sql                 tablas, índices, RLS, bucket y políticas de Storage
scripts/
  import-catalog.mjs         importador masivo
src/
  shared/                    código usado por Node y navegador (JS puro, sin deps de DOM/Node)
    parseBanner.js
    catalogRules.js          mapa de carpetas/prefijos → category, is_original, era, descuento
    fileGrouping.js          nombre base normalizado + sufijo de foto
    pricing.js               precio final, descuento, recargos
  lib/supabase.js            cliente con anon key
  features/catalog/          home, grilla, filtros, búsqueda, detalle
  features/cart/             lista de pedido (localStorage) + checkout WhatsApp
  features/admin/            login, revisión rápida, alta de producto, listado
  pages/                     Home, ProductDetail, Policies, Admin*
tests/                       vitest: parseBanner, fileGrouping, pricing, checkout
.env.example                 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WHATSAPP_NUMBER,
                             SUPABASE_SERVICE_ROLE_KEY (solo script, nunca con prefijo VITE_)
```

---

## 5. Base de datos — `supabase/schema.sql`

### Tabla `products`
Incluye todos los campos pedidos (`id, code, title, price, category, condition, editorial, year, extras, image_url, status, created_at`) más los acordados en el diseño.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `code` | text **unique not null** | Código del banner (`DB1082`, `VR1149`). Si no hay, temporal `TMP-<8 hex del md5>`; editable en admin. Se guarda en mayúsculas. |
| `code_is_temp` | boolean default false | Para resaltar en revisión. |
| `title` | text not null | |
| `price` | numeric(10,2) | Precio de lista en soles. Null permitido solo en `draft`. |
| `discount_percent` | smallint default 0, check 0–90 | 35 si viene de `_ 35__ DESC`. |
| `category` | text not null | Valores: `dragon-ball`, `pokemon`, `caballeros-del-zodiaco`, `digimon`, `futbol`, `variado`, `anime` (para cargas manuales). Etiqueta visible en el front. |
| `is_original` | boolean **nullable** | `true` = licenciado/original, `false` = réplica/sin licencia, `null` = desconocido (fuerza revisión). |
| `era` | text nullable check in (`retro`,`moderna`) | |
| `condition` | text | Estado legible ("Sellado", "Set completo a pegar", "Lleno", "Incompleto"…). |
| `tags` | text[] default '{}' | Etiquetas normalizadas para filtros/badges: `sellado`, `set-a-pegar`, `completo`, `tapa-dura`, `tapa-blanda`, `incompleto`, `combo` (el banner une productos con "+"), `sobres` (menciona sobres/paquetones/caja de sobres). |
| `variants` | jsonb default '[]' | Versiones con precio propio: `[{ "label": "Tapa dura", "price": 250 }, { "label": "Tapa blanda", "price": 60 }]`. Vacío = producto de una sola versión y vale `price`. Si hay variantes, `price` = la más barata (para ordenar y mostrar "desde"). |
| `featured_rank` | smallint nullable | Orden en el hero de la home (1 = primero). Null = no destacado. Lo fija el admin. |
| `editorial` | text | Navarrete, Panini, etc. |
| `year` | smallint | |
| `extras` | text | Lo que incluye ("+ caja de 100 sobres sellados"). |
| `stock` | integer not null default 1, check ≥ 0 | 1 = pieza única. >1 = varias unidades. Al llegar a 0 el producto pasa a `sold`. Las preventas no consumen stock. |
| `is_preorder` | boolean default false | Preventa: pago total, política de preventa. Puede publicarse con `price` nulo/0 ("Precio a consultar"). |
| `preorder_eta` | text | Fecha/rango estimado. |
| `images` | jsonb default '[]' | Array ordenado `[{ "path": "...", "full": "<url>", "thumb": "<url>", "w": n, "h": n }]`. |
| `image_url` | text | Portada (= `images[0].full`), por compatibilidad y para OG tags. |
| `status` | text not null default 'draft', check in (`draft`,`published`,`sold`,`hidden`) | |
| `raw_ocr_text` | text | Texto OCR completo (arriba + abajo) para la revisión. |
| `ocr_warnings` | text[] | P. ej. `price_missing`, `code_missing`, `license_unknown`, `low_confidence`. |
| `source_files` | text[] | Rutas relativas en `raw-catalog/`. |
| `file_hashes` | text[] | MD5 de cada archivo origen (dedupe). |
| `source_key` | text | Nombre base normalizado (`vitrinadblic (24)`), dedupe de respaldo. |
| `admin_edited` | boolean default false | Se activa cuando el admin guarda; el importador no pisa campos de filas editadas. |
| `created_at`, `updated_at`, `published_at` | timestamptz | `updated_at` por trigger. |

Índices: `unique(code)`, `gin(file_hashes)`, `index(source_key)`, `index(status)`, `index(category)`.

### Tabla `admins`
`user_id uuid PK references auth.users`. El dueño se agrega a mano una vez. Función `is_admin()` (`security definer`) = `exists(select 1 from admins where user_id = auth.uid())`.

### RLS
- `products`: **select** para `anon` y `authenticated` cuando `status in ('published','sold')`; select de todo para `is_admin()`. **insert/update/delete** solo `is_admin()`.
- `admins`: sin acceso público; select propio para el usuario autenticado.
- El script de importación usa la `service_role` key (salta RLS) y corre solo en la máquina del dueño/desarrollador.

### Storage
- Bucket `catalog`, **público para lectura**.
- Políticas de `storage.objects`: insert/update/delete solo `is_admin()`.
- Rutas: `products/<code>/<n>-full.webp` y `products/<code>/<n>-thumb.webp`. Si el código cambia en admin, las rutas no se renombran (se guardan en `images`).

---

## 6. Módulos compartidos (`src/shared/`)

### `fileGrouping.js`
- `normalizeBaseName(filename)` → `{ key, photoIndex }`:
  1. Quitar extensiones repetidas (`.jpg.jpg`, `.JPG`, `.jpeg`, `.png`).
  2. Pasar a minúsculas y colapsar espacios.
  3. Separar el sufijo de foto después del paréntesis: `vitrinadblic (16)a` → key `vitrinadblic (16)`, sufijo `a`. Sufijos aceptados: una letra (`a`–`z`) o un dígito (`(10)4`). Sin sufijo = foto principal.
  4. Orden de fotos dentro del grupo: sin sufijo primero, luego alfabético/numérico.
- `prefixOf(key)` → `dblic`, `varlicm`, etc. (texto entre `vitrina` y ` (`).

### `catalogRules.js`
- **Carpetas ignoradas:** `GRATIS`, `IMPORTANTE` y archivos sueltos en la raíz del catálogo (`BIENVENIDO.JPG`, etc.).
- **Carpeta → metadatos** (gana sobre el prefijo cuando ambas existen):
  - `_1 DRAGON BALL` → `dragon-ball`; `_2 POKÉMON` → `pokemon`; `_3 CABALL DEL ZOD` → `caballeros-del-zodiaco`; `_4 DIGIMON` → `digimon`; `_5 FUTBOL` → `futbol`; `_6 VARIADO` → `variado`.
  - `LICENCIADOS` → `is_original = true`; `SIN LICENCIA` → `false`.
  - `RETRO` → `era = retro`; `MODERNAS`, `MODERNAS , VIGENTES` → `era = moderna`.
  - `_ 35__ DESC` → `discount_percent = 35` (no aporta categoría).
- **Prefijo → metadatos** (respaldo, imprescindible para `_ 35__ DESC`, `_4 DIGIMON`, `_5 FUTBOL`): sufijo `lic` en el prefijo ⇒ original; `m`/`r` final en `var…` ⇒ era. Tabla exacta en el código, cubierta por tests con los prefijos reales del catálogo.
- **Texto OCR** como último respaldo para `is_original`: "original", "licenciado" ⇒ true; "réplica", "replica", "reimpresión", "no oficial" ⇒ false. Si aun así queda desconocido ⇒ `null` + warning `license_unknown`.
- La comparación de nombres de carpeta ignora mayúsculas, tildes y espacios extra.

### `parseBanner(text)` → `{ price, title, condition, tags, editorial, year, code, extras, isOriginalHint, warnings }`
Recibe el texto OCR de la franja superior y la inferior (concatenado, con marcador de franja).
1. **Limpiar:** descartar líneas del aviso legal (contienen "RECLAMOS", "SOLO SE ACEPTAN", "NO NOS HACEMOS RESPONSABLES", "COLECCIÓN REVISADA"); unir líneas partidas; normalizar comillas y espacios.
2. **Código:** `/cod\.?\s*([A-Z]{2})\s*-?\s*(\d{3,5})/i` → `DB1082`. Tolerar confusiones típicas de OCR en la parte numérica (`O`→`0`, `l`/`I`→`1`) solo dentro del código.
3. **Precio:** coincidencias de `(\d{1,4}(?:[.,]\d{2})?)\s*soles` o `s\/\.?\s*(\d{1,4})`. Si hay una, es `price`. Si hay varias, se proponen `variants` tomando como etiqueta el texto inmediatamente anterior a cada precio (p. ej. "Versión TAPA BLANDA"), `price` = la menor, y warning `multiple_prices` para que el admin confirme.
4. **Año:** `año\s*(19|20)\d{2}` o un `(19|20)\d{2}` aislado que no sea parte del código ni del título de un Mundial (si el título contiene "Mundial/World Cup" y hay un solo año, ese es el año).
5. **Editorial:** diccionario (Navarrete, Panini, Salo, Cromy, Pacosa, Bandai, Upper Deck, Topps, Merlin…), insensible a mayúsculas. El builder puede ampliarlo.
6. **Estado/tags:** palabras clave → `sellado(s)`, `set completo a pegar`/`a pegar`, `lleno`/`completo`, `incompleto`, `tapa dura`, `tapa blanda`.
7. **Título:** la oración del banner que queda tras quitar precio, código, editorial/año; recortada a ~90 caracteres en el límite de palabra. **Extras:** lo que sigue a "+" o "incluye".
8. Warnings: `price_missing`, `code_missing`, `title_missing`, `low_confidence` (confianza media de tesseract < 70).

**Prueba de aceptación del parser:** tests con los textos reales de al menos estas fotos:
`_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg` (→ 250, DB1082, Navarrete, 1999, original),
`_5 FUTBOL/VITRINAfut (16)b.jpg` (→ 250, VR1149, Panini, 2026, tapa dura),
`_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg` (→ 60, sin código, réplica, tapa blanda, set completo a pegar; texto abajo).
El builder transcribe más ejemplos reales (≥ 15, de todas las carpetas) como fixtures.

### `pricing.js`
- `finalPrice = round2(price * (1 - discount_percent/100))`.
- Recargos sobre el subtotal de productos ya descontado (ver §9).

---

## 7. Importador — `scripts/import-catalog.mjs`

**Uso:** `node scripts/import-catalog.mjs [--dry-run] [--only "<subcarpeta>"] [--limit N] [--concurrency 3]`
Lee `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de `.env` (no versionado).

### Pipeline
1. **Escanear** `raw-catalog/` recursivamente (jpg/jpeg/png, cualquier mayúscula), ignorando carpetas excluidas.
2. Por archivo: MD5, `normalizeBaseName`, metadatos de carpeta y prefijo.
3. **Agrupar** por `key` (nombre base normalizado) **a través de todas las carpetas**: así `VITRINAdblic (24).jpg` en `_1 DRAGON BALL/LICENCIADOS` y en `_ 35__ DESC` caen en el mismo grupo. Archivos con el mismo MD5 dentro de un grupo se suben una sola vez.
4. **Metadatos del grupo:** categoría, `is_original` y `era` de la carpeta no-descuento si existe (si no, del prefijo); `discount_percent = 35` si algún archivo del grupo estaba en `_ 35__ DESC`.
5. **OCR** (tesseract.js, idioma `spa`, un worker reutilizado):
   - Para cada foto del grupo, recortar con `sharp` la **franja superior (25 %)** y la **inferior (25 %)**, escalar ×2 y pasar a escala de grises para mejorar lectura.
   - Probar primero la foto principal; si `parseBanner` no encuentra precio ni código, probar las demás fotos del grupo. Unir campos: el primer valor no vacío gana.
6. **Código:** del banner; si falta, `TMP-` + 8 hex del MD5 de la foto principal, `code_is_temp = true`.
7. **Dedupe contra la base (en este orden):**
   1. `code` (si no es temporal) coincide con una fila existente;
   2. algún MD5 del grupo está en `file_hashes` de una fila existente;
   3. `source_key` coincide.
   La primera coincidencia define la fila a actualizar; si no hay ninguna, se inserta.
   Si dos **grupos distintos** del mismo lote obtienen el mismo `code` por OCR, se fusionan en un solo producto y se agrega warning `merged_by_code` para que el admin lo verifique.
8. **Imágenes:** cada foto → `full.webp` (lado mayor 1200 px, calidad ~80) y `thumb.webp` (lado mayor 480 px, calidad ~75), con `sharp().rotate()` para respetar EXIF. Subida con `upsert: true`.
9. **Upsert:**
   - Fila nueva → `status = 'draft'`, todos los campos del OCR.
   - Fila existente con `admin_edited = false` y `status = 'draft'` → se actualizan campos y se agregan imágenes/hashes nuevos.
   - Fila existente editada por el admin o ya publicada → **solo** se agregan imágenes/hashes/`source_files` nuevos y se aplica `discount_percent` si llegó de `_ 35__ DESC`; nunca se pisan textos ni precio.
10. **Errores:** cualquier fallo de un archivo o grupo (lectura, OCR, subida, upsert) se registra y el proceso continúa. Al final se escribe `import-errors.json` en la raíz del repo (ignorado por git):
    ```json
    [{ "file": "...", "group": "vitrinadblic (24)", "stage": "ocr|upload|upsert|read", "error": "mensaje", "at": "ISO" }]
    ```
    Se imprime un resumen: archivos, grupos, insertados, actualizados, fusionados, con warnings, fallidos.
11. **Idempotente:** volver a correrlo no crea duplicados ni pisa ediciones.
12. `--dry-run` no sube nada: escribe `import-preview.json` con lo que haría (útil para afinar el parser).

---

## 8. Catálogo público

### Rutas
- `/` — Home según `docs/wireframes/home-wireframe.md` (navbar con buscador y chips, hero vitrina, accesos por categoría, catálogo, confianza/FAQ, footer, botón flotante de WhatsApp).
- `/p/:code` — Detalle de producto (galería con swipe, ficha, badges, CTA).
- `/politicas` — Guía de compra y envíos en pestañas: Lima gratis · Envíos Perú · Internacional DHL · Preventas · Garantía y reclamos (contenido de las políticas).
- `/admin/*` — ver §10.
- El hosting debe reescribir todas las rutas a `index.html` (SPA).

### Taxonomía de la home (el diseño manda sobre el wireframe)
El wireframe se escribió antes de ver `raw-catalog/`; su **estructura** de página se mantiene, pero la navegación usa los datos reales:
- **Chips / tiles de la navbar y accesos por categoría:** Preventas (`is_preorder`) · Dragon Ball · Pokémon · Caballeros del Zodiaco · Digimon · Mundiales y Fútbol (`futbol`) · Variados · Retro (`era = retro`, cualquier categoría) · Ofertas (`discount_percent > 0`) · Combos (`tags` contiene `combo`) · Sobres (`tags` contiene `sobres`). Los tiles sin productos publicados no se muestran.
- **Ficha técnica de la tarjeta:** la del wireframe (stickers, páginas, minipósters, regalo) solo existe en las preventas; va dentro de `extras` como texto y se muestra en el detalle. La tarjeta muestra: badges, título, editorial · año, `condition`, precio.
- **Hero:** productos con `featured_rank` no nulo, ordenados; si no hay ninguno, el hero muestra las preventas publicadas más recientes; si tampoco hay, la sección no se renderiza.
- **Tarjeta doble ancho:** productos con `featured_rank` o `discount_percent > 0`, como máximo una cada 6–8 tarjetas.
- "Reserva con S/ [adelanto]" del wireframe se elimina: la política de preventa exige pago total.

### Datos y velocidad
- Al cargar: **una** consulta a `products` con solo las columnas públicas (`code, title, price, discount_percent, category, is_original, era, condition, tags, editorial, year, extras, is_preorder, preorder_eta, images, status, published_at`) y `status in ('published','sold')`. ~500 filas.
- Cache en memoria + `localStorage` (stale-while-revalidate): pinta al instante con lo guardado y refresca en segundo plano.
- Grilla usa `thumb.webp` con `loading="lazy"`, `width/height` explícitos y `srcset` thumb/full; el detalle usa `full`.
- Objetivo: LCP < 2,5 s en 4G simulado de Lighthouse móvil; bundle JS inicial < 200 KB gzip (el código de admin y tesseract.js van en chunks lazy que el público nunca descarga).

### Búsqueda y filtros (en memoria)
- Normalización: minúsculas, sin tildes, sin puntuación.
- Busca en `code`, `title`, `editorial`, etiqueta de `category`, `year`. Coincidencia exacta de código va primero (`db1082` → ese producto).
- Filtros: categoría, original/réplica, era, estado (`tags`: sellado, set a pegar, completo, tapa dura/blanda), preventa, con descuento, rango de precio.
- Orden: novedades (`published_at`), precio ↑/↓, mayor descuento.
- Productos `sold` ocultos por defecto; toggle "Mostrar vendidos" (aparecen atenuados con "Vendido" y CTA "Avísame si llega otro").
- Estado de filtros/búsqueda en la URL (`?q=&cat=&orig=`) para compartir enlaces desde redes.

### Tarjeta y badges
- Estructura y estilo según `CLAUDE.md` (foto → nombre → estado → precio → CTA).
- Badges: `Original` / `Réplica` (siempre visible; `null` no se publica, ver §10), `Preventa`, `-35%`, `Sellado`, `Set a pegar`, `Completo`, `Tapa dura`, `Retro`.
- Precio con descuento: precio final grande + precio original tachado + badge `-35%`.
- **Stock:** `stock = 1` no muestra nada extra. `stock > 1` muestra "Quedan X"; con `stock` 2–3 dice "Últimas unidades" (badge ámbar).
- **Preventa sin precio** (`is_preorder` y `price` nulo/0): muestra "Precio a consultar" y un único botón "Consultar por WhatsApp" (mensaje de un producto); no tiene "+ a mi lista".

---

## 9. Lista de pedido y checkout a WhatsApp

### Lista de pedido
- Persistida en `localStorage` (`code`, cantidad). Al abrir se revalida contra los datos actuales: si un producto pasó a `sold` u oculto, se marca y se excluye del mensaje.
- Cantidad máxima por línea = `stock` del producto (1 para piezas únicas); preventas con precio sin límite. Las preventas sin precio no pueden agregarse a la lista. Al revalidar, si el stock bajó, la cantidad se ajusta y se avisa.

### Formulario de checkout (en el panel de la lista)
1. **Ubicación:** Lima · Provincias (Perú) · Extranjero (país, texto libre).
2. **Modalidad de entrega** (opciones según ubicación):
   | Modalidad | Disponible en | Texto que se muestra |
   |---|---|---|
   | Entrega gratuita en punto de encuentro | Lima | Real Plaza Centro Cívico; Metropolitano: Naranjal, Canaval, Moreyra; Los Olivos/SMP (Canta Callao con Los Alisos o Naranjal). Selector de punto. |
   | Motorizado (InDrive) | Lima | Envío cotizado; se paga al recibir. Producto se paga antes del despacho. |
   | Motorizado propio del comprador | Lima | El comprador asume la responsabilidad del envío. |
   | Olva Courier | Lima y Provincias | Agencia o domicilio. Producto + envío se pagan antes. |
   | Shalom | Provincias | Solo agencia. Producto se paga antes; envío se paga en destino. |
   | DHL internacional | Extranjero | Referencial $55–80 USD por 3–4 kg; se cotiza. Producto + envío se pagan antes. |
3. **Método de pago** (opciones según ubicación/modalidad):
   | Método | Disponible | Recargo calculado |
   |---|---|---|
   | Yape / Plin | Perú | 0 |
   | Transferencia (BCP, BBVA, Interbank, Scotiabank) | Perú | 0 |
   | Efectivo contraentrega | **solo** con entrega gratuita en Lima | 0 |
   | Tarjeta (link Mercado Pago) | Perú | +7 % del subtotal |
   | Western Union / MoneyGram | Extranjero | 0 (comisión la asume el comprador en origen; se muestra el aviso) |
   | PayPal | Extranjero | + $10 USD fijos siempre; +8 % del subtotal si el país está en América. Para Europa/Asia se muestra "+8 % podría aplicar, se confirma por WhatsApp". La ubicación "Extranjero" usa un selector de país (lista de países con región). El sitio no convierte moneda: los $10 USD se muestran aparte. |
4. **Datos del cliente:** nombre; ciudad/distrito o país.
5. **Checkbox obligatorio:** "He leído y acepto las Políticas de Compra, Envíos y Preventa de Vitrina Vintage" con enlace a `/politicas`. Si la lista contiene preventas, se muestra además el resumen de la política de preventa (pago total; abonos no reembolsables al cierre).

### Resumen mostrado
Subtotal (con descuentos) · Recargo del método · **Total productos** · Envío: "Gratis" o "A cotizar por WhatsApp" (Shalom: "se paga en destino"; DHL: "referencial $55–80 USD").

### Mensaje de WhatsApp
`https://wa.me/<VITE_WHATSAPP_NUMBER>?text=<encodeURIComponent(mensaje)>`, por ejemplo:
```
Hola Vitrina Vintage 👋 Quiero hacer este pedido:

• DB1082 — Dragon Ball Z 3 álbum + caja de 100 sobres sellados — S/ 250.00
• VR1149 — Álbum Tapa dura Copa Mundial 2026 (-35%) — S/ 162.50

Subtotal: S/ 412.50
Pago: Tarjeta (link Mercado Pago) +7%: S/ 28.88
Total productos: S/ 441.38
Entrega: Olva Courier — Arequipa (envío a cotizar)
Nombre: Juan Pérez
✅ Acepto las políticas de compra, envíos y preventa.
```
- Si el mensaje supera ~1800 caracteres, se resumen los títulos (solo código + precio) para no romper el enlace.
- Los botones "Pedir/Reservar" de la tarjeta y el detalle generan un mensaje de un solo producto sin pasar por el formulario completo. *Llamada del diseñador: es el camino más rápido desde redes; el formulario completo queda para pedidos de varios productos.*

---

## 10. Panel administrador (`/admin`)

### Acceso
- `/admin/login`: Supabase Auth, email + contraseña. Sin registro público (deshabilitar signups en Supabase).
- Rutas de admin protegidas en el cliente (redirige si no hay sesión **o** si el usuario no está en `admins`); la protección real es la RLS de §5.
- Todo el código de admin (incluido tesseract.js) en chunks lazy.

### Vistas
1. **Revisión rápida** (`/admin/revision`) — prioridad del dueño.
   ```
   ┌──────────────────────────────┬──────────────────────────────────┐
   │  FOTO (zoom, flechas para    │ Código [DB1082] (TMP resaltado)  │
   │  cambiar entre fotos del     │ Título [.......................] │
   │  grupo)                      │ Precio [250]  Desc. [35 %]       │
   │                              │ Categoría [▾] Original [Sí/No/?] │
   │  Texto OCR crudo (plegable)  │ Era [▾] Editorial [ ] Año [ ]    │
   │                              │ Estado [ ] Tags [chips]          │
   │                              │ Extras [ ] Preventa [ ] ETA [ ]  │
   │                              │ ⚠ price_missing, license_unknown │
   │                              │ [Saltar] [Ocultar] [APROBAR ▶]   │
   └──────────────────────────────┴──────────────────────────────────┘
   Filtros: carpeta/categoría · solo con warnings · solo sin warnings   12 / 487
   ```
   - Cola de `status = 'draft'`, filtrable por categoría y por carpeta de origen (derivada de `source_files`) para publicar primero un lote de demostración.
   - **Aprobar y siguiente**: guarda, marca `admin_edited = true`, `status = 'published'`, `published_at = now()` y carga el siguiente.
   - **Atajos:** `Enter` o `Ctrl+Enter` = Aprobar y siguiente (con el foco en un campo de una línea); `S` / `→` = saltar; `←` = anterior; `H` = ocultar; `1`–`9` = cambiar de foto. Fuera de los campos de texto, las letras funcionan como atajos.
   - **Validación antes de publicar:** precio > 0 (salvo preventas, que admiten precio vacío = "Precio a consultar"), stock ≥ 1, título, categoría e `is_original` definidos (no `null`), código no vacío y único. Si falta algo, el botón muestra qué falta y no publica. `code_is_temp` se puede publicar, pero aparece resaltado.
   - Prefetch de la foto del siguiente producto para que el cambio sea instantáneo.
   - Funciona en escritorio (dos columnas) y en celular (foto arriba, campos abajo, botón fijo).
2. **Nuevo producto** (`/admin/nuevo`)
   - Subir 1–N fotos (cámara o galería). En el navegador: recorte de franjas superior e inferior (canvas), OCR con tesseract.js (`spa`), `parseBanner()`, conversión a webp full/thumb (canvas `toBlob('image/webp')`), subida a Storage.
   - El formulario se prellena y se puede editar → "Guardar borrador" o "Publicar" (misma validación).
   - Antes de insertar, dedupe por `code` y por MD5 (calculado en el navegador); si existe, ofrece "Agregar fotos al producto existente".
3. **Productos** (`/admin/productos`)
   - Tabla/lista buscable (misma búsqueda que el público, incluyendo drafts y ocultos).
   - Acciones rápidas por fila: con `stock = 1` **Marcar como vendido** (stock 0 → `sold`); con `stock > 1` **−1 vendido** (al llegar a 0 → `sold`) y campo para reponer stock; **Destacar** (fija `featured_rank`); Publicar/Ocultar, Editar, cambiar descuento, reordenar/eliminar fotos.
   - Eliminar producto: borra fila e imágenes (con confirmación).

---

## 11. Seguridad

- `anon key` en el front solo permite lo que la RLS deja (lectura de publicados/vendidos y lectura pública del bucket).
- `service_role key` solo en `.env` local para el importador; nunca con prefijo `VITE_`, nunca en el repo, nunca en el hosting del front.
- Signups deshabilitados; un único usuario admin agregado a `admins`.
- `.gitignore` ya cubre `.env`, `.env.local`, `raw-catalog/`; agregar `import-errors.json` e `import-preview.json`.

---

## 12. Pruebas y criterios de aceptación

- **Unit tests (vitest):** `parseBanner` con fixtures reales, `normalizeBaseName`/agrupación (incluye `(16)a`, `(0)C`, `(10)4.jpg.jpg`, `.jpg.jpg`), `catalogRules` con todos los prefijos reales, `pricing` (descuento + recargos), generación del mensaje de WhatsApp y matriz ubicación → modalidades → métodos.
- **Importador:** `--dry-run` sobre todo `raw-catalog/` sin errores fatales; segunda corrida real no crea filas nuevas; los 4 duplicados conocidos de `_ 35__ DESC` terminan como 1 producto cada uno con `discount_percent = 35`; `GRATIS`/`IMPORTANTE` no generan productos.
- **RLS:** con la anon key, insert/update/delete en `products` y subida a `catalog` fallan; select de drafts devuelve vacío.
- **Front:** Lighthouse móvil (performance ≥ 85, accesibilidad ≥ 90) en Home; flujo completo lista → checkout → enlace `wa.me` correcto en móvil.

---

## 13. Decisiones del dueño (registro)

- Stack React + Vite + Tailwind + Supabase.
- Enfoque 1 (todo en cliente, `parseBanner` compartido, búsqueda en memoria).
- OCR en franja superior **y** inferior (25 % c/u); código temporal editable si falta.
- Galería en un campo de imágenes; agrupación por nombre base con sufijos a/b/c.
- Carpetas → `is_original`, `era`, `discount_percent = 35`; ignorar `GRATIS` e `IMPORTANTE`.
- Categoría/licencia también desde el prefijo del archivo; fusión de duplicados de `_ 35__ DESC`.
- Dedupe: `code` → MD5 → nombre base normalizado.
- Todo entra como `draft`; revisión rápida con "Aprobar y siguiente", atajos y filtro por carpeta/categoría.
- `/admin` con Supabase Auth email/contraseña y RLS estricta.
- Campo `stock` (default 1 al importar): 1 = pieza única con "Marcar como vendido"; >1 = "Quedan X"/"Últimas unidades", carrito topado al stock, "−1 vendido" en admin.
- Preventas publicables sin precio: "Precio a consultar" + "Consultar por WhatsApp", fuera del carrito. Productos normales exigen precio > 0.
- Aprobadas: categorías reales + combos/sobres por texto, versiones en `variants`, "Destacar" para el hero, PayPal 8 % por región, pago total en preventas.

## 14. Llamadas del diseñador (revisables)

- `images` como `jsonb` con full + thumb pre-generados (Supabase cobra la transformación de imágenes al vuelo).
- `is_original` nullable y obligatorio para publicar (nunca publicar sin badge original/réplica).
- Importador no pisa filas editadas o publicadas; solo agrega fotos y descuento.
- Vendidos ocultos por defecto, visibles con toggle.
- "Últimas unidades" cuando el stock está entre 2 y 3.
- Moneda única soles; PayPal muestra $10 USD aparte sin conversión.
- Botón de compra rápida por producto además del checkout completo.
- El carrito guarda `code + variante`; el stock es por producto, no por variante.

## 15. Pendientes que solo el dueño puede responder

- Número de WhatsApp de ventas (`VITE_WHATSAPP_NUMBER`).
- **Plazo de reclamos:** las políticas dicen 05 días, algunas fotos dicen 07 días. La web mostrará lo que dicen las políticas (05) salvo indicación contraria.
- Hosting del front (Vercel/Netlify/Cloudflare Pages; cualquiera sirve). Queda al builder si el dueño no tiene preferencia.
