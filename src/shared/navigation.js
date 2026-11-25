// Chips de la navbar y accesos por categoría (spec §8 "Taxonomía de la home").
import { CATEGORIES } from './catalogRules.js'
import { filterProducts } from './search.js'

const cat = (slug, id = slug) => ({ id, label: CATEGORIES[slug], filters: { cat: [slug] } })

export const NAV_ITEMS = [
  { id: 'preventas', label: 'Preventas', filters: { preorder: true } },
  cat('dragon-ball'),
  cat('pokemon'),
  cat('caballeros-del-zodiaco'),
  cat('digimon'),
  cat('anime'),
  cat('futbol'),
  cat('variado'),
  { id: 'retro', label: 'Retro', filters: { era: 'retro' } },
  { id: 'ofertas', label: 'Ofertas', filters: { discount: true } },
  { id: 'combos', label: 'Combos', filters: { tags: ['combo'] } },
  { id: 'sobres', label: 'Sobres', filters: { tags: ['sobres'] } },
]

export function matchesNavItem(product, item) {
  return filterProducts([product], item.filters).length === 1
}

/** Solo los ítems con al menos un producto visible (no vendido). */
export function visibleNavItems(products) {
  return NAV_ITEMS.filter((item) => filterProducts(products, item.filters).length > 0)
}
