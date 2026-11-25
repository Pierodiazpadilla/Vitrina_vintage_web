import { parseBanner, cleanBanner, STRIP_SEPARATOR, EDITORIALS } from '../../src/shared/parseBanner.js'
import { BANNERS } from '../fixtures/banners.js'

describe('parseBanner with real catalog banners', () => {
  it.each(BANNERS.map((b) => [b.file, b]))('%s', (_file, { text, expected }) => {
    const r = parseBanner(text)
    for (const field of ['price', 'code', 'editorial', 'year', 'isOriginalHint']) {
      if (field in expected) expect(r[field], field).toBe(expected[field])
    }
    for (const tag of expected.tagsInclude ?? []) expect(r.tags, 'tags').toContain(tag)
    for (const w of expected.warningsInclude ?? []) expect(r.warnings, 'warnings').toContain(w)
    if (expected.titleIncludes) expect(r.title, 'title').toContain(expected.titleIncludes)
  })

  it('never puts the legal notice in title or extras', () => {
    for (const { text } of BANNERS) {
      const r = parseBanner(text)
      expect(`${r.title} ${r.extras}`).not.toMatch(/reclamos|solo se aceptan/i)
    }
  })

  it('keeps titles at most 90 characters', () => {
    for (const { text } of BANNERS) {
      const r = parseBanner(text)
      if (r.title) expect(r.title.length).toBeLessThanOrEqual(90)
    }
  })
})

describe('parseBanner on dirty OCR input', () => {
  it('reads S/. prices', () => {
    expect(parseBanner('S/.250 Album X (Cod. DB1082)').price).toBe(250)
    expect(parseBanner('Album X a S/ 45').price).toBe(45)
  })
  it('reads prices glued to "soles" and truncated "sole"', () => {
    expect(parseBanner('250soles Album X').price).toBe(250)
    expect(parseBanner('Album X, año 2003-80 sole').price).toBe(80)
  })
  it('reads codes split across lines or with spaces', () => {
    expect(parseBanner('120 soles. Album X (Cod.\nDB 1082)').code).toBe('DB1082')
  })
  it('fixes O/l/I confusions in the numeric part of the code', () => {
    expect(parseBanner('120 soles. Album X (C0d. DBl082)').code).toBe('DB1082')
    expect(parseBanner('120 soles. Album X (Cod. DBO1O2)').code).toBe('DB0102')
  })
  it('flags numeric-only codes as suspicious', () => {
    const r = parseBanner('120 soles. Album X (COD. 1218)')
    expect(r.code).toBe(null)
    expect(r.warnings).toContain('code_suspicious')
  })
  it('warns when price is missing', () => {
    expect(parseBanner('Album X (Cod. DB1082)').warnings).toContain('price_missing')
  })
  it('turns several distinct prices into variants', () => {
    const v = parseBanner('Album X. Versión TAPA DURA a 250 soles. Versión TAPA BLANDA a 60 soles')
    expect(v.variants).toEqual([{ label: 'Tapa dura', price: 250 }, { label: 'Tapa blanda', price: 60 }])
    expect(v.price).toBe(60)
    expect(v.warnings).toContain('multiple_prices')
  })
  it('does not create variants when the same price is repeated', () => {
    const r = parseBanner('Album X - 80 soles\nAlbum X - 80 soles')
    expect(r.variants).toEqual([])
    expect(r.warnings).not.toContain('multiple_prices')
  })
  it('uses the World Cup year when there is no "año"', () => {
    expect(parseBanner('100 soles. Album Mundial 2026 (Cod. VR0001)').year).toBe(2026)
  })
  it('flags low OCR confidence', () => {
    expect(parseBanner('100 soles. Album X (Cod. VR0001)', { confidence: 55 }).warnings).toContain('low_confidence')
    expect(parseBanner('100 soles. Album X (Cod. VR0001)', { confidence: 90 }).warnings).not.toContain('low_confidence')
  })
  it('returns all missing warnings for empty text', () => {
    const r = parseBanner('')
    expect(r.warnings).toEqual(expect.arrayContaining(['price_missing', 'code_missing', 'title_missing']))
    expect(r).toMatchObject({ price: null, code: null, title: null, variants: [], tags: [] })
  })
  it('prefers the strip that holds the banner', () => {
    const top = 'ÁLBUM LICENCIADO DD he cor 20 18'
    const bottom = 'Album WALT DISNEY + set completo a pegar - 60 soles'
    const r = parseBanner(top + STRIP_SEPARATOR + bottom)
    expect(r.price).toBe(60)
    expect(r.title).toContain('WALT DISNEY')
  })
  it('splits title and extras at the first "+"', () => {
    const r = parseBanner('120 soles. SOLO LEVELING Álbum + set completo a pegar + 2 Armables. (Cod. VR1218)')
    expect(r.title).toBe('SOLO LEVELING Álbum')
    expect(r.extras).toContain('set completo a pegar')
  })
  it('ignores leading noise lines without banner signals', () => {
    const r = parseBanner('uuu un u.wu.\n20 soles cada uno - 3 por 40 soles.\nMiniaturas Digimon Coca Cola Serie 2, año 2000,\nZ licenciados. (Cod. DG1503)')
    expect(r.title).toContain('Miniaturas Digimon')
  })
  it('strips stray single letters at the start of a line', () => {
    const r = parseBanner('E [Álbum LIGA DE LA JUSTICIA + set completo a pegar, Navarrete original, año 2003 - 80 soles')
    expect(r.title).toBe('Álbum LIGA DE LA JUSTICIA')
  })
  it('does not leave dangling dashes after removing the editorial', () => {
    const r = parseBanner('Álbum vacío DIGIMON Digital Monster - Editorial Navarrete, 30 soles procedencia Brasil (Cod. VR01004)')
    expect(r.title).not.toMatch(/-\s*,|-$/)
    expect(r.title).toContain('DIGIMON Digital Monster')
  })
  it('builds a readable condition', () => {
    expect(parseBanner('50 soles. Album X + set completo a pegar (Cod. VR0001)').condition).toBe('Set completo a pegar')
    expect(parseBanner('30 soles. Álbum vacío X (Cod. VR0001)').condition).toBe('Álbum vacío')
    expect(parseBanner('90 soles. Album X sellado (Cod. VR0001)').condition).toBe('Sellado')
  })
})

describe('cleanBanner', () => {
  it('drops the legal notice and everything after it', () => {
    const out = cleanBanner('Album X 50 soles\nSOLO SE ACEPTAN RECLAMOS dentro de los 05 días\nENTREGA O ENVÍO. COLECCION REVISADA')
    expect(out).toContain('Album X 50 soles')
    expect(out).not.toMatch(/reclamos|entrega o env/i)
  })
  it('keeps text that precedes the notice on the same line', () => {
    expect(cleanBanner('Versión TAPA BLANDA a 60 soles SOLO SE ACEPTAN RECLAMOS')).toBe('Versión TAPA BLANDA a 60 soles')
  })
})

describe('EDITORIALS', () => {
  it('includes the editorials seen in the catalog', () => {
    expect(EDITORIALS).toEqual(expect.arrayContaining(['Navarrete', 'Panini', '3 Reyes', 'Kame House', 'Elite', 'Sabritas']))
  })
})
