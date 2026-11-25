// Modalidades de entrega y métodos de pago según ubicación (políticas §4–§5, spec §9).
export { COUNTRIES, isAmericas, countryName } from './countries.js'

export const LOCATIONS = ['lima', 'provincias', 'extranjero']

export const LOCATION_LABELS = {
  lima: 'Lima',
  provincias: 'Provincias (Perú)',
  extranjero: 'Extranjero',
}

export const PICKUP_POINTS = [
  'Real Plaza Centro Cívico',
  'Metropolitano — Estación Naranjal',
  'Metropolitano — Estación Canaval y Moreyra',
  'Los Olivos / SMP — Av. Canta Callao con Av. Los Alisos',
  'Los Olivos / SMP — Av. Canta Callao con Av. Naranjal',
]

export const DELIVERY_OPTIONS = [
  {
    id: 'punto-lima',
    label: 'Entrega gratuita',
    locations: ['lima'],
    pickupPoints: PICKUP_POINTS,
    shippingNote: 'Gratis en punto de encuentro. Puedes pagar en efectivo al recibir.',
    messageNote: 'gratis',
  },
  {
    id: 'motorizado-indrive',
    label: 'Motorizado (InDrive)',
    locations: ['lima'],
    shippingNote: 'Te cotizamos el envío; lo pagas al recibir. El producto se paga antes del despacho.',
    messageNote: 'envío a cotizar, se paga al recibir',
  },
  {
    id: 'motorizado-propio',
    label: 'Motorizado propio',
    locations: ['lima'],
    shippingNote: 'Tú pides el motorizado al punto que te indiquemos y asumes el seguimiento y la recepción.',
    messageNote: 'lo gestiona el comprador',
  },
  {
    id: 'olva',
    label: 'Olva Courier',
    locations: ['lima', 'provincias'],
    shippingNote: 'A agencia o domicilio. Producto y envío (cotizado) se pagan antes del envío.',
    messageNote: 'envío a cotizar',
  },
  {
    id: 'shalom',
    label: 'Shalom',
    locations: ['provincias'],
    shippingNote: 'Solo a agencia. El producto se paga antes; el envío se paga al recoger en destino.',
    messageNote: 'envío se paga en destino',
  },
  {
    id: 'dhl',
    label: 'DHL internacional',
    locations: ['extranjero'],
    shippingNote: 'Referencial $55–80 USD por paquete de 3–4 kg. Producto y envío se pagan antes del despacho.',
    messageNote: 'envío a cotizar, referencial $55–80 USD',
  },
]

export const PAYMENT_METHODS = [
  { id: 'yape-plin', label: 'Yape / Plin', scope: 'peru' },
  { id: 'transferencia', label: 'Transferencia (BCP, BBVA, Interbank, Scotiabank)', scope: 'peru' },
  { id: 'efectivo', label: 'Efectivo contraentrega', scope: 'peru', note: 'Solo en entregas gratuitas en Lima.' },
  { id: 'mercadopago', label: 'Tarjeta (link Mercado Pago)', scope: 'peru', note: 'Recargo de 7 % de la pasarela.' },
  { id: 'wu-mg', label: 'Western Union / MoneyGram', scope: 'extranjero' },
  { id: 'paypal', label: 'PayPal', scope: 'extranjero', note: '$10 USD fijos + 8 % aprox. en América.' },
]

export function deliveryOptionsFor(location) {
  return DELIVERY_OPTIONS.filter((d) => d.locations.includes(location))
}

export function paymentMethodsFor(location, deliveryId) {
  const scope = location === 'extranjero' ? 'extranjero' : 'peru'
  return PAYMENT_METHODS.filter((m) => {
    if (m.scope !== scope) return false
    if (m.id === 'efectivo') return location === 'lima' && deliveryId === 'punto-lima'
    return true
  })
}

export const deliveryById = (id) => DELIVERY_OPTIONS.find((d) => d.id === id)
export const paymentById = (id) => PAYMENT_METHODS.find((m) => m.id === id)
