// Qué botón principal lleva cada producto, según su estado. Una sola fuente para tarjeta, hero y detalle.
import { isPriceOnRequest, listPrice, unitPrice } from '../../shared/pricing.js'
import { buildProductMessage, waLink } from '../../shared/whatsapp.js'

export function primaryAction(product, variant = null) {
  let kind = 'pedir'
  let label = 'Pedir por WhatsApp'
  let short = 'Pedir'
  if (product.status === 'sold') {
    kind = 'avisar'
    label = 'Avísame si llega otro'
    short = 'Avísame'
  } else if (isPriceOnRequest(product)) {
    kind = 'consultar'
    label = 'Consultar por WhatsApp'
    short = 'Consultar'
  } else if (product.is_preorder) {
    kind = 'reservar'
    label = 'Reservar por WhatsApp'
    short = 'Reservar'
  }
  return { kind, label, short, href: waLink(buildProductMessage(product, { variant, kind })) }
}

/** Se puede sumar a la lista: no vendido, con precio. */
export const canAddToList = (p) => p.status !== 'sold' && !isPriceOnRequest(p)

export const hasVariants = (p) => (p.variants ?? []).length > 0

/** Precio mostrado: final, de lista (si hay descuento) y si es "desde" (varias versiones). */
export function displayPrice(product, variant = null) {
  if (isPriceOnRequest(product)) return { onRequest: true }
  if (!variant && hasVariants(product)) {
    const finals = product.variants.map((v) => unitPrice(product, v.label)).filter((n) => n != null)
    const lists = product.variants.map((v) => listPrice(product, v.label)).filter((n) => n != null)
    if (finals.length) {
      const min = Math.min(...finals)
      const distinct = new Set(finals).size > 1
      return { final: min, list: Number(product.discount_percent) > 0 ? Math.min(...lists) : null, from: distinct }
    }
  }
  const final = unitPrice(product, variant)
  const list = Number(product.discount_percent) > 0 ? listPrice(product, variant) : null
  return { final, list, from: false }
}

export const money = (n) => `S/ ${Number(n).toFixed(2)}`
