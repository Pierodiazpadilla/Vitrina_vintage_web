import {
  CATEGORIES, isIgnoredPath, metaFromPath, metaFromPrefix, licenseFromText, resolveMeta,
} from '../../src/shared/catalogRules.js'

describe('CATEGORIES', () => {
  it('has the visible labels', () => {
    expect(CATEGORIES).toEqual({
      'dragon-ball': 'Dragon Ball',
      pokemon: 'Pokémon',
      'caballeros-del-zodiaco': 'Caballeros del Zodiaco',
      digimon: 'Digimon',
      futbol: 'Mundiales y Fútbol',
      variado: 'Variados',
      anime: 'Anime',
    })
  })
})

describe('isIgnoredPath', () => {
  it.each([
    ['GRATIS/ARMABLE (1).jpg', true],
    ['IMPORTANTE/ImportanteVV (1).JPG', true],
    ['IMPORTANTE/Políticas de Preventa VVR.png', true],
    ['BIENVENIDO.JPG', true],
    ['PUNTOS DE ENTREGA.jpg', true],
    ['_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg', false],
    ['_ 35__ DESC/VITRINAdblic (24).jpg', false],
    ['_4 DIGIMON/VITRINAdigimon (2).jpg', false],
  ])('%s -> %s', (path, ignored) => {
    expect(isIgnoredPath(path)).toBe(ignored)
  })

  it('tolerates wrapper folders from the Drive zip', () => {
    const root = 'Catálogo Vitrina Vintage-20261125T015536Z-1-001/Catálogo Vitrina Vintage/'
    expect(isIgnoredPath(root + '_5 FUTBOL/VITRINAfut (1).jpg')).toBe(false)
    expect(isIgnoredPath(root + 'GRATIS/ARMABLE (1).jpg')).toBe(true)
    expect(isIgnoredPath(root + 'BIENVENIDO.JPG')).toBe(true)
  })

  it('accepts Windows separators', () => {
    expect(isIgnoredPath('_1 DRAGON BALL\\LICENCIADOS\\VITRINAdblic (7).jpg')).toBe(false)
  })
})

describe('metaFromPath', () => {
  it('reads category and license', () => {
    expect(metaFromPath('_1 DRAGON BALL/LICENCIADOS/x.jpg'))
      .toEqual({ category: 'dragon-ball', isOriginal: true, era: null, discountPercent: 0 })
    expect(metaFromPath('_3 CABALL DEL ZOD/SIN LICENCIA/x.jpg'))
      .toEqual({ category: 'caballeros-del-zodiaco', isOriginal: false, era: null, discountPercent: 0 })
  })
  it('matches POKÉMON written in NFD (Drive zip on Windows)', () => {
    expect(metaFromPath('_2 POKÉMON/SIN LICENCIA/x.jpg').category).toBe('pokemon')
    expect(metaFromPath('_2 POKÉMON/LICENCIADOS/x.jpg').category).toBe('pokemon')
  })
  it('reads era', () => {
    expect(metaFromPath('_6 VARIADO/LICENCIADOS/MODERNAS , VIGENTES/x.jpg'))
      .toEqual({ category: 'variado', isOriginal: true, era: 'moderna', discountPercent: 0 })
    expect(metaFromPath('_6 VARIADO/SIN LICENCIA/RETRO/x.jpg'))
      .toEqual({ category: 'variado', isOriginal: false, era: 'retro', discountPercent: 0 })
  })
  it('folders without license subfolder leave it unknown', () => {
    expect(metaFromPath('_4 DIGIMON/x.jpg')).toEqual({ category: 'digimon', isOriginal: null, era: null, discountPercent: 0 })
    expect(metaFromPath('_5 FUTBOL/x.jpg').category).toBe('futbol')
  })
  it('discount folder gives only the discount', () => {
    expect(metaFromPath('_ 35__ DESC/VITRINAdblic (24).jpg'))
      .toEqual({ category: null, isOriginal: null, era: null, discountPercent: 35 })
  })
})

describe('metaFromPrefix', () => {
  it.each([
    ['dblic', { category: 'dragon-ball', isOriginal: true, era: null }],
    ['db', { category: 'dragon-ball', isOriginal: false, era: null }],
    ['pokemonlic', { category: 'pokemon', isOriginal: true, era: null }],
    ['pokemon', { category: 'pokemon', isOriginal: false, era: null }],
    ['cabdzlic', { category: 'caballeros-del-zodiaco', isOriginal: true, era: null }],
    ['cabdz', { category: 'caballeros-del-zodiaco', isOriginal: false, era: null }],
    ['digimonlic', { category: 'digimon', isOriginal: true, era: null }],
    ['digimon', { category: 'digimon', isOriginal: null, era: null }],
    ['fut', { category: 'futbol', isOriginal: null, era: null }],
    ['varlic', { category: 'variado', isOriginal: true, era: null }],
    ['varlicm', { category: 'variado', isOriginal: true, era: 'moderna' }],
    ['varlicr', { category: 'variado', isOriginal: true, era: 'retro' }],
    ['varm', { category: 'variado', isOriginal: false, era: 'moderna' }],
    ['varr', { category: 'variado', isOriginal: false, era: 'retro' }],
  ])('%s', (prefix, expected) => {
    expect(metaFromPrefix(prefix)).toEqual(expected)
  })
  it('unknown prefix gives nulls', () => {
    expect(metaFromPrefix('xyz')).toEqual({ category: null, isOriginal: null, era: null })
  })
})

describe('licenseFromText', () => {
  it.each([
    ['Navarrete original, año 1999', true],
    ['Panini licenciado', true],
    ['Replica de excelente calidad', false],
    ['RÉPLICA', false],
    ['reimpresión no oficial', false],
    ['Album Walt Disney', null],
    ['', null],
  ])('%s -> %s', (text, expected) => {
    expect(licenseFromText(text)).toBe(expected)
  })
})

describe('resolveMeta', () => {
  it('folder beats prefix and discount folder adds 35%', () => {
    expect(resolveMeta(['_1 DRAGON BALL/LICENCIADOS/a.jpg', '_ 35__ DESC/a.jpg'], 'dblic', ''))
      .toEqual({ category: 'dragon-ball', isOriginal: true, era: null, discountPercent: 35 })
  })
  it('discount-only files take category and license from the prefix', () => {
    expect(resolveMeta(['_ 35__ DESC/VITRINAvarlic (32).jpg'], 'varlic', ''))
      .toEqual({ category: 'variado', isOriginal: true, era: null, discountPercent: 35 })
  })
  it('falls back to OCR text for license', () => {
    expect(resolveMeta(['_5 FUTBOL/a.jpg'], 'fut', 'Panini licenciado').isOriginal).toBe(true)
    expect(resolveMeta(['_5 FUTBOL/a.jpg'], 'fut', 'sin datos').isOriginal).toBe(null)
  })
  it('folder license wins over contradicting text', () => {
    expect(resolveMeta(['_1 DRAGON BALL/SIN LICENCIA/a.jpg'], 'db', 'original').isOriginal).toBe(false)
  })
})

describe('review fixes', () => {
  it('negated license words are not "original"', () => {
    expect(licenseFromText('No original')).toBe(false)
    expect(licenseFromText('álbum no licenciado')).toBe(false)
    expect(licenseFromText('sin licencia')).toBe(false)
  })
})
