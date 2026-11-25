import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../shared/catalogRules.js'
import { maxQty, stockBadge } from '../../shared/pricing.js'
import { BRAND } from '../../shared/brand.js'
import { useCart } from '../cart/cartStore.js'
import Badges, { OverlayBadges, Sticker } from '../catalog/Badges.jsx'
import Price from '../catalog/Price.jsx'
import { canAddToList, hasVariants, primaryAction } from '../catalog/productActions.js'
import { IconArrow, IconWhatsApp } from '../layout/icons.jsx'
import Gallery from './Gallery.jsx'
import VariantPicker from './VariantPicker.jsx'

/** "a · b + c, d" → ["a", "b", "c", "d"] */
export function splitExtras(extras) {
  if (!extras) return []
  return extras
    .split(/\s*(?:·|\+|;|,(?![^(]*\)))\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
}

function setMeta(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function useDocumentMeta(product) {
  useEffect(() => {
    const prev = document.title
    document.title = `${product.title} (${product.code}) — ${BRAND.name}`
    setMeta('og:title', product.title)
    setMeta('og:type', 'product')
    const img = product.images?.[0]?.full
    if (img) setMeta('og:image', new URL(img, window.location.origin).href)
    return () => {
      document.title = prev
    }
  }, [product])
}

function AddButton({ product, variant, needsVariant }) {
  const { add, lines, openPanel } = useCart()
  const [added, setAdded] = useState(false)
  useEffect(() => setAdded(false), [variant])
  if (!canAddToList(product)) return null
  const line = lines.find((l) => l.code === product.code && l.variant === (variant ?? null))
  const full = line && line.qty >= maxQty(product)

  if (added || full) {
    return (
      <button type="button" onClick={openPanel} className="vv-btn vv-btn-ghost flex-1">
        ✓ Ver mi lista
      </button>
    )
  }
  return (
    <button
      type="button"
      disabled={needsVariant}
      onClick={() => setAdded(add(product, variant))}
      className="vv-btn vv-btn-ghost flex-1"
    >
      {needsVariant ? 'Elige una versión' : '+ a mi lista'}
    </button>
  )
}

export default function ProductDetail({ product }) {
  const [variant, setVariant] = useState(null)
  useDocumentMeta(product)
  const multi = hasVariants(product)
  const needsVariant = multi && !variant
  const action = primaryAction(product, variant)
  const stock = stockBadge(product)
  const sold = product.status === 'sold'
  const includes = splitExtras(product.extras)

  const facts = [
    ['Código', product.code],
    ['Categoría', CATEGORIES[product.category]],
    ['Licencia', product.is_original === true ? 'Original' : product.is_original === false ? 'Réplica' : null],
    ['Editorial', product.editorial],
    ['Año', product.year],
    ['Estado', product.condition],
  ].filter(([, v]) => v != null && v !== '')

  return (
    <article className="mx-auto max-w-6xl px-4 pb-32 pt-4 lg:pb-12">
      <Link to="/#catalogo" className="mb-4 inline-flex min-h-[44px] items-center gap-1 font-bold text-primary-dark">
        <IconArrow dir="left" width="16" height="16" /> Volver al catálogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.images ?? []} title={product.title}>
          <OverlayBadges product={product} />
        </Gallery>

        <div className="space-y-5">
          <div className="space-y-3">
            <Badges product={product} limit={6} withMeta={false} />
            <h1 className="font-title text-[26px] font-bold leading-tight sm:text-[32px]">{product.title}</h1>
            <p className="font-mono text-sm text-muted">Código {product.code}</p>
          </div>

          <div className="space-y-2">
            <Price product={product} variant={variant} size="lg" />
            {product.is_preorder && product.preorder_eta && (
              <p className="font-mono text-sm">Llega: {product.preorder_eta}</p>
            )}
            {stock && !sold && <Sticker tone={stock.tone === 'warm' ? 'warm' : 'plain'} mono>{stock.label}</Sticker>}
            {sold && <p className="font-bold">Este producto ya se vendió. Te avisamos si llega otro igual.</p>}
          </div>

          {multi && !sold && <VariantPicker product={product} value={variant} onChange={setVariant} />}

          {/* Acciones: barra fija abajo en móvil, en línea en escritorio */}
          <div
            data-testid="buy-bar"
            className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t-4 border-navy bg-surface p-3 lg:static lg:border-t-0 lg:bg-transparent lg:p-0"
          >
            <AddButton product={product} variant={variant} needsVariant={needsVariant} />
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`vv-btn flex-1 ${sold ? 'vv-btn-ghost' : 'vv-btn-primary'}`}
            >
              <IconWhatsApp /> {action.label}
            </a>
          </div>

          {includes.length > 0 && (
            <section aria-labelledby="incluye">
              <h2 id="incluye" className="font-display text-lg">INCLUYE</h2>
              <ul className="mt-2 space-y-1.5">
                {includes.map((item) => (
                  <li key={item} className="flex gap-2 text-[16px]">
                    <span aria-hidden="true" className="mt-[0.45em] h-2 w-2 shrink-0 bg-primary-dark" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <dl className="vv-box grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-[15px]">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="font-mono font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-2 text-[15px] leading-relaxed text-muted">
            {product.is_preorder && (
              <p>
                <strong className="text-navy">Preventa:</strong> se separa con el pago total. Si el fabricante la cancela o cambia, eliges
                reembolso total o cambio. <Link to="/politicas#preventas" className="font-bold text-primary-dark underline">Política de preventa</Link>
              </p>
            )}
            <p>
              Reclamos dentro de los {BRAND.claimDays} días calendario posteriores a la entrega o envío.{' '}
              <Link to="/politicas#garantia" className="font-bold text-primary-dark underline">Garantía y reclamos</Link>
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
