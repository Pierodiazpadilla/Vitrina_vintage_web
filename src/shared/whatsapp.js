// Mensajes y enlaces de WhatsApp (spec §9).
import { unitPrice, lineTotal, subtotal, surchargeFor, isPriceOnRequest, maxQty, round2 } from './pricing.js'
import { deliveryById, paymentById, countryName } from './checkoutRules.js'

const envNumber =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WHATSAPP_NUMBER) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_WHATSAPP_NUMBER) ||
  ''

export const WHATSAPP_NUMBER = String(envNumber || '51941392619').replace(/\D/g, '')

/** Límite práctico para que el enlace wa.me abra con el texto completo. */
export const MAX_MESSAGE = 1800

const GREETING = 'Hola Vitrina Vintage 👋'
const money = (n) => `S/ ${round2(n).toFixed(2)}`

export function waLink(text, number = WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

function describe(product, variant) {
  const parts = [`${product.code} — ${product.title}`]
  if (variant) parts.push(`(${variant})`)
  return parts.join(' ')
}

function discountTag(product) {
  return Number(product.discount_percent) > 0 ? ` (-${Number(product.discount_percent)}%)` : ''
}

function fullLine({ product, variant, qty }) {
  const qtyTag = qty > 1 ? ` x${qty}` : ''
  return `• ${describe(product, variant)}${qtyTag}${discountTag(product)} — ${money(lineTotal({ product, variant, qty }))}`
}

function compactLine({ product, variant, qty }) {
  return `• ${product.code}${variant ? ` (${variant})` : ''} x${qty} — ${money(lineTotal({ product, variant, qty }))}`
}

function deliveryLine(order) {
  const delivery = deliveryById(order.deliveryId)
  if (!delivery) return 'Entrega: por coordinar'
  if (delivery.id === 'punto-lima') {
    return `Entrega: ${delivery.label} — ${order.pickupPoint || 'punto por coordinar'} (${delivery.messageNote})`
  }
  const place = order.location === 'extranjero'
    ? [order.city, countryName(order.country)].filter(Boolean).join(', ')
    : order.city
  return `Entrega: ${delivery.label} — ${place || 'por indicar'} (${delivery.messageNote})`
}

function paymentLines(order, sub) {
  const method = paymentById(order.paymentId)
  const label = method ? method.label : 'por coordinar'
  const s = surchargeFor(order.paymentId, sub, order.country)
  const lines = []
  lines.push(s.percent > 0 ? `Pago: ${label} +${s.percent}%: ${money(s.amount)}` : `Pago: ${label}`)
  if (s.fixedUsd) lines.push(`+ $${s.fixedUsd} USD (comisión fija de ${label})`)
  if (s.note) lines.push(s.note)
  return { lines, total: round2(sub + s.amount) }
}

/**
 * @param {{ lines: {product, variant, qty}[], location, country?, deliveryId, pickupPoint?,
 *           paymentId, name, city, acceptedPolicies: boolean }} order
 */
export function buildOrderMessage(order) {
  if (order.acceptedPolicies !== true) {
    throw new Error('El cliente debe aceptar las políticas antes de enviar el pedido')
  }
  // Última barrera antes del dinero: sin vendidos/ocultos/agotados, sin versiones inexistentes,
  // y cantidad topada al stock disponible.
  const items = order.lines
    .filter((l) => !isPriceOnRequest(l.product) && l.qty > 0 && maxQty(l.product) > 0)
    .filter((l) => unitPrice(l.product, l.variant ?? null) != null)
    .map((l) => ({ ...l, qty: Math.min(l.qty, maxQty(l.product)) }))
  const sub = subtotal(items)
  const payment = paymentLines(order, sub)
  const hasPreorder = items.some((l) => l.product.is_preorder)

  const head = [`${GREETING} Quiero hacer este pedido:`, '']
  const tail = [
    '',
    `Subtotal: ${money(sub)}`,
    ...payment.lines,
    `Total productos: ${money(payment.total)}`,
    deliveryLine(order),
    `Nombre: ${order.name}`,
    ...(hasPreorder ? ['⏳ Incluye preventa: entiendo que se separa con el pago total (política de preventa).'] : []),
    '✅ Acepto las políticas de compra, envíos y preventa.',
  ]
  const assemble = (body) => [...head, ...body, ...tail].join('\n')

  const full = assemble(items.map(fullLine))
  if (full.length <= MAX_MESSAGE) return full

  const compact = items.map(compactLine)
  if (assemble(compact).length <= MAX_MESSAGE) return assemble(compact)

  // Demasiados productos: listar los que entren y resumir el resto.
  const budget = MAX_MESSAGE - assemble([]).length - 40
  const kept = []
  let used = 0
  for (const line of compact) {
    if (used + line.length + 1 > budget) break
    kept.push(line)
    used += line.length + 1
  }
  return assemble([...kept, `… y ${compact.length - kept.length} productos más`])
}

/**
 * Mensaje de un solo producto (botones de tarjeta y detalle).
 * kind: 'pedir' | 'reservar' | 'consultar' | 'avisar'
 */
export function buildProductMessage(product, { variant = null, kind = 'pedir', url = null } = {}) {
  const item = describe(product, variant)
  const price = unitPrice(product, variant)
  const priced = price != null ? `• ${item}${discountTag(product)} — ${money(price)}` : `• ${item}`
  const link = url ? [url] : []
  switch (kind) {
    case 'reservar':
      return [`${GREETING} Quiero reservar esta preventa:`, priced, ...link,
        'Entiendo que la preventa se separa con el pago total.'].join('\n')
    case 'consultar':
      return [`${GREETING} Quiero consultar el precio de esta preventa:`, `• ${item}`, ...link].join('\n')
    case 'avisar':
      return [`${GREETING} Avísenme si llega otro igual a este:`, `• ${item}`, ...link].join('\n')
    default:
      return [`${GREETING} Quiero pedir:`, priced, ...link, '¿Sigue disponible?'].join('\n')
  }
}

