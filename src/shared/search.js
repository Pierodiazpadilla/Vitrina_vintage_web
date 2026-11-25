// Búsqueda, filtros y orden del catálogo en memoria (spec §8).
import { normalizeText } from './text.js'
import { CATEGORIES } from './catalogRules.js'
import { unitPrice } from './pricing.js'

const VISIBLE = new Set(['published', 'sold'])
const compactCode = (s) => normalizeText(s).replace(/[\s-]/g, '')

function haystack(p) {
  return normalizeText([p.code, p.title, p.editorial, CATEGORIES[p.category], p.year].filter(Boolean).join(' '))
}

/** Coincidencia exacta de código primero; luego productos que contienen todos los términos. */
export function searchProducts(products, query) {
  const q = normalizeText(query)
  if (!q) return products
  const tokens = q.split(' ')
  const qCode = compactCode(query)
  const exact = []
  const rest = []
  for (const p of products) {
    if (compactCode(p.code) === qCode) exact.push(p)
    else if (tokens.every((t) => haystack(p).includes(t))) rest.push(p)
  }
  return [...exact, ...rest]
}

/** filters: { q, cat[], orig, era, tags[], preorder, discount, min, max, sold } */
export function filterProducts(products, filters = {}) {
  const base = filters.q ? searchProducts(products, filters.q) : products
  return base.filter((p) => {
    if (!VISIBLE.has(p.status)) return false
    if (p.status === 'sold' && !filters.sold) return false
    if (filters.cat?.length && !filters.cat.includes(p.category)) return false
    if (filters.orig === 'original' && p.is_original !== true) return false
    if (filters.orig === 'replica' && p.is_original !== false) return false
    if (filters.era && p.era !== filters.era) return false
    if (filters.tags?.length && !filters.tags.every((t) => (p.tags ?? []).includes(t))) return false
    if (filters.preorder && !p.is_preorder) return false
    if (filters.discount && !(Number(p.discount_percent) > 0)) return false
    if (filters.min != null || filters.max != null) {
      const price = unitPrice(p)
      if (price == null) return false
      if (filters.min != null && price < filters.min) return false
      if (filters.max != null && price > filters.max) return false
    }
    return true
  })
}

const SORTS = {
  new: (a, b) => String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')),
  'price-asc': (a, b) => nullsLast(unitPrice(a), unitPrice(b), (x, y) => x - y),
  'price-desc': (a, b) => nullsLast(unitPrice(a), unitPrice(b), (x, y) => y - x),
  discount: (a, b) => (Number(b.discount_percent) || 0) - (Number(a.discount_percent) || 0),
}

function nullsLast(a, b, cmp) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return cmp(a, b)
}

/** Ordena sin mutar; los vendidos siempre al final. */
export function sortProducts(products, sort = 'new') {
  const cmp = SORTS[sort] ?? SORTS.new
  return [...products].sort((a, b) => {
    const soldA = a.status === 'sold' ? 1 : 0
    const soldB = b.status === 'sold' ? 1 : 0
    return soldA - soldB || cmp(a, b)
  })
}

// ───────────────────────── URL ─────────────────────────

const LIST_KEYS = ['cat', 'tags']
const FLAG_KEYS = ['preorder', 'discount', 'sold']
const NUM_KEYS = ['min', 'max']
const ENUMS = { orig: ['original', 'replica'], era: ['retro', 'moderna'], sort: Object.keys(SORTS) }

export function filtersFromParams(params) {
  const f = {}
  const q = params.get('q')
  if (q && q.trim()) f.q = q
  for (const key of LIST_KEYS) {
    const v = params.get(key)
    if (v) f[key] = v.split(',').filter(Boolean)
  }
  for (const key of FLAG_KEYS) if (params.get(key) === '1') f[key] = true
  for (const key of NUM_KEYS) {
    const v = params.get(key)
    if (v != null && v !== '' && Number.isFinite(Number(v))) f[key] = Number(v)
  }
  for (const [key, allowed] of Object.entries(ENUMS)) {
    const v = params.get(key)
    if (allowed.includes(v)) f[key] = v
  }
  return f
}

export function filtersToParams(filters = {}) {
  const params = new URLSearchParams()
  if (filters.q && filters.q.trim()) params.set('q', filters.q)
  for (const key of LIST_KEYS) if (filters[key]?.length) params.set(key, filters[key].join(','))
  for (const key of FLAG_KEYS) if (filters[key]) params.set(key, '1')
  for (const key of NUM_KEYS) if (filters[key] != null) params.set(key, String(filters[key]))
  for (const key of Object.keys(ENUMS)) if (filters[key]) params.set(key, filters[key])
  return params
}
