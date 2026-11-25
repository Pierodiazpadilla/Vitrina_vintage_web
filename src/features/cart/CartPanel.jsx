import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../lib/catalogContext.jsx'
import { safeStorage } from '../../lib/storage.js'
import { maxQty, unitPrice } from '../../shared/pricing.js'
import { buildOrderMessage, waLink } from '../../shared/whatsapp.js'
import { useCart } from './cartStore.js'
import CheckoutForm, { INITIAL_CHECKOUT, missingFields, updateCheckout } from './CheckoutForm.jsx'
import OrderSummary, { orderTotals } from './OrderSummary.jsx'
import ProductImage from '../catalog/ProductImage.jsx'
import { money } from '../catalog/productActions.js'
import { IconClose, IconTrash, IconWhatsApp } from '../layout/icons.jsx'

const DRAFT_KEY = 'vv:checkout:v1'

/** Recuerda ubicación, nombre y ciudad (nunca la aceptación de políticas). */
function loadDraft() {
  const saved = safeStorage.get(DRAFT_KEY, null)
  if (!saved || typeof saved !== 'object') return INITIAL_CHECKOUT
  const pick = (k, max = 60) => (typeof saved[k] === 'string' ? saved[k].slice(0, max) : '')
  return updateCheckout(INITIAL_CHECKOUT, {
    location: ['lima', 'provincias', 'extranjero'].includes(saved.location) ? saved.location : 'lima',
    country: pick('country', 8),
    name: pick('name'),
    city: pick('city'),
  })
}

function Stepper({ qty, max, onChange, label }) {
  const btn = 'flex h-11 w-11 items-center justify-center font-mono text-lg font-bold disabled:opacity-40'
  return (
    <div className="inline-flex items-center rounded-brand bg-card" style={{ border: 'var(--border-hard)' }} role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" className={btn} onClick={() => onChange(qty - 1)} aria-label="Quitar uno">−</button>
      <span className="min-w-[2ch] text-center font-mono font-bold" aria-live="polite">{qty}</span>
      <button type="button" className={btn} onClick={() => onChange(qty + 1)} disabled={qty >= max} aria-label="Agregar uno">+</button>
    </div>
  )
}

