// Precios, descuentos, recargos por método de pago y stock. Spec §8–§9.
import { isAmericas } from './countries.js'

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const num = (v) => (v == null || v === '' ? null : Number(v))

export function isPriceOnRequest(p) {
  return Boolean(p.is_preorder) && !(num(p.price) > 0)
}

/** Precio de lista (sin descuento) de la variante elegida o del producto. */
export function listPrice(p, variantLabel = null) {
  if (isPriceOnRequest(p)) return null
  const variant = variantLabel ? (p.variants ?? []).find((v) => v.label === variantLabel) : null
  const value = num(variant ? variant.price : p.price)
  return value > 0 ? round2(value) : null
}

/** Precio final con descuento. */
export function unitPrice(p, variantLabel = null) {
  const list = listPrice(p, variantLabel)
  if (list == null) return null
  const discount = num(p.discount_percent) || 0
  return round2(list * (1 - discount / 100))
}

export function lineTotal({ product, variant = null, qty }) {
  const price = unitPrice(product, variant)
  return price == null ? 0 : round2(price * qty)
}

export function subtotal(lines) {
  return round2(lines.reduce((sum, line) => sum + lineTotal(line), 0))
}

const NONE = { percent: 0, amount: 0, fixedUsd: 0, note: null }

/** Recargo según método de pago (políticas §4). */
export function surchargeFor(methodId, sub, countryCode) {
  switch (methodId) {
    case 'mercadopago':
      return { percent: 7, amount: round2(sub * 0.07), fixedUsd: 0, note: null }
    case 'paypal':
      if (isAmericas(countryCode)) {
        return { percent: 8, amount: round2(sub * 0.08), fixedUsd: 10, note: null }
      }
      return {
        percent: 0,
        amount: 0,
        fixedUsd: 10,
        note: 'Comisión de PayPal: el 8 % podría aplicar según tu país; se confirma por WhatsApp.',
      }
    case 'wu-mg':
      return { ...NONE, note: 'La comisión del envío de dinero la asumes en tu país de origen.' }
    default:
      return { ...NONE }
  }
}

/** "Quedan X" / "Últimas unidades"; nada para piezas únicas, agotados o preventas. */
export function stockBadge(p) {
  if (p.is_preorder) return null
  const stock = num(p.stock) ?? 1
  if (stock <= 1) return null
  if (stock <= 3) return { label: 'Últimas unidades', tone: 'warm' }
  return { label: `Quedan ${stock}`, tone: 'neutral' }
}

/** Cantidad máxima que se puede pedir de un producto. */
export function maxQty(p) {
  if (p.status === 'sold' || p.status === 'hidden') return 0
  if (p.is_preorder) return isPriceOnRequest(p) ? 0 : Infinity
  return Math.max(0, num(p.stock) ?? 1)
}
