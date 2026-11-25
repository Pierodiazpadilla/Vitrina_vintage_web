// Genera las fotos de los productos de ejemplo (tests/fixtures/products.js) a partir de fotos reales
// de raw-catalog/ y public/catalogo/. Solo hace falta para el modo preview (VITE_USE_FIXTURES=true).
// Uso: node scripts/make-sample-images.mjs
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const RAW = 'raw-catalog/Catálogo Vitrina Vintage-20261125T015536Z-1-001/Catálogo Vitrina Vintage'
const OUT = 'public/catalogo/muestras'

const SOURCES = {
  DB1082: [`${RAW}/_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg`],
  VR1149: [`${RAW}/_5 FUTBOL/VITRINAfut (16)b.jpg`, `${RAW}/_5 FUTBOL/VITRINAfut (16)c.jpg`],
  VR1111: [`${RAW}/_6 VARIADO/SIN LICENCIA/MODERNAS/VITRINAvarm (0)A.jpg`],
  'TMP-3f9a1c2b': [`${RAW}/_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg`],
  PV0001: ['public/catalogo/WhatsApp Image 2026-11-24 at 2.31.52 PM.jpeg'],
  PV0002: ['public/catalogo/WhatsApp Image 2026-11-24 at 8.09.27 PM.jpeg'],
  PV0003: ['public/catalogo/WhatsApp Image 2026-11-24 at 8.11.02 PM.jpeg'],
  SS0040: ['public/catalogo/WhatsApp Image 2026-11-23 at 10.47.28 AM.jpeg'],
  NA0001: ['public/catalogo/WhatsApp Image 2026-11-23 at 10.47.30 AM.jpeg'],
  CZ0010: [`${RAW}/_3 CABALL DEL ZOD/LICENCIADOS/VITRINAcabdzlic (1).jpg`],
  PK1511: [`${RAW}/_2 POKÉMON/LICENCIADOS/VITRINApokemonlic (1).jpg`],
  DG0018: [`${RAW}/_4 DIGIMON/VITRINAdigimon (0)A.jpg`],
  VR1663: [`${RAW}/_6 VARIADO/LICENCIADOS/RETRO/VITRINAvarlicr (11).jpg`],
}

// Las carpetas con tilde pueden venir en NFD (zip de Google Drive): resolver por comparación normalizada.
async function resolvePath(path) {
  const parts = path.split('/')
  let current = parts.shift()
  for (const part of parts) {
    const entries = await readdir(current)
    const hit = entries.find((e) => e.normalize('NFC') === part.normalize('NFC'))
    if (!hit) throw new Error(`No existe: ${join(current, part)}`)
    current = join(current, hit)
  }
  return current
}

await mkdir(OUT, { recursive: true })
for (const [code, files] of Object.entries(SOURCES)) {
  for (const [i, file] of files.entries()) {
    const src = await resolvePath(file)
    const base = sharp(src).rotate()
    await base.clone().resize(1000, 1000, { fit: 'inside' }).webp({ quality: 72 }).toFile(`${OUT}/${code}-${i + 1}-full.webp`)
    const info = await base.clone().resize(480, 480, { fit: 'inside' }).webp({ quality: 70 }).toFile(`${OUT}/${code}-${i + 1}-thumb.webp`)
    console.log(code, i + 1, `${info.width}x${info.height}`)
  }
}
