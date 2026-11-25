import { subtotal, surchargeFor } from '../../shared/pricing.js'
import { paymentById } from '../../shared/checkoutRules.js'
import { money } from '../catalog/productActions.js'

const SHIPPING_TEXT = {
  'punto-lima': 'Gratis',
  'motorizado-indrive': 'A cotizar por WhatsApp (se paga al recibir)',
  'motorizado-propio': 'Lo gestionas tú',
  olva: 'A cotizar por WhatsApp',
  shalom: 'Se paga en destino',
  dhl: 'A cotizar: referencial $55–80 USD',
}

/** Montos del pedido con las mismas reglas que el mensaje (pricing.js). */
export function orderTotals(items, paymentId, country) {
  const sub = subtotal(items)
  const s = surchargeFor(paymentId, sub, country)
  return { sub, surcharge: s, total: Math.round((sub + s.amount) * 100) / 100 }
}

export default function OrderSummary({ items, paymentId, country, deliveryId }) {
  const { sub, surcharge, total } = orderTotals(items, paymentId, country)
  const method = paymentById(paymentId)
  const row = 'flex items-baseline justify-between gap-4'
  return (
    <div className="space-y-1.5 text-[15px]" data-testid="order-summary">
      <div className={row}>
        <span>Subtotal</span>
        <span className="whitespace-nowrap font-mono">{money(sub)}</span>
      </div>
      {surcharge.percent > 0 && (
        <div className={row}>
          <span>Recargo {method?.label} (+{surcharge.percent}%)</span>
          <span className="whitespace-nowrap font-mono">{money(surcharge.amount)}</span>
        </div>
      )}
      {surcharge.fixedUsd > 0 && (
        <div className={row}>
          <span>Comisión fija de PayPal</span>
          <span className="whitespace-nowrap font-mono">+ ${surcharge.fixedUsd} USD</span>
        </div>
      )}
      {surcharge.note && <p className="text-sm text-muted">{surcharge.note}</p>}
      <div className={`${row} pt-1.5`} style={{ borderTop: 'var(--border-hard)' }}>
        <span className="font-bold">Total productos</span>
        <span className="font-mono text-xl font-bold" data-testid="order-total">{money(total)}</span>
      </div>
      {deliveryId && (
        <div className={row}>
          <span>Envío</span>
          <span className="text-right text-sm">{SHIPPING_TEXT[deliveryId]}</span>
        </div>
      )}
    </div>
  )
}
