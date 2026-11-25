// Mensajes y enlaces de WhatsApp (spec §9). Solo texto: sin enlaces ni emojis, con negritas de WhatsApp.
import { unitPrice, lineTotal, subtotal, surchargeFor, isPriceOnRequest, maxQty, round2 } from './pricing.js'
import { deliveryById, paymentById, countryName } from './checkoutRules.js'

const envNumber =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WHATSAPP_NUMBER) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_WHATSAPP_NUMBER) ||
  ''

export const WHATSAPP_NUMBER = String(envNumber || '51941392619').replace(/\D/g, '')

/** Límite práctico para que el enlace wa.me abra con el texto completo. */
export const MAX_MESSAGE = 1800

/** Plazo de reclamos que se repite en el mensaje (políticas §2). */
export const CLAIM_DAYS = 5

const BRAND = '*Vitrina Vintage*'
const NL = '\n'
const money = (n) => `S/ ${round2(n).toFixed(2)}`

/** Consulta general (botón flotante, navbar, footer). */
export const GENERAL_MESSAGE = `Hola ${BRAND}, tengo una consulta sobre un álbum del catálogo.`

export function waLink(text, number = WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

function describe(product, variant) {
  return `[${product.code}] ${product.title}${variant ? ` (${variant})` : ''}`
}

function discountTag(product) {
  return Number(product.discount_percent) > 0 ? ` (-${Number(product.discount_percent)}%)` : ''
}

function fullLine({ product, variant, qty }) {
  return `- ${describe(product, variant)} (x${qty})${discountTag(product)} — ${money(lineTotal({ product, variant, qty }))}`
}

function compactLine({ product, variant, qty }) {
  return `- [${product.code}]${variant ? ` (${variant})` : ''} (x${qty}) — ${money(lineTotal({ product, variant, qty }))}`
}

function deliveryText(order) {
  const delivery = deliveryById(order.deliveryId)
  if (!delivery) return 'por coordinar'
  if (delivery.id === 'punto-lima') {
    return `${delivery.label} — ${order.pickupPoint || 'punto por coordinar'} (${delivery.messageNote})`
  }
  const place = order.location === 'extranjero'
    ? [order.city, countryName(order.country)].filter(Boolean).join(', ')
    : order.city
  return `${delivery.label} — ${place || 'por indicar'} (${delivery.messageNote})`
}

/** Subtotal y comisión solo cuando hay recargo (Mercado Pago, PayPal); si no, directo el total. */
function amountLines(order, sub) {
  const method = paymentById(order.paymentId)
  const label = method ? method.label : 'por coordinar'
  const s = surchargeFor(order.paymentId, sub, order.country)
  const total = round2(sub + s.amount)
  const lines = []
  if (s.percent > 0 || s.fixedUsd > 0) {
    const parts = []
    if (s.percent > 0) parts.push(`${money(s.amount)} (${label} +${s.percent}%)`)
    if (s.fixedUsd > 0) parts.push(`$${s.fixedUsd} USD fijos de ${label}`)
    lines.push(`*Subtotal:* ${money(sub)}`)
    lines.push(`*Comisión de pago:* ${parts.join(' + ')}`)
  }
  lines.push(`*Total:* ${money(total)}${s.fixedUsd ? ` + $${s.fixedUsd} USD` : ''}`)
  lines.push(`*Pago:* ${label}${s.note ? ` (${s.note.replace(/\.$/, '')})` : ''}`)
  return lines
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
  const hasPreorder = items.some((l) => l.product.is_preorder)
  const name = String(order.name ?? '').replace(/\s+/g, ' ').trim()

  const head = [`Hola ${BRAND}, quiero hacer este pedido:`, '', '*Productos:*']
  const tail = [
    '',
    ...amountLines(order, sub),
    `*Entrega:* ${deliveryText(order)}`,
    `*Cliente:* ${name}`,
    '',
    ...(hasPreorder ? ['Incluye preventa: entiendo que se separa con el pago total.'] : []),
    `Acepto las políticas de compra, envíos y preventas (plazo de reclamos: ${CLAIM_DAYS} días).`,
  ]
  const assemble = (body) => [...head, ...body, ...tail].join(NL)

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
  return assemble([...kept, `- … y ${compact.length - kept.length} productos más`])
}

/**
 * Mensaje de un solo producto (botones de tarjeta, hero y detalle). Sin enlaces ni emojis.
 * kind: 'pedir' | 'reservar' | 'consultar' | 'avisar'
 */
export function buildProductMessage(product, { variant = null, kind = 'pedir' } = {}) {
  const item = describe(product, variant)
  const price = unitPrice(product, variant)
  const priced = price != null ? `- ${item}${discountTag(product)} — ${money(price)}` : `- ${item}`
  switch (kind) {
    case 'reservar':
      return [`Hola ${BRAND}, quiero reservar esta preventa:`, '', priced, '',
        'Entiendo que la preventa se separa con el pago total.'].join(NL)
    case 'consultar':
      return [`Hola ${BRAND}, quisiera consultar el precio y fecha de llegada de esta preventa:`, '', `- ${item}`].join(NL)
    case 'avisar':
      return [`Hola ${BRAND}, avísenme si llega otro igual a este producto:`, '', `- ${item}`].join(NL)
    default:
      return [`Hola ${BRAND}, quiero pedir este producto:`, '', priced, '', '¿Sigue disponible?'].join(NL)
  }
}
