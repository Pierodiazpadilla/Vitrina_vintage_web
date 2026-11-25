import { Link } from 'react-router-dom'
import { stockBadge } from '../../shared/pricing.js'
import { useCart } from '../cart/cartStore.js'
import Badges, { OverlayBadges, Sticker } from './Badges.jsx'
import Price from './Price.jsx'
import ProductImage from './ProductImage.jsx'
import { canAddToList, hasVariants, primaryAction } from './productActions.js'
import { IconWhatsApp } from '../layout/icons.jsx'

function ListButton({ product }) {
  const { add, lines, openPanel } = useCart()
  if (!canAddToList(product)) return null
  if (hasVariants(product)) {
    return (
      <Link to={`/p/${product.code.toLowerCase()}`} className="vv-btn vv-btn-ghost w-full text-sm">
        Elegir versión
      </Link>
    )
  }
  const inList = lines.some((l) => l.code === product.code)
  if (inList) {
    return (
      <button type="button" onClick={openPanel} className="vv-btn vv-btn-ghost w-full text-sm">
        ✓ En mi lista
      </button>
    )
  }
  return (
    <button type="button" onClick={() => add(product)} className="vv-btn vv-btn-ghost w-full text-sm">
      + a mi lista
    </button>
  )
}

export default function ProductCard({ product, featured = false, priority = false }) {
  const href = `/p/${product.code.toLowerCase()}`
  const action = primaryAction(product)
  const stock = stockBadge(product)
  const sold = product.status === 'sold'
  const image = product.images?.[0]

  return (
    <article
      className={`vv-box vv-press relative flex h-full flex-col overflow-hidden ${
        featured ? 'sm:grid sm:grid-cols-2' : ''
      } ${sold ? 'opacity-75' : ''}`}
      data-testid={`card-${product.code}`}
    >
      <Link
        to={href}
        className={`relative block bg-card ${featured ? 'sm:h-full sm:border-r-2 sm:border-navy' : ''}`}
        style={{ borderBottom: 'var(--border-hard)' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          image={image}
          alt=""
          sizes={featured ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
          priority={priority}
          className={`aspect-square w-full object-contain ${sold ? 'grayscale' : ''} ${featured ? 'sm:h-full sm:aspect-auto' : ''}`}
        />
        <OverlayBadges product={product} />
        {featured && (
          <span className="absolute right-0 top-2 bg-navy px-2 py-1 font-display text-[11px] text-card">
            {Number(product.discount_percent) > 0 ? 'OFERTA' : 'DESTACADO'}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className={`font-title font-semibold leading-snug text-navy ${featured ? 'text-lg sm:text-xl' : 'line-clamp-2 text-[15px]'}`}>
          <Link to={href} className="after:absolute after:inset-0 after:content-['']">
            {product.title}
          </Link>
        </h3>
        <Badges product={product} limit={featured ? 4 : 2} />
        {featured && product.extras && <p className="text-sm text-muted">Incluye {product.extras}.</p>}

        <div className="mt-auto space-y-1 pt-1">
          <Price product={product} />
          {product.is_preorder && product.preorder_eta && (
            <p className="font-mono text-xs text-muted">Llega: {product.preorder_eta}</p>
          )}
          {stock && !sold && (
            <Sticker tone={stock.tone === 'warm' ? 'warm' : 'plain'} mono>{stock.label}</Sticker>
          )}
        </div>

        {/* Los botones quedan por encima del enlace que cubre la tarjeta */}
        <div className="relative z-10 flex flex-col gap-2 pt-1">
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={action.label}
            className={`vv-btn w-full text-sm ${sold ? 'vv-btn-ghost' : 'vv-btn-primary'}`}
          >
            <IconWhatsApp width="18" height="18" /> {featured ? action.label : action.short}
          </a>
          {!sold && <ListButton product={product} />}
        </div>
      </div>
    </article>
  )
}
