// Metadatos que salen de la carpeta y del prefijo del archivo. Spec §6 catalogRules.
import { normalizeText } from './text.js'

export const CATEGORIES = {
  'dragon-ball': 'Dragon Ball',
  pokemon: 'Pokémon',
  'caballeros-del-zodiaco': 'Caballeros del Zodiaco',
  digimon: 'Digimon',
  futbol: 'Mundiales y Fútbol',
  variado: 'Variados',
  anime: 'Anime',
}

// Carpetas de categoría (nombre normalizado → slug)
const CATEGORY_FOLDERS = {
  '_1 dragon ball': 'dragon-ball',
  '_2 pokemon': 'pokemon',
  '_3 caball del zod': 'caballeros-del-zodiaco',
  '_4 digimon': 'digimon',
  '_5 futbol': 'futbol',
  '_6 variado': 'variado',
}
const DISCOUNT_FOLDERS = { '_ 35__ desc': 35 }
const LICENSE_FOLDERS = { licenciados: true, 'sin licencia': false }
const ERA_FOLDERS = { retro: 'retro', modernas: 'moderna', 'modernas , vigentes': 'moderna' }

// Prefijo del nombre de archivo → categoría. El sufijo "lic" indica licenciado.
const PREFIX_CATEGORIES = [
  ['cabdz', 'caballeros-del-zodiaco'],
  ['pokemon', 'pokemon'],
  ['digimon', 'digimon'],
  ['fut', 'futbol'],
  ['var', 'variado'],
  ['db', 'dragon-ball'],
]
// Categorías cuyo prefijo sin "lic" significa "sin licencia" (tienen carpeta SIN LICENCIA).
const PREFIX_UNLICENSED_MEANS_REPLICA = new Set(['dragon-ball', 'pokemon', 'caballeros-del-zodiaco', 'variado'])

function segmentsOf(relPath) {
  return String(relPath).split(/[\\/]/).slice(0, -1).map(normalizeText)
}

function isCatalogFolder(segment) {
  return segment in CATEGORY_FOLDERS || segment in DISCOUNT_FOLDERS
}

/** Ignora todo lo que no esté dentro de una carpeta de categoría o de descuento. */
export function isIgnoredPath(relPath) {
  return !segmentsOf(relPath).some(isCatalogFolder)
}

export function metaFromPath(relPath) {
  const meta = { category: null, isOriginal: null, era: null, discountPercent: 0 }
  for (const segment of segmentsOf(relPath)) {
    if (segment in CATEGORY_FOLDERS) meta.category = CATEGORY_FOLDERS[segment]
    else if (segment in DISCOUNT_FOLDERS) meta.discountPercent = DISCOUNT_FOLDERS[segment]
    else if (segment in LICENSE_FOLDERS) meta.isOriginal = LICENSE_FOLDERS[segment]
    else if (segment in ERA_FOLDERS) meta.era = ERA_FOLDERS[segment]
  }
  return meta
}

export function metaFromPrefix(prefix) {
  const p = normalizeText(prefix)
  const entry = PREFIX_CATEGORIES.find(([start]) => p.startsWith(start))
  if (!entry) return { category: null, isOriginal: null, era: null }
  const [start, category] = entry
  let rest = p.slice(start.length)
  let isOriginal = null
  if (rest.startsWith('lic')) {
    isOriginal = true
    rest = rest.slice(3)
  } else if (PREFIX_UNLICENSED_MEANS_REPLICA.has(category)) {
    isOriginal = false
  }
  let era = null
  if (category === 'variado') {
    if (rest === 'm') era = 'moderna'
    else if (rest === 'r') era = 'retro'
  }
  return { category, isOriginal, era }
}

const ORIGINAL_WORDS = /\b(original(es)?|licenciad[oa]s?)\b/
const REPLICA_WORDS = /\b(replica|reimpresion|no oficial|trucho)\b/

/** true = original, false = réplica, null = no se sabe. Réplica gana si aparecen ambas. */
export function licenseFromText(text) {
  const t = normalizeText(text)
  if (REPLICA_WORDS.test(t)) return false
  if (ORIGINAL_WORDS.test(t)) return true
  return null
}

/** Carpeta no-descuento > prefijo > texto OCR. Descuento si algún archivo está en la carpeta de descuento. */
export function resolveMeta(paths, prefix, ocrText) {
  const fromPaths = paths.map(metaFromPath)
  const fromPrefix = metaFromPrefix(prefix)
  const pick = (field) => {
    const found = fromPaths.find((m) => m[field] != null)
    return found ? found[field] : fromPrefix[field]
  }
  let isOriginal = pick('isOriginal')
  if (isOriginal == null) isOriginal = licenseFromText(ocrText)
  return {
    category: pick('category'),
    isOriginal,
    era: pick('era'),
    discountPercent: Math.max(0, ...fromPaths.map((m) => m.discountPercent)),
  }
}
