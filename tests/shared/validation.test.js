import { validateForPublish } from '../../src/shared/validation.js'

const ok = { price: 100, stock: 1, title: 'Álbum X', category: 'pokemon', is_original: true, code: 'PK0001', is_preorder: false }

describe('validateForPublish', () => {
  it('accepts a complete product', () => {
    expect(validateForPublish(ok)).toEqual([])
  })
  it('requires a positive price for normal products', () => {
    expect(validateForPublish({ ...ok, price: 0 })).toContain('Falta el precio')
    expect(validateForPublish({ ...ok, price: null })).toContain('Falta el precio')
    expect(validateForPublish({ ...ok, price: -5 })).toContain('Falta el precio')
  })
  it('lets preorders be published without price', () => {
    expect(validateForPublish({ ...ok, price: null, is_preorder: true })).toEqual([])
  })
  it('requires license to be defined', () => {
    expect(validateForPublish({ ...ok, is_original: null })).toContain('Indica si es original o réplica')
    expect(validateForPublish({ ...ok, is_original: false })).toEqual([])
  })
  it('requires stock of at least 1', () => {
    expect(validateForPublish({ ...ok, stock: 0 })).toContain('El stock debe ser al menos 1')
  })
  it('requires title, category and code', () => {
    expect(validateForPublish({ ...ok, title: '  ' })).toContain('Falta el título')
    expect(validateForPublish({ ...ok, category: null })).toContain('Falta la categoría')
    expect(validateForPublish({ ...ok, category: 'inventada' })).toContain('Falta la categoría')
    expect(validateForPublish({ ...ok, code: '' })).toContain('Falta el código')
  })
  it('requires each variant to have a label and a positive price', () => {
    expect(validateForPublish({ ...ok, variants: [{ label: 'Tapa dura', price: 250 }] })).toEqual([])
    expect(validateForPublish({ ...ok, variants: [{ label: '', price: 250 }] })).toContain('Cada versión necesita nombre y precio')
    expect(validateForPublish({ ...ok, variants: [{ label: 'A', price: 0 }] })).toContain('Cada versión necesita nombre y precio')
  })
  it('reports every problem at once', () => {
    expect(validateForPublish({}).length).toBeGreaterThanOrEqual(5)
  })
})