export default function CartPanel() {
  const { products, loading } = useCatalog()
  const { lines, setQty, remove, clear, revalidate, closePanel } = useCart()
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState(loadDraft)
  const [sent, setSent] = useState(false)
  const closeRef = useRef(null)

  // Al abrir (y si llega un catálogo más nuevo) se revisa la lista contra los datos actuales.
  useEffect(() => {
    if (loading || !products.length) return
    const { notices: found } = revalidate(products)
    if (found.length) setNotices((prev) => [...new Set([...prev, ...found])])
  }, [products, loading, revalidate])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && closePanel()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [closePanel])

  useEffect(() => {
    safeStorage.set(DRAFT_KEY, { location: form.location, country: form.country, name: form.name, city: form.city })
  }, [form.location, form.country, form.name, form.city])

  const byCode = useMemo(() => new Map(products.map((p) => [p.code, p])), [products])
  const items = lines
    .map((l) => ({ ...l, product: byCode.get(l.code) }))
    .filter((l) => l.product && unitPrice(l.product, l.variant) != null)
  const count = items.reduce((n, l) => n + l.qty, 0)
  const hasPreorder = items.some((l) => l.product.is_preorder)
  const missing = items.length ? missingFields(form) : ['al menos un producto']
  const ready = missing.length === 0
  const totals = orderTotals(items, form.paymentId, form.country)

  const message = ready
    ? buildOrderMessage({
        lines: items,
        location: form.location,
        country: form.country || undefined,
        deliveryId: form.deliveryId,
        pickupPoint: form.pickupPoint,
        paymentId: form.paymentId,
        name: form.name.trim(),
        city: form.city.trim(),
        acceptedPolicies: form.acceptedPolicies,
      })
    : null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <button type="button" tabIndex={-1} aria-label="Cerrar mi lista" onClick={closePanel} className="absolute inset-0 h-full w-full bg-[var(--color-scrim)]" />
      <div
        className="vv-sheet vv-sheet-side absolute inset-x-0 bottom-0 flex max-h-[94vh] flex-col rounded-t-[10px] bg-surface md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none"
        style={{ borderTop: 'var(--divider)', borderLeft: 'var(--border-hard)' }}
      >
        <header className="flex items-center justify-between px-4 py-3">
          <h2 id="cart-title" className="font-display text-lg">
            MI LISTA <span className="font-mono text-base">({count})</span>
          </h2>
          <button ref={closeRef} type="button" onClick={closePanel} className="vv-btn vv-btn-ghost h-11 w-11 p-0" aria-label="Cerrar mi lista">
            <IconClose />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
          {notices.length > 0 && (
            <div role="status" className="rounded-brand bg-[var(--color-accent-tint)] p-3 text-sm" style={{ border: 'var(--border-hard)' }}>
              <p className="font-bold">Actualizamos tu lista:</p>
              <ul className="mt-1 list-disc pl-5">
                {notices.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          )}

          {sent ? (
            <div className="py-6 text-center">
              <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
              <h3 className="mt-3 font-title text-xl font-bold">Tu pedido está listo en WhatsApp</h3>
              <p className="mt-1 text-muted">Envía el mensaje y te respondemos con la disponibilidad y el costo del envío.</p>
              <div className="mt-5 flex flex-col gap-2">
                <a href={waLink(message ?? '')} target="_blank" rel="noopener noreferrer" className="vv-btn vv-btn-primary">
                  <IconWhatsApp /> Abrir WhatsApp otra vez
                </a>
                <button type="button" className="vv-btn vv-btn-ghost" onClick={() => { clear(); setSent(false); closePanel() }}>
                  Vaciar mi lista
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
              <h3 className="mt-3 font-title text-xl font-bold">Tu lista está vacía</h3>
              <p className="mt-1 text-muted">Agrega productos con “+ a mi lista” y envíalos juntos en un solo mensaje.</p>
              <Link to="/#catalogo" onClick={closePanel} className="vv-btn vv-btn-primary mt-5">Ver el catálogo</Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3" aria-label="Productos en tu lista">
                {items.map((l) => (
                  <li key={`${l.code}|${l.variant ?? ''}`} className="vv-box flex gap-3 p-2" data-testid={`line-${l.code}`}>
                    <ProductImage image={l.product.images?.[0]} alt="" className="h-20 w-20 shrink-0 rounded-[3px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-title text-[15px] font-semibold leading-snug">{l.product.title}</p>
                      <p className="font-mono text-xs text-muted">
                        {l.code}{l.variant ? ` · ${l.variant}` : ''}{l.product.is_preorder ? ' · preventa' : ''}
                      </p>
                      <p className="font-mono text-sm font-bold">
                        {money(unitPrice(l.product, l.variant))}
                        {Number(l.product.discount_percent) > 0 && <span className="ml-1 font-medium text-muted">(-{Number(l.product.discount_percent)}%)</span>}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <Stepper
                          qty={l.qty}
                          max={maxQty(l.product)}
                          label={l.product.title}
                          onChange={(q) => setQty(l.code, l.variant, q)}
                        />
                        <button type="button" onClick={() => remove(l.code, l.variant)} className="flex h-11 w-11 items-center justify-center text-navy" aria-label={`Quitar ${l.product.title}`}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <hr className="vv-divider" />
              <CheckoutForm value={form} onChange={setForm} hasPreorder={hasPreorder} />
              <div className="vv-box p-4">
                <h3 className="mb-2 font-title text-base font-bold">Resumen</h3>
                <OrderSummary items={items} paymentId={form.paymentId} country={form.country} deliveryId={form.deliveryId} />
              </div>
            </>
          )}
        </div>

        {!sent && items.length > 0 && (
          <footer className="space-y-3 bg-card px-4 pb-4 pt-3" style={{ borderTop: 'var(--divider)' }}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-bold">Total productos</span>
              <span className="whitespace-nowrap font-mono text-xl font-bold">
                {money(totals.total)}
                {totals.surcharge.fixedUsd > 0 && <span className="text-sm"> + ${totals.surcharge.fixedUsd} USD</span>}
              </span>
            </div>
            {ready ? (
              <a
                href={waLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSent(true)}
                className="vv-btn vv-btn-primary w-full text-base"
              >
                <IconWhatsApp /> Enviar pedido por WhatsApp
              </a>
            ) : (
              <>
                <button type="button" disabled className="vv-btn vv-btn-primary w-full text-base">
                  <IconWhatsApp /> Enviar pedido por WhatsApp
                </button>
                <p className="text-sm text-muted">Falta: {missing.join(', ')}.</p>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
