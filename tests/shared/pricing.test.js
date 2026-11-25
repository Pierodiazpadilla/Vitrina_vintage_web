import {
  unitPrice, listPrice, lineTotal, subtotal, surchargeFor, stockBadge, maxQty, isPriceOnRequest,
} from '../../src/shared/pricing.js'
import { COUNTRIES, isAmericas } from '../../src/shared/countries.js'

const base = { price: 250, discount_percent: 0, variants: [], stock: 1, is_preorder: false }

describe('unitPrice / listPrice', () => {
  it('applies the discount and rounds to cents', () => {
    expect(unitPrice({ ...base, discount_percent: 35 })).toBe(162.5)
    expect(unitPrice({ ...base, price: 99.99, discount_percent: 35 })).toBe(64.99)
    expect(listPrice({ ...base, discount_percent: 35 })).toBe(250)
  })
  it('uses the variant price when a variant is chosen', () => {
    const p = { ...base, price: 60, variants: [{ label: 'Tapa dura', price: 250 }, { label: 'Tapa blanda', price: 60 }] }
    expect(unitPrice(p, 'Tapa dura')).toBe(250)
    expect(unitPrice(p, 'Tapa blanda')).toBe(60)
    expect(unitPrice({ ...p, discount_percent: 35 }, 'Tapa dura')).toBe(162.5)
  })
  it('falls back to price for an unknown variant', () => {
    expect(unitPrice({ ...base, variants: [{ label: 'A', price: 10 }] }, 'Z')).toBe(250)
  })
  it('returns null for price-on-request preorders', () => {
    expect(unitPrice({ ...base, price: null, is_preorder: true })).toBe(null)
    expect(unitPrice({ ...base, price: 0, is_preorder: true })).toBe(null)
  })
  it('accepts numeric strings from Postgres numeric columns', () => {
    expect(unitPrice({ ...base, price: '250.00', discount_percent: 35 })).toBe(162.5)
  })
})

describe('isPriceOnRequest', () => {
  it('only for preorders without a positive price', () => {
    expect(isPriceOnRequest({ is_preorder: true, price: 0 })).toBe(true)
    expect(isPriceOnRequest({ is_preorder: true, price: null })).toBe(true)
    expect(isPriceOnRequest({ is_preorder: true, price: 120 })).toBe(false)
    expect(isPriceOnRequest({ is_preorder: false, price: 0 })).toBe(false)
  })
})

describe('lineTotal / subtotal', () => {
  it('multiplies by quantity and sums lines', () => {
    const a = { product: { ...base, discount_percent: 35 }, variant: null, qty: 1 }
    const b = { product: { ...base, price: 125, stock: 4 }, variant: null, qty: 2 }
    expect(lineTotal(a)).toBe(162.5)
    expect(lineTotal(b)).toBe(250)
    expect(subtotal([a, b])).toBe(412.5)
  })
  it('ignores price-on-request lines', () => {
    const p = { product: { ...base, price: null, is_preorder: true }, variant: null, qty: 1 }
    expect(lineTotal(p)).toBe(0)
    expect(subtotal([p])).toBe(0)
  })
})

describe('surchargeFor', () => {
  it('Mercado Pago adds 7%', () => {
    expect(surchargeFor('mercadopago', 412.5)).toMatchObject({ percent: 7, amount: 28.88, fixedUsd: 0, note: null })
  })
  it('PayPal in the Americas adds 8% plus $10 USD', () => {
    expect(surchargeFor('paypal', 100, 'MX')).toMatchObject({ percent: 8, amount: 8, fixedUsd: 10 })
    expect(surchargeFor('paypal', 100, 'US')).toMatchObject({ percent: 8, amount: 8, fixedUsd: 10 })
  })
  it('PayPal outside the Americas adds only $10 USD and a note', () => {
    const s = surchargeFor('paypal', 100, 'ES')
    expect(s).toMatchObject({ percent: 0, amount: 0, fixedUsd: 10 })
    expect(s.note).toMatch(/8 ?% podría aplicar/)
  })
  it('PayPal without a known country behaves as outside the Americas', () => {
    expect(surchargeFor('paypal', 100)).toMatchObject({ percent: 0, fixedUsd: 10 })
  })
  it('other methods add nothing', () => {
    for (const id of ['yape-plin', 'transferencia', 'efectivo']) {
      expect(surchargeFor(id, 100)).toEqual({ percent: 0, amount: 0, fixedUsd: 0, note: null })
    }
  })
  it('Western Union / MoneyGram adds nothing but explains the fee', () => {
    const s = surchargeFor('wu-mg', 100)
    expect(s.amount).toBe(0)
    expect(s.note).toMatch(/comisi[oó]n/i)
  })
})

describe('stockBadge', () => {
  it('nothing for unique pieces', () => {
    expect(stockBadge({ stock: 1 })).toBe(null)
  })
  it('"Últimas unidades" for 2–3', () => {
    expect(stockBadge({ stock: 2 })).toEqual({ label: 'Últimas unidades', tone: 'warm' })
    expect(stockBadge({ stock: 3 })).toEqual({ label: 'Últimas unidades', tone: 'warm' })
  })
  it('"Quedan X" above 3', () => {
    expect(stockBadge({ stock: 5 })).toEqual({ label: 'Quedan 5', tone: 'neutral' })
  })
  it('nothing for sold out or preorders', () => {
    expect(stockBadge({ stock: 0 })).toBe(null)
    expect(stockBadge({ stock: 10, is_preorder: true })).toBe(null)
  })
})

describe('maxQty', () => {
  it('caps at stock', () => {
    expect(maxQty({ ...base, stock: 4 })).toBe(4)
    expect(maxQty({ ...base, stock: 1 })).toBe(1)
    expect(maxQty({ ...base, stock: 0 })).toBe(0)
  })
  it('is unlimited for priced preorders and zero for price-on-request', () => {
    expect(maxQty({ ...base, is_preorder: true, price: 120 })).toBe(Infinity)
    expect(maxQty({ ...base, is_preorder: true, price: 0 })).toBe(0)
  })
  it('is zero for sold or hidden products', () => {
    expect(maxQty({ ...base, stock: 3, status: 'sold' })).toBe(0)
    expect(maxQty({ ...base, stock: 3, status: 'hidden' })).toBe(0)
  })
})

describe('countries', () => {
  it('includes the DHL destinations from the policies', () => {
    for (const code of ['MX', 'CR', 'CL', 'BO', 'ES', 'AR', 'BR', 'IT', 'SV', 'EC', 'FR', 'US']) {
      expect(COUNTRIES.some((c) => c.code === code)).toBe(true)
    }
    expect(COUNTRIES.at(-1)).toEqual({ code: 'OTRO', name: 'Otro país', americas: false })
  })
  it('knows which are in the Americas', () => {
    expect(isAmericas('CL')).toBe(true)
    expect(isAmericas('CA')).toBe(true)
    expect(isAmericas('IT')).toBe(false)
    expect(isAmericas('OTRO')).toBe(false)
    expect(isAmericas(undefined)).toBe(false)
  })
  it('does not list Peru (domestic orders use Lima/Provincias)', () => {
    expect(COUNTRIES.some((c) => c.code === 'PE')).toBe(false)
  })
})
