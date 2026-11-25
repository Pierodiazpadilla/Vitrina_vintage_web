import { searchProducts, filterProducts, sortProducts, filtersFromParams, filtersToParams } from '../../src/shared/search.js'
import { NAV_ITEMS, matchesNavItem, visibleNavItems } from '../../src/shared/navigation.js'
import { PRODUCTS as P } from '../fixtures/products.js'

const codes = (list) => list.map((p) => p.code)

describe('searchProducts', () => {
  it('puts the exact code first, case-insensitive', () => {
    expect(searchProducts(P, 'db1082')[0].code).toBe('DB1082')
    expect(searchProducts(P, ' DB1082 ')[0].code).toBe('DB1082')
  })
  it('matches all tokens across title, editorial and year', () => {
    expect(codes(searchProducts(P, 'navarrete 1999'))).toEqual(['DB1082'])
    expect(codes(searchProducts(P, 'stranger 3 reyes'))).toEqual(['VR1111'])
  })
  it('ignores accents both ways', () => {
    expect(codes(searchProducts(P, 'pokemon'))).toContain('PK1511')
    expect(codes(searchProducts(P, 'pokémon'))).toContain('PK1511')
    expect(codes(searchProducts(P, 'album tapa dura copa'))).toContain('VR1149')
  })
  it('matches the category label', () => {
    expect(codes(searchProducts(P, 'caballeros'))).toContain('CZ0010')
    expect(codes(searchProducts(P, 'mundiales'))).toContain('VR1149')
  })
  it('returns everything for an empty query and nothing for gibberish', () => {
    expect(searchProducts(P, '').length).toBe(P.length)
    expect(searchProducts(P, 'zzqqxx')).toEqual([])
  })
})

describe('filterProducts', () => {
  it('hides sold products unless asked', () => {
    expect(filterProducts(P, {}).some((p) => p.status === 'sold')).toBe(false)
    expect(filterProducts(P, { sold: true }).some((p) => p.status === 'sold')).toBe(true)
  })
  it('never shows hidden or draft products', () => {
    const extra = [...P, { ...P[0], code: 'HID1', status: 'hidden' }, { ...P[0], code: 'DRA1', status: 'draft' }]
    expect(codes(filterProducts(extra, { sold: true }))).not.toEqual(expect.arrayContaining(['HID1']))
    expect(codes(filterProducts(extra, { sold: true }))).not.toContain('DRA1')
  })
  it('filters by category (any of)', () => {
    expect(filterProducts(P, { cat: ['pokemon', 'digimon'] }).every((p) => ['pokemon', 'digimon'].includes(p.category))).toBe(true)
  })
  it('filters original vs replica', () => {
    expect(filterProducts(P, { orig: 'replica' }).every((p) => p.is_original === false)).toBe(true)
    expect(filterProducts(P, { orig: 'original' }).every((p) => p.is_original === true)).toBe(true)
  })
  it('filters era, tags (all of), preorder and discount', () => {
    expect(filterProducts(P, { era: 'retro' }).every((p) => p.era === 'retro')).toBe(true)
    expect(codes(filterProducts(P, { tags: ['combo', 'sobres'] }))).toEqual(expect.arrayContaining(['DB1082', 'PK1511']))
    expect(filterProducts(P, { tags: ['combo', 'sobres'] }).every((p) => p.tags.includes('combo') && p.tags.includes('sobres'))).toBe(true)
    expect(filterProducts(P, { preorder: true }).every((p) => p.is_preorder)).toBe(true)
    expect(filterProducts(P, { discount: true }).every((p) => p.discount_percent > 0)).toBe(true)
  })
  it('filters by final price range and drops price-on-request items', () => {
    const r = filterProducts(P, { min: 60, max: 170 })
    expect(codes(r)).toContain('VR1149') // 250 → 162.50
    expect(codes(r)).not.toContain('DB1082')
    expect(codes(r)).not.toContain('PV0001')
  })
  it('applies the text query too', () => {
    expect(codes(filterProducts(P, { q: 'db1082' }))).toEqual(['DB1082'])
  })
})

describe('sortProducts', () => {
  it('newest first by default', () => {
    const r = sortProducts(filterProducts(P, {}), 'new')
    expect(r[0].code).toBe('PV0002')
  })
  it('price ascending uses the final price and leaves price-on-request last', () => {
    const r = sortProducts(filterProducts(P, {}), 'price-asc')
    expect(r[0].code).toBe('VR1111')
    expect(r.at(-1).code).toBe('PV0001')
  })
  it('price descending', () => {
    const r = sortProducts(filterProducts(P, {}), 'price-desc')
    expect(['DB1082', 'DG0018']).toContain(r[0].code)
  })
  it('discount first', () => {
    expect(sortProducts(filterProducts(P, {}), 'discount')[0].code).toBe('VR1149')
  })
  it('sold always at the end', () => {
    expect(sortProducts(P, 'price-asc').at(-1).status).toBe('sold')
    expect(sortProducts(P, 'new').at(-1).status).toBe('sold')
  })
  it('does not mutate the input', () => {
    const copy = [...P]
    sortProducts(P, 'price-asc')
    expect(P).toEqual(copy)
  })
})

describe('URL params', () => {
  it('round-trips filters', () => {
    const f = { q: 'goku', cat: ['dragon-ball'], orig: 'original', sort: 'price-asc' }
    expect(filtersFromParams(filtersToParams(f))).toEqual(f)
    const g = { cat: ['pokemon', 'digimon'], tags: ['combo'], preorder: true, discount: true, min: 10, max: 200, sold: true, era: 'retro' }
    expect(filtersFromParams(filtersToParams(g))).toEqual(g)
  })
  it('ignores unknown or invalid values', () => {
    const f = filtersFromParams(new URLSearchParams('orig=foo&min=abc&sort=bad&utm_source=ig'))
    expect(f).toEqual({})
  })
  it('omits empty values', () => {
    expect(filtersToParams({ q: '', cat: [] }).toString()).toBe('')
  })
})

describe('navigation', () => {
  it('has the spec order', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'Preventas', 'Dragon Ball', 'Pokémon', 'Caballeros del Zodiaco', 'Digimon', 'Anime',
      'Mundiales y Fútbol', 'Variados', 'Retro', 'Ofertas', 'Combos', 'Sobres',
    ])
  })
  it('matches products to items', () => {
    const preventas = NAV_ITEMS.find((i) => i.id === 'preventas')
    const retro = NAV_ITEMS.find((i) => i.id === 'retro')
    expect(matchesNavItem(P.find((p) => p.code === 'PV0002'), preventas)).toBe(true)
    expect(matchesNavItem(P.find((p) => p.code === 'DB1082'), retro)).toBe(true)
    expect(matchesNavItem(P.find((p) => p.code === 'VR1111'), retro)).toBe(false)
  })
  it('hides items without products', () => {
    expect(visibleNavItems([])).toEqual([])
    const ids = visibleNavItems(P).map((i) => i.id)
    expect(ids).toContain('ofertas')
    expect(ids).toContain('sobres')
  })
  it('does not count sold products to show an item', () => {
    const onlySold = P.filter((p) => p.code === 'CZ0010')
    expect(visibleNavItems(onlySold)).toEqual([])
  })
})
