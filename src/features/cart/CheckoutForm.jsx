import { useId } from 'react'
import { Link } from 'react-router-dom'
import {
  COUNTRIES,
  LOCATIONS,
  LOCATION_LABELS,
  deliveryOptionsFor,
  paymentMethodsFor,
  deliveryById,
} from '../../shared/checkoutRules.js'

export const NAME_MAX = 60
export const CITY_MAX = 60

export const INITIAL_CHECKOUT = {
  location: 'lima',
  country: '',
  deliveryId: 'punto-lima',
  pickupPoint: '',
  paymentId: '',
  name: '',
  city: '',
  acceptedPolicies: false,
}

const oneLine = (s, max) => s.replace(/\s+/g, ' ').slice(0, max)

/** Aplica un cambio y mantiene entrega/pago coherentes con la ubicación (políticas §4–§5). */
export function updateCheckout(state, patch) {
  const next = { ...state, ...patch }
  const deliveries = deliveryOptionsFor(next.location)
  if (!deliveries.some((d) => d.id === next.deliveryId)) next.deliveryId = deliveries[0]?.id ?? ''
  if (next.deliveryId !== 'punto-lima') next.pickupPoint = ''
  if (next.location !== 'extranjero') next.country = ''
  const payments = paymentMethodsFor(next.location, next.deliveryId)
  if (!payments.some((m) => m.id === next.paymentId)) next.paymentId = ''
  return next
}

/** Lo que falta para poder enviar (vacío = listo). */
export function missingFields(state) {
  const missing = []
  if (!state.deliveryId) missing.push('modalidad de entrega')
  if (state.deliveryId === 'punto-lima' && !state.pickupPoint) missing.push('punto de encuentro')
  if (state.location === 'extranjero' && !state.country) missing.push('país')
  if (!state.paymentId) missing.push('método de pago')
  if (!state.name.trim()) missing.push('nombre')
  if (state.deliveryId !== 'punto-lima' && !state.city.trim()) {
    missing.push(state.location === 'lima' ? 'distrito' : 'ciudad')
  }
  if (!state.acceptedPolicies) missing.push('aceptar las políticas')
  return missing
}

function Option({ name, checked, onChange, title, detail }) {
  return (
    <label
      className={`flex min-h-[48px] cursor-pointer items-start gap-3 rounded-brand p-3 ${checked ? 'bg-[var(--color-primary-tint)]' : 'bg-card'}`}
      style={{ border: 'var(--border-hard)' }}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary-dark)]" />
      <span>
        <span className="block font-bold">{title}</span>
        {detail && <span className="block text-sm text-muted">{detail}</span>}
      </span>
    </label>
  )
}

function Step({ title, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-title text-base font-bold">{title}</legend>
      {children}
    </fieldset>
  )
}

export default function CheckoutForm({ value, onChange, hasPreorder }) {
  const id = useId()
  const set = (patch) => onChange(updateCheckout(value, patch))
  const deliveries = deliveryOptionsFor(value.location)
  const payments = paymentMethodsFor(value.location, value.deliveryId)
  const delivery = deliveryById(value.deliveryId)
  const cityLabel = value.location === 'lima' ? 'Distrito' : 'Ciudad'

  return (
    <div className="space-y-6">
      <Step title="¿Dónde recibes?">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Ubicación">
          {LOCATIONS.map((loc) => {
            const checked = value.location === loc
            return (
              <label
                key={loc}
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-brand px-2 text-center text-sm font-bold ${
                  checked ? 'bg-navy text-card' : 'bg-card'
                } has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[var(--color-primary)]`}
                style={{ border: 'var(--border-hard)' }}
              >
                <input type="radio" name={`${id}-loc`} checked={checked} onChange={() => set({ location: loc })} className="sr-only" />
                {LOCATION_LABELS[loc]}
              </label>
            )
          })}
        </div>
        {value.location === 'extranjero' && (
          <label className="block pt-2">
            <span className="mb-1 block text-sm font-bold">País</span>
            <select value={value.country} onChange={(e) => set({ country: e.target.value })} className="vv-input">
              <option value="">Elige tu país</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
        )}
      </Step>

      <Step title="Entrega">
        {deliveries.map((d) => (
          <Option
            key={d.id}
            name={`${id}-del`}
            checked={value.deliveryId === d.id}
            onChange={() => set({ deliveryId: d.id })}
            title={d.id === 'punto-lima' ? 'Entrega gratuita en punto de encuentro' : d.label}
            detail={d.shippingNote}
          />
        ))}
        {delivery?.pickupPoints && (
          <div className="pt-1">
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Punto de encuentro</span>
              <select
                value={value.pickupPoint}
                onChange={(e) => set({ pickupPoint: e.target.value })}
                aria-describedby={`${id}-pickup-help`}
                className="vv-input"
              >
                <option value="">Elige un punto</option>
                {delivery.pickupPoints.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <p id={`${id}-pickup-help`} className="mt-1 text-sm text-muted">Otras estaciones del Metropolitano, previa consulta.</p>
          </div>
        )}
      </Step>

      <Step title="Pago">
        {payments.map((m) => (
          <Option
            key={m.id}
            name={`${id}-pay`}
            checked={value.paymentId === m.id}
            onChange={() => set({ paymentId: m.id })}
            title={m.label}
            detail={m.note}
          />
        ))}
      </Step>

      <Step title="Tus datos">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Nombre</span>
          <input
            type="text"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={value.name}
            onChange={(e) => set({ name: oneLine(e.target.value, NAME_MAX) })}
            className="vv-input"
          />
        </label>
        {value.deliveryId !== 'punto-lima' && (
          <label className="block">
            <span className="mb-1 block text-sm font-bold">{cityLabel}</span>
            <input
              type="text"
              autoComplete={value.location === 'lima' ? 'address-level3' : 'address-level2'}
              maxLength={CITY_MAX}
              value={value.city}
              onChange={(e) => set({ city: oneLine(e.target.value, CITY_MAX) })}
              className="vv-input"
            />
          </label>
        )}
      </Step>

      {hasPreorder && (
        <div className="rounded-brand bg-[var(--color-navy-tint)] p-3 text-sm leading-relaxed" data-testid="preorder-policy">
          <strong>Tu lista tiene preventas.</strong> Se separan con el pago total. Si excepcionalmente pagas en partes y no completas
          antes del cierre, pierdes el precio de preventa y los abonos no se devuelven. Si el fabricante la cancela o cambia, eliges
          reembolso total o cambio.
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={value.acceptedPolicies}
          onChange={(e) => set({ acceptedPolicies: e.target.checked })}
          className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-primary-dark)]"
        />
        <span>
          He leído y acepto las{' '}
          <Link to="/politicas" target="_blank" className="font-bold text-primary-dark underline">
            Políticas de Compra, Envíos y Preventa
          </Link>{' '}
          de Vitrina Vintage
        </span>
      </label>
    </div>
  )
}
