import {
  LOCATIONS, DELIVERY_OPTIONS, PAYMENT_METHODS, PICKUP_POINTS, deliveryOptionsFor, paymentMethodsFor,
  COUNTRIES, isAmericas,
} from '../../src/shared/checkoutRules.js'

describe('checkout rules', () => {
  it('has the three locations', () => {
    expect(LOCATIONS).toEqual(['lima', 'provincias', 'extranjero'])
  })

  it('delivery options per location', () => {
    expect(deliveryOptionsFor('lima').map((d) => d.id)).toEqual(['punto-lima', 'motorizado-indrive', 'motorizado-propio', 'olva'])
    expect(deliveryOptionsFor('provincias').map((d) => d.id)).toEqual(['olva', 'shalom'])
    expect(deliveryOptionsFor('extranjero').map((d) => d.id)).toEqual(['dhl'])
    expect(deliveryOptionsFor('marte')).toEqual([])
  })

  it('free pickup lists the meeting points from the policies', () => {
    const punto = DELIVERY_OPTIONS.find((d) => d.id === 'punto-lima')
    expect(punto.pickupPoints).toBe(PICKUP_POINTS)
    expect(PICKUP_POINTS.join(' ')).toMatch(/Real Plaza Centro Cívico/)
    expect(PICKUP_POINTS.join(' ')).toMatch(/Naranjal/)
    expect(PICKUP_POINTS.join(' ')).toMatch(/Canaval y Moreyra/)
    expect(PICKUP_POINTS.join(' ')).toMatch(/Canta Callao/)
  })

  it('cash on delivery only with free pickup in Lima', () => {
    expect(paymentMethodsFor('lima', 'punto-lima').map((m) => m.id)).toContain('efectivo')
    expect(paymentMethodsFor('lima', 'olva').map((m) => m.id)).not.toContain('efectivo')
    expect(paymentMethodsFor('lima', 'motorizado-indrive').map((m) => m.id)).not.toContain('efectivo')
    expect(paymentMethodsFor('provincias', 'shalom').map((m) => m.id)).not.toContain('efectivo')
  })

  it('Peru methods for national orders', () => {
    expect(paymentMethodsFor('provincias', 'olva').map((m) => m.id)).toEqual(['yape-plin', 'transferencia', 'mercadopago'])
  })

  it('only WU/MG and PayPal abroad', () => {
    expect(paymentMethodsFor('extranjero', 'dhl').map((m) => m.id)).toEqual(['wu-mg', 'paypal'])
  })

  it('every payment method has a label', () => {
    for (const m of PAYMENT_METHODS) expect(m.label).toBeTruthy()
  })

  it('re-exports the country helpers', () => {
    expect(COUNTRIES.length).toBeGreaterThan(12)
    expect(isAmericas('CL')).toBe(true)
    expect(isAmericas('IT')).toBe(false)
  })
})
