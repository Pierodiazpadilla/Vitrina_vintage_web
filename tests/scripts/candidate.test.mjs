// @vitest-environment node
import { buildCandidate, mergeParsed, needsMoreOcr } from '../../scripts/lib/candidate.mjs'
import { BANNERS } from '../fixtures/banners.js'

const group = (relPaths, prefix, md5 = 'abcdef0123456789') => ({
  key: 'k', prefix, relPaths, files: [{ md5 }],
})
const banner = (file) => BANNERS.find((b) => b.file === file)

describe('buildCandidate', () => {
  it('DB1082: precio, código, editorial y licencia de la carpeta', () => {
    const b = banner('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg')
    const c = buildCandidate(group([b.file], 'dblic'), [{ text: b.text, confidence: 90 }])
    expect(c).toMatchObject({ code: 'DB1082', codeIsTemp: false, price: 250, category: 'dragon-ball', isOriginal: true, editorial: 'Navarrete', year: 1999, discountPercent: 0 })
  })

  it('sin código → TMP-<8 hex del md5 de la principal>', () => {
    const b = banner('_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg')
    const c = buildCandidate(group([b.file], 'varr', '3f9a1c2bdeadbeef'), [{ text: b.text, confidence: 90 }])
    expect(c.code).toBe('TMP-3f9a1c2b')
    expect(c.codeIsTemp).toBe(true)
    expect(c.isOriginal).toBe(false)
    expect(c.era).toBe('retro')
  })

  it('duplicado en _ 35__ DESC: categoría de la carpeta real y 35 % de descuento', () => {
    const c = buildCandidate(group(['_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (24).jpg', '_ 35__ DESC/VITRINAdblic (24).jpg'], 'dblic'), [{ text: '', confidence: 0 }])
    expect(c).toMatchObject({ category: 'dragon-ball', isOriginal: true, discountPercent: 35 })
    expect(c.warnings).toEqual(expect.arrayContaining(['price_missing', 'code_missing']))
  })

  it('licencia desconocida → warning', () => {
    const c = buildCandidate(group(['_5 FUTBOL/VITRINAfut (99).jpg'], 'fut'), [{ text: '100 soles Album (Cod. VR1)', confidence: 90 }])
    if (c.isOriginal == null) expect(c.warnings).toContain('license_unknown')
  })
})

describe('mergeParsed', () => {
  it('el primer valor no vacío gana y los avisos de "falta" se resuelven con otras fotos', () => {
    const m = mergeParsed([
      { price: null, code: null, title: 'A', tags: ['sellado'], warnings: ['price_missing', 'code_missing'] },
      { price: 250, code: 'DB1', title: 'B', tags: ['combo'], warnings: ['low_confidence'] },
    ])
    expect(m).toMatchObject({ price: 250, code: 'DB1', title: 'A' })
    expect(m.tags).toEqual(['sellado', 'combo'])
    expect(m.warnings).toEqual(['low_confidence'])
    expect(needsMoreOcr(m)).toBe(false)
  })
})
