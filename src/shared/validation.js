// Reglas para poder publicar un producto (spec §10). Devuelve mensajes en español; [] = publicable.
import { CATEGORIES } from './catalogRules.js'

export function validateForPublish(p) {
  const errors = []
  const price = p.price == null || p.price === '' ? null : Number(p.price)
  if (!p.is_preorder && !(price > 0)) errors.push('Falta el precio')
  if (!String(p.title ?? '').trim()) errors.push('Falta el título')
  if (!(p.category in CATEGORIES)) errors.push('Falta la categoría')
  if (p.is_original !== true && p.is_original !== false) errors.push('Indica si es original o réplica')
  if (!String(p.code ?? '').trim()) errors.push('Falta el código')
  if (!(Number(p.stock) >= 1)) errors.push('El stock debe ser al menos 1')
  const variants = p.variants ?? []
  if (variants.some((v) => !String(v.label ?? '').trim() || !(Number(v.price) > 0))) {
    errors.push('Cada versión necesita nombre y precio')
  }
  return errors
}
