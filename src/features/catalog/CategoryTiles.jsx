// Accesos por categoría como "cartuchos": foto real del primer producto + nombre + cantidad.
import { Link } from 'react-router-dom'
import { NAV_ITEMS } from '../../shared/navigation.js'
import { filterProducts, sortProducts } from '../../shared/search.js'
import ProductImage from './ProductImage.jsx'
import { navHref } from '../layout/Navbar.jsx'

export default function CategoryTiles({ products }) {
  const tiles = NAV_ITEMS.map((item) => {
    const matches = sortProducts(filterProducts(products, item.filters), 'new')
    const cover = matches.find((p) => p.images?.length)
    return { item, count: matches.length, cover }
  }).filter((t) => t.count > 0)

  if (!tiles.length) return null
  return (
    <section aria-labelledby="explora" className="mx-auto max-w-6xl px-4 py-8">
      <h2 id="explora" className="vv-section-title">EXPLORA LA VITRINA</h2>
      <hr className="vv-divider mb-5 mt-3" />
      <ul className="vv-scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {tiles.map(({ item, count, cover }) => (
          <li key={item.id} className="w-[136px] shrink-0 sm:w-auto">
            <Link to={navHref(item)} className="vv-box vv-press block overflow-hidden">
              {/* ranura del cartucho */}
              <div className="bg-navy px-2 pb-2 pt-1.5">
                <div aria-hidden="true" className="mb-1.5 flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-1 flex-1 bg-card opacity-30" />)}
                </div>
                <ProductImage image={cover?.images?.[0]} alt="" className="aspect-square w-full rounded-[3px] bg-card object-cover" />
              </div>
              <div className="px-2 py-2">
                <p className="font-title text-[15px] font-bold leading-tight">{item.label}</p>
                <p className="font-mono text-xs text-muted">{count} {count === 1 ? 'producto' : 'productos'}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
