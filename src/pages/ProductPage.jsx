import { Link, useParams } from 'react-router-dom'
import { useCatalog } from '../lib/catalogContext.jsx'
import ProductDetail from '../features/product/ProductDetail.jsx'
import LoadingFace from '../features/catalog/LoadingFace.jsx'

export default function ProductPage() {
  const { code = '' } = useParams()
  const { products, loading } = useCatalog()
  const wanted = code.toUpperCase()
  const product = products.find((p) => p.code.toUpperCase() === wanted)

  if (product) return <ProductDetail key={product.code} product={product} />
  if (loading) return <LoadingFace label="Buscando el producto" />
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
      <h1 className="mt-4 font-title text-2xl font-bold">No encontramos este producto</h1>
      <p className="mt-2 text-muted">
        El código <span className="font-mono">{wanted}</span> no está en la vitrina. Puede que ya no esté publicado.
      </p>
      <Link to="/#catalogo" className="vv-btn vv-btn-primary mt-6">Ver el catálogo</Link>
    </div>
  )
}
