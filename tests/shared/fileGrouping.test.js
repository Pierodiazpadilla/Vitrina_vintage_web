import { normalizeBaseName, prefixOf, sortPhotos } from '../../src/shared/fileGrouping.js'
import { normalizeText } from '../../src/shared/text.js'

describe('normalizeText', () => {
  it('removes accents, lowercases and collapses spaces, also for NFD input', () => {
    expect(normalizeText('  POKÉMON   Licenciado ')).toBe('pokemon licenciado')
    expect(normalizeText('Álbum Tapa Dura')).toBe('album tapa dura')
  })
  it('tolerates null/undefined', () => {
    expect(normalizeText(null)).toBe('')
    expect(normalizeText(undefined)).toBe('')
  })
})

describe('normalizeBaseName', () => {
  it.each([
    ['VITRINAdblic (16)a.jpg', { key: 'vitrinadblic (16)', photoIndex: 'a' }],
    ['VITRINAdblic (16)b.jpg', { key: 'vitrinadblic (16)', photoIndex: 'b' }],
    ['VITRINAcabdz (0)c.png', { key: 'vitrinacabdz (0)', photoIndex: 'c' }],
    ['VITRINAvarm (0)C.jpg', { key: 'vitrinavarm (0)', photoIndex: 'c' }],
    ['VITRINAvarlicm (10)4.jpg.jpg', { key: 'vitrinavarlicm (10)', photoIndex: '4' }],
    ['VITRINAdblic (1)b.jpg.jpg', { key: 'vitrinadblic (1)', photoIndex: 'b' }],
    ['VITRINAdblic (24).jpg', { key: 'vitrinadblic (24)', photoIndex: null }],
    ['VITRINAdblic (19)A.jpg', { key: 'vitrinadblic (19)', photoIndex: 'a' }],
  ])('%s', (file, expected) => {
    expect(normalizeBaseName(file)).toEqual(expected)
  })

  it('handles upper-case extensions', () => {
    expect(normalizeBaseName('VITRINAdigimon (2).JPG').key).toBe('vitrinadigimon (2)')
    expect(normalizeBaseName('VITRINAdigimon (2).jpeg').key).toBe('vitrinadigimon (2)')
  })

  it('accepts paths and only uses the file name', () => {
    expect(normalizeBaseName('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg').key).toBe('vitrinadblic (7)')
    expect(normalizeBaseName('_1 DRAGON BALL\\LICENCIADOS\\VITRINAdblic (7).jpg').key).toBe('vitrinadblic (7)')
  })
})

describe('prefixOf', () => {
  it('extracts the prefix between VITRINA and the parenthesis', () => {
    expect(prefixOf('vitrinavarlicm (10)')).toBe('varlicm')
    expect(prefixOf('vitrinadblic (24)')).toBe('dblic')
  })
  it('returns empty string for non-catalog names', () => {
    expect(prefixOf('bienvenido')).toBe('')
  })
})

describe('sortPhotos', () => {
  it('puts the main photo first, then alphanumeric', () => {
    expect(sortPhotos([{ photoIndex: 'b' }, { photoIndex: null }, { photoIndex: 'a' }]).map((p) => p.photoIndex))
      .toEqual([null, 'a', 'b'])
  })
  it('does not mutate the input', () => {
    const input = [{ photoIndex: 'b' }, { photoIndex: 'a' }]
    sortPhotos(input)
    expect(input[0].photoIndex).toBe('b')
  })
})
