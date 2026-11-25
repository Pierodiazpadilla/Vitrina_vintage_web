import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { visibleNavItems } from '../../shared/navigation.js'
import { filtersToParams } from '../../shared/search.js'
import { waLink } from '../../shared/whatsapp.js'
import { BRAND, GENERAL_WA_MESSAGE } from '../../shared/brand.js'
import { useCatalog } from '../../lib/catalogContext.jsx'
import { useCart } from '../cart/cartStore.js'
import SearchBox from '../catalog/SearchBox.jsx'
import { IconBag, IconWhatsApp } from './icons.jsx'

export const navHref = (item) => `/?${filtersToParams(item.filters).toString()}#catalogo`

function isActive(item, location) {
  if (location.pathname !== '/') return false
  const current = new URLSearchParams(location.search)
  const wanted = filtersToParams(item.filters)
  const keys = [...current.keys()].filter((k) => k !== 'sort' && k !== 'sold')
  return keys.length === [...wanted.keys()].length && [...wanted].every(([k, v]) => current.get(k) === v)
}

export default function Navbar() {
  const { products } = useCatalog()
  const { count, openPanel } = useCart()
  const location = useLocation()
  const items = visibleNavItems(products)
  const [compact, setCompact] = useState(false)

  // En móvil, al bajar se esconde la fila de chips y queda logo + buscador.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      setCompact(y > 160 && y > last)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-surface" style={{ borderBottom: 'var(--divider)' }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-2 pt-2 lg:gap-6 lg:pb-3 lg:pt-3">
        <Link to="/" className="shrink-0" aria-label="Vitrina Vintage, ir al inicio">
          <img
            src={BRAND.logo}
            alt="Vitrina Vintage"
            width="460"
            height="182"
            className="h-11 w-auto lg:h-14"
            fetchpriority="high"
          />
        </Link>

        <SearchBox className="hidden flex-1 lg:block lg:max-w-md" />

        <div className="ml-auto flex items-center gap-2">
          <a
            href={waLink(GENERAL_WA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="vv-btn vv-btn-ghost hidden lg:inline-flex"
          >
            <IconWhatsApp /> WhatsApp
          </a>
          <button
            type="button"
            onClick={openPanel}
            className="vv-btn vv-btn-navy relative px-3"
            aria-label={`Mi lista de pedido, ${count} ${count === 1 ? 'producto' : 'productos'}`}
          >
            <IconBag />
            <span className="hidden sm:inline">Mi lista</span>
            <span
              data-testid="cart-count"
              className="min-w-[1.5rem] rounded-[3px] bg-card px-1 font-mono text-sm font-bold text-navy"
            >
              {count}
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-2 lg:hidden">
        <SearchBox />
      </div>

      {items.length > 0 && (
        <nav
          aria-label="Categorías"
          className={`overflow-hidden transition-[max-height] duration-150 lg:max-h-none ${compact ? 'max-h-0' : 'max-h-16'}`}
        >
          <ul className="vv-scroll-x mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
            {items.map((item) => {
              const active = isActive(item, location)
              return (
                <li key={item.id} className="shrink-0">
                  <Link
                    to={navHref(item)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-brand px-3 text-sm font-bold lg:px-2.5 ${
                      active ? 'bg-navy text-card' : 'bg-card text-navy hover:bg-[var(--color-primary-tint)]'
                    }`}
                    style={{ border: 'var(--border-hard)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </header>
  )
}
