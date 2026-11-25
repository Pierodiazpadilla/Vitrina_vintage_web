import ProductCard from './ProductCard.jsx'

const MIN_GAP = 6

/** Destacado o con descuento → doble ancho, como máximo una cada 6 tarjetas (spec §8). */
export function layoutCards(products) {
  let lastWide = -Infinity
  return products.map((product, i) => {
    const candidate = product.status !== 'sold' && (product.featured_rank != null || Number(product.discount_percent) > 0)
    const wide = candidate && i - lastWide >= MIN_GAP
    if (wide) lastWide = i
    return { product, wide }
  })
}

export default function ProductGrid({ products }) {
  return (
    <ul className="grid grid-flow-row-dense grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {layoutCards(products).map(({ product, wide }, i) => (
        <li key={product.code} className={wide ? 'col-span-2' : ''}>
          <ProductCard product={product} featured={wide} priority={i < 2} />
        </li>
      ))}
    </ul>
  )
}
