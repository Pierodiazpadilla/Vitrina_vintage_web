import { act, renderHook } from '@testing-library/react'
import { CartProvider, useCart, CART_KEY } from '../../src/features/cart/cartStore.js'
import { byCode } from '../fixtures/products.js'

const DB1082 = byCode('DB1082') // pieza única
const STRANGER = byCode('VR1111') // stock 5
const PRE_NO_PRICE = byCode('PV0001')
const PRE_PRICED = byCode('PV0002')
const DISNEY = byCode('TMP-3f9a1c2b') // variantes

function setup(products = [DB1082, STRANGER, PRE_NO_PRICE, PRE_PRICED, DISNEY]) {
  const wrapper = ({ children }) => <CartProvider products={products}>{children}</CartProvider>
  return renderHook(() => useCart(), { wrapper })
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('cartStore', () => {
  it('una pieza única no pasa de 1 aunque se agregue dos veces', () => {
    const { result } = setup()
    act(() => result.current.add(DB1082))
    act(() => result.current.add(DB1082))
    expect(result.current.lines).toEqual([{ code: 'DB1082', variant: null, qty: 1 }])
    expect(result.current.count).toBe(1)
  })

  it('topa la cantidad al stock', () => {
    const product = { ...STRANGER, stock: 4 }
    const { result } = setup([product])
    for (let i = 0; i < 5; i++) act(() => result.current.add(product))
    expect(result.current.lines[0].qty).toBe(4)
  })

  it('no agrega preventas sin precio', () => {
    const { result } = setup()
    let ok
    act(() => {
      ok = result.current.add(PRE_NO_PRICE)
    })
    expect(ok).toBe(false)
    expect(result.current.lines).toEqual([])
  })

  it('separa líneas por versión y setQty respeta el tope', () => {
    const { result } = setup()
    act(() => result.current.add(DISNEY, 'Tapa dura'))
    act(() => result.current.add(DISNEY, 'Tapa blanda'))
    expect(result.current.lines).toHaveLength(2)
    act(() => result.current.setQty('TMP-3f9a1c2b', 'Tapa dura', 9))
    expect(result.current.lines.find((l) => l.variant === 'Tapa dura').qty).toBe(2)
    act(() => result.current.setQty('TMP-3f9a1c2b', 'Tapa dura', 0))
    expect(result.current.lines).toHaveLength(1)
    act(() => result.current.remove('TMP-3f9a1c2b', 'Tapa blanda'))
    expect(result.current.count).toBe(0)
  })

  it('persiste en localStorage', () => {
    const { result } = setup()
    act(() => result.current.add(STRANGER))
    expect(JSON.parse(localStorage.getItem(CART_KEY))).toEqual([{ code: 'VR1111', variant: null, qty: 1 }])
  })

  it('recupera la lista guardada e ignora basura', () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ code: 'VR1111', variant: null, qty: 2 }, { nope: 1 }, 'x']))
    const { result } = setup()
    expect(result.current.lines).toEqual([{ code: 'VR1111', variant: null, qty: 2 }])
  })

  it('revalidate elimina vendidos y avisa', () => {
    const { result } = setup()
    act(() => result.current.add(DB1082))
    let out
    act(() => {
      out = result.current.revalidate([{ ...DB1082, status: 'sold' }])
    })
    expect(out.lines).toEqual([])
    expect(out.notices).toContain('DB1082 ya fue vendido')
    expect(result.current.lines).toEqual([])
  })

  it('revalidate ajusta la cantidad si bajó el stock', () => {
    const product = { ...STRANGER, stock: 4 }
    const { result } = setup([product])
    act(() => result.current.setQty('VR1111', null, 4))
    act(() => result.current.add(product))
    let out
    act(() => {
      out = result.current.revalidate([{ ...STRANGER, stock: 2 }])
    })
    expect(out.lines[0].qty).toBe(2)
    expect(out.notices.join(' ')).toMatch(/VR1111.*2/)
  })

  it('revalidate quita preventas que perdieron el precio, productos retirados y versiones que ya no existen', () => {
    const { result } = setup()
    act(() => result.current.add(PRE_PRICED))
    act(() => result.current.add(STRANGER))
    act(() => result.current.add(DISNEY, 'Tapa dura'))
    let out
    act(() => {
      out = result.current.revalidate([{ ...PRE_PRICED, price: null }, { ...DISNEY, variants: [] }])
    })
    expect(out.lines).toEqual([])
    expect(out.notices).toHaveLength(3)
  })

  it('funciona en memoria si localStorage lanza errores', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = setup()
    act(() => result.current.add(STRANGER))
    expect(result.current.count).toBe(1)
  })
})
