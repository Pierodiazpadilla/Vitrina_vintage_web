import { WHATSAPP_NUMBER, waLink, buildProductMessage, buildOrderMessage, MAX_MESSAGE } from '../../src/shared/whatsapp.js'
import { byCode } from '../fixtures/products.js'

const DB1082 = byCode('DB1082')
const VR1149 = byCode('VR1149')
const DISNEY = byCode('TMP-3f9a1c2b')
const PRE_NO_PRICE = byCode('PV0001')
const PRE_PRICED = byCode('PV0002')

const sampleOrder = {
  lines: [
    { product: DB1082, variant: null, qty: 1 },
    { product: VR1149, variant: null, qty: 1 },
  ],
  location: 'provincias',
  deliveryId: 'olva',
  paymentId: 'mercadopago',
  name: 'Juan Pérez',
  city: 'Arequipa',
  acceptedPolicies: true,
}

describe('WhatsApp number', () => {
  it('defaults to the sales number', () => {
    expect(WHATSAPP_NUMBER).toBe('51941392619')
  })
})

describe('waLink', () => {
  it('points to wa.me with the encoded text', () => {
    const link = waLink('Hola & #1 ñandú 👋 + más\nlínea 2')
    expect(link.startsWith('https://wa.me/51941392619?text=')).toBe(true)
    expect(decodeURIComponent(link.split('text=')[1])).toBe('Hola & #1 ñandú 👋 + más\nlínea 2')
    const query = link.split('text=')[1]
    expect(query).not.toMatch(/[\s&#+]/)
  })
  it('accepts another number', () => {
    expect(waLink('x', '123')).toBe('https://wa.me/123?text=x')
  })
})

describe('buildOrderMessage', () => {
  const msg = buildOrderMessage(sampleOrder)

  it('lists each product with code, title and final price', () => {
    expect(msg).toContain('Hola Vitrina Vintage 👋 Quiero hacer este pedido:')
    expect(msg).toContain('• DB1082 — Dragon Ball Z 3 álbum — S/ 250.00')
    expect(msg).toContain('• VR1149 — Álbum Tapa dura, COPA MUNDIAL 2026 (-35%) — S/ 162.50')
  })
  it('shows subtotal, surcharge and total', () => {
    expect(msg).toContain('Subtotal: S/ 412.50')
    expect(msg).toContain('Pago: Tarjeta (link Mercado Pago) +7%: S/ 28.88')
    expect(msg).toContain('Total productos: S/ 441.38')
  })
  it('describes the delivery', () => {
    expect(msg).toContain('Entrega: Olva Courier — Arequipa (envío a cotizar)')
    expect(msg).toContain('Nombre: Juan Pérez')
    expect(msg).toContain('✅ Acepto las políticas de compra, envíos y preventa.')
  })
  it('shows quantity and variant', () => {
    const m = buildOrderMessage({ ...sampleOrder, lines: [{ product: DISNEY, variant: 'Tapa dura', qty: 2 }] })
    expect(m).toContain('• TMP-3f9a1c2b — Album WALT DISNEY TU Y YO (Tapa dura) x2 — S/ 180.00')
  })
  it('PayPal in the Americas: 8% and the fixed $10 USD', () => {
    const m = buildOrderMessage({ ...sampleOrder, location: 'extranjero', country: 'MX', deliveryId: 'dhl', paymentId: 'paypal', city: 'Monterrey' })
    expect(m).toContain('Pago: PayPal +8%: S/ 33.00')
    expect(m).toContain('+ $10 USD')
    expect(m).toContain('Total productos: S/ 445.50')
    expect(m).toContain('Entrega: DHL internacional — Monterrey, México (envío a cotizar, referencial $55–80 USD)')
  })
  it('PayPal outside the Americas: only $10 USD and the note', () => {
    const m = buildOrderMessage({ ...sampleOrder, location: 'extranjero', country: 'ES', deliveryId: 'dhl', paymentId: 'paypal', city: 'Madrid' })
    expect(m).toContain('+ $10 USD')
    expect(m).toMatch(/8 ?% podría aplicar/)
    expect(m).toContain('Total productos: S/ 412.50')
  })
  it('free pickup mentions the meeting point', () => {
    const m = buildOrderMessage({ ...sampleOrder, location: 'lima', deliveryId: 'punto-lima', pickupPoint: 'Real Plaza Centro Cívico', paymentId: 'efectivo', city: 'Lima' })
    expect(m).toContain('Entrega: Entrega gratuita — Real Plaza Centro Cívico (gratis)')
    expect(m).toContain('Pago: Efectivo contraentrega')
  })
  it('Shalom says shipping is paid at destination', () => {
    const m = buildOrderMessage({ ...sampleOrder, deliveryId: 'shalom', paymentId: 'yape-plin', city: 'Cusco' })
    expect(m).toContain('Entrega: Shalom — Cusco (envío se paga en destino)')
  })
  it('adds the preorder clause when a preorder is included', () => {
    const m = buildOrderMessage({ ...sampleOrder, lines: [{ product: PRE_PRICED, variant: null, qty: 2 }] })
    expect(m).toMatch(/preventa/i)
    expect(m).toMatch(/pago total/i)
  })
  it('never includes price-on-request preorders', () => {
    const m = buildOrderMessage({ ...sampleOrder, lines: [...sampleOrder.lines, { product: PRE_NO_PRICE, variant: null, qty: 1 }] })
    expect(m).not.toContain(PRE_NO_PRICE.code)
    expect(m).toContain('Subtotal: S/ 412.50')
  })
  it('compacts long orders to stay within the limit and keeps every code', () => {
    const lines = Array.from({ length: 40 }, (_, i) => ({ product: { ...DB1082, code: `DB${1000 + i}` }, variant: null, qty: 1 }))
    const m = buildOrderMessage({ ...sampleOrder, lines })
    expect(m.length).toBeLessThanOrEqual(MAX_MESSAGE)
    expect(m).toContain('DB1000')
    expect(m).toContain('DB1039')
  })
  it('truncates absurdly long orders with a count of the rest', () => {
    const lines = Array.from({ length: 200 }, (_, i) => ({ product: { ...DB1082, code: `DB${1000 + i}` }, variant: null, qty: 1 }))
    const m = buildOrderMessage({ ...sampleOrder, lines })
    expect(m.length).toBeLessThanOrEqual(MAX_MESSAGE)
    expect(m).toMatch(/y \d+ productos más/)
    expect(m).toContain('Subtotal: S/ 50000.00')
  })
  it('refuses to build an order without accepting the policies', () => {
    expect(() => buildOrderMessage({ ...sampleOrder, acceptedPolicies: false })).toThrow()
  })
})

describe('buildProductMessage', () => {
  it('pedir', () => {
    const m = buildProductMessage(DB1082, { kind: 'pedir' })
    expect(m).toContain('• DB1082 — Dragon Ball Z 3 álbum — S/ 250.00')
    expect(m).toMatch(/disponible/i)
  })
  it('reservar mentions full payment', () => {
    const m = buildProductMessage(PRE_PRICED, { kind: 'reservar' })
    expect(m).toContain('S/ 95.00')
    expect(m).toMatch(/pago total/i)
  })
  it('consultar asks for the price and shows no amount', () => {
    const m = buildProductMessage(PRE_NO_PRICE, { kind: 'consultar' })
    expect(m).toMatch(/precio/i)
    expect(m).toContain('PV0001')
    expect(m).not.toContain('S/')
  })
  it('avisar asks to be notified', () => {
    expect(buildProductMessage(byCode('CZ0010'), { kind: 'avisar' })).toMatch(/avís/i)
  })
  it('includes variant and discount', () => {
    expect(buildProductMessage(DISNEY, { kind: 'pedir', variant: 'Tapa dura' })).toContain('(Tapa dura)')
    expect(buildProductMessage(VR1149, { kind: 'pedir' })).toContain('(-35%) — S/ 162.50')
  })
  it('includes the product link when given', () => {
    expect(buildProductMessage(DB1082, { kind: 'pedir', url: 'https://vitrina.test/p/DB1082' })).toContain('https://vitrina.test/p/DB1082')
  })
})

describe('review fixes', () => {
  it('drops sold, hidden and out-of-stock lines and caps quantity at stock', () => {
    const sold = { ...DB1082, code: 'SOLD1', status: 'sold' }
    const empty = { ...DB1082, code: 'EMPTY1', stock: 0 }
    const two = { ...DB1082, code: 'TWO1', stock: 2 }
    const m = buildOrderMessage({ ...sampleOrder, lines: [
      { product: sold, variant: null, qty: 3 },
      { product: empty, variant: null, qty: 1 },
      { product: two, variant: null, qty: 5 },
    ] })
    expect(m).not.toContain('SOLD1')
    expect(m).not.toContain('EMPTY1')
    expect(m).toContain('• TWO1 — Dragon Ball Z 3 álbum x2 — S/ 500.00')
    expect(m).toContain('Subtotal: S/ 500.00')
  })
  it('drops lines whose variant no longer exists', () => {
    const m = buildOrderMessage({ ...sampleOrder, lines: [{ product: DISNEY, variant: 'Edición oro', qty: 1 }] })
    expect(m).not.toContain('Edición oro')
    expect(m).toContain('Subtotal: S/ 0.00')
  })
})
