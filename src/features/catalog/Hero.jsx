// Hero "consola": el producto destacado se ve en la pantalla de una portátil 8-bit como la del logo.
// La cruceta pasa de producto; el botón grande de la consola es el CTA real (WhatsApp).
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from './ProductImage.jsx'
import Price from './Price.jsx'
import { primaryAction } from './productActions.js'
import { IconArrow, IconWhatsApp } from '../layout/icons.jsx'

const MAX_SLIDES = 4

/** featured_rank ordenados; si no hay, las preventas publicadas más recientes; si no, nada. */
export function heroProducts(products) {
  const live = products.filter((p) => p.status === 'published')
  const featured = live
    .filter((p) => p.featured_rank != null)
    .sort((a, b) => a.featured_rank - b.featured_rank)
  if (featured.length) return featured.slice(0, MAX_SLIDES)
  return live
    .filter((p) => p.is_preorder)
    .sort((a, b) => String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')))
    .slice(0, MAX_SLIDES)
}

const pad = (n) => String(n).padStart(2, '0')

function DPad({ onPrev, onNext, disabled }) {
  const arm = 'absolute flex h-11 w-11 items-center justify-center bg-navy text-card disabled:opacity-60'
  return (
    <div className="relative h-[132px] w-[132px] shrink-0" role="group" aria-label="Cambiar producto">
      {/* brazos decorativos arriba/abajo */}
      <span aria-hidden="true" className="absolute left-[44px] top-0 h-11 w-11 rounded-t-[4px] bg-navy" />
      <span aria-hidden="true" className="absolute bottom-0 left-[44px] h-11 w-11 rounded-b-[4px] bg-navy" />
      <span aria-hidden="true" className="absolute left-[44px] top-[44px] h-11 w-11 bg-navy" />
      <button type="button" onClick={onPrev} disabled={disabled} aria-label="Producto anterior" className={`${arm} left-0 top-[44px] rounded-l-[4px]`}>
        <IconArrow dir="left" width="18" height="18" />
      </button>
      <button type="button" onClick={onNext} disabled={disabled} aria-label="Producto siguiente" className={`${arm} right-0 top-[44px] rounded-r-[4px]`}>
        <IconArrow dir="right" width="18" height="18" />
      </button>
    </div>
  )
}

export default function Hero({ products }) {
  const slides = heroProducts(products)
  const [index, setIndex] = useState(0)
  const touch = useRef(null)
  const count = slides.length

  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  if (!count) return null
  const current = slides[Math.min(index, count - 1)]
  const action = primaryAction(current)
  const go = (delta) => setIndex((i) => (i + delta + count) % count)
  const allPreorders = slides.every((p) => p.is_preorder)
  const heading = allPreorders ? 'NUEVAS PREVENTAS' : 'EN VITRINA'

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    touch.current = null
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label={heading.toLowerCase()}
      data-testid="hero"
      className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-5 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-14 lg:pt-12"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
    >
      {/* Texto (escritorio a la izquierda; en móvil, debajo de la consola) */}
      <div className="order-2 lg:order-1">
        <h1 className="font-display text-[28px] leading-[1.05] text-navy sm:text-[40px] lg:text-[52px]">{heading}</h1>
        <hr className="vv-divider my-4 w-24" />
        <p className="max-w-md text-[17px] leading-relaxed text-muted">
          {allPreorders
            ? 'Se separan con el pago total y te avisamos cuando llegan. Elige en la pantalla y reserva por WhatsApp.'
            : 'Lo que más nos piden esta semana. Elige en la pantalla y pídelo por WhatsApp.'}
        </p>
        {count > 1 && (
          <ul className="mt-6 hidden gap-3 lg:flex" aria-label="Productos destacados">
            {slides.map((p, i) => (
              <li key={p.code}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  aria-label={p.title}
                  className={`vv-press block h-20 w-20 overflow-hidden rounded-brand bg-card ${i === index ? 'shadow-hard' : 'shadow-hard-sm opacity-70'}`}
                  style={{ border: 'var(--border-hard)' }}
                >
                  <ProductImage image={p.images?.[0]} alt="" priority className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <a href="#catalogo" className="mt-6 inline-flex min-h-[44px] items-center font-bold text-primary-dark underline underline-offset-4">
          Ver todo el catálogo
        </a>
      </div>

      {/* Consola */}
      <div
        className="order-1 mx-auto w-full max-w-[460px] rounded-[14px] rounded-br-[44px] bg-primary p-4 pb-5 lg:order-2"
        style={{ border: 'var(--border-hard)', boxShadow: '6px 6px 0 var(--color-navy)' }}
      >
        {/* Bisel de la pantalla */}
        <div className="rounded-[8px] rounded-br-[22px] bg-navy p-3 pb-2">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span aria-hidden="true" className="h-2 w-2 bg-accent" />
            <span className="font-display text-[10px] text-card" aria-hidden="true">{heading}</span>
            <span className="ml-auto font-mono text-xs text-card" aria-live="polite">
              {pad(index + 1)}/{pad(count)}
            </span>
          </div>
          <Link
            to={`/p/${current.code.toLowerCase()}`}
            className="relative block overflow-hidden rounded-[3px] bg-card"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label={`Ver ${current.title}`}
          >
            <ProductImage
              key={current.code}
              image={current.images?.[0]}
              alt={current.title}
              variant="full"
              priority
              className="aspect-[4/3] w-full object-contain"
            />
            {current.is_preorder && (
              <span className="vv-sticker vv-sticker-cyan absolute left-2 top-2" style={{ transform: 'rotate(-2deg)' }}>Preventa</span>
            )}
            {/* HUD inferior: nombre y precio */}
            <div className="absolute inset-x-0 bottom-0 bg-navy px-3 py-2 text-card">
              <p className="line-clamp-1 font-title text-[15px] font-semibold">{current.title}</p>
              <div className="flex items-baseline justify-between gap-2 [&_*]:!text-card">
                <Price product={current} size="sm" />
                {current.preorder_eta && <span className="hidden font-mono text-[11px] sm:inline">Llega: {current.preorder_eta}</span>}
              </div>
            </div>
          </Link>
        </div>

        {/* Controles */}
        <div className="mt-4 flex items-center gap-4">
          <DPad onPrev={() => go(-1)} onNext={() => go(1)} disabled={count < 2} />
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="vv-btn vv-btn-navy min-h-[56px] w-full text-base"
            >
              <IconWhatsApp /> {action.kind === 'reservar' ? 'Reservar' : action.kind === 'consultar' ? 'Consultar precio' : 'Pedir'}
            </a>
            <Link
              to={`/p/${current.code.toLowerCase()}`}
              className="vv-btn vv-btn-ghost w-full text-sm"
            >
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
