import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCatalog } from '../lib/catalogContext.jsx'
import { filterProducts, filtersFromParams, filtersToParams, sortProducts } from '../shared/search.js'
import { waLink } from '../shared/whatsapp.js'
import { GENERAL_WA_MESSAGE } from '../shared/brand.js'
import Hero from '../features/catalog/Hero.jsx'
import CategoryTiles from '../features/catalog/CategoryTiles.jsx'
import ProductGrid from '../features/catalog/ProductGrid.jsx'
import TrustSection from '../features/catalog/TrustSection.jsx'
import LoadingFace from '../features/catalog/LoadingFace.jsx'
import { FilterFields, FilterSheet, FilterToolbar } from '../features/catalog/Filters.jsx'

/** Con búsqueda y sin orden elegido se respeta la relevancia (código exacto primero). */
export function visibleProducts(products, filters) {
  const filtered = filterProducts(products, filters)
  if (filters.q && !filters.sort) {
    return [...filtered].sort((a, b) => (a.status === 'sold') - (b.status === 'sold'))
  }
  return sortProducts(filtered, filters.sort ?? 'new')
}

function EmptyState({ onClear }) {
  return (
    <div className="vv-box mx-auto max-w-md p-8 text-center">
      <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
      <h3 className="mt-3 font-title text-xl font-bold">No hay productos con estos filtros</h3>
      <p className="mt-1 text-muted">Quita algún filtro o pregúntanos por WhatsApp: a veces lo tenemos y aún no está publicado.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button type="button" onClick={onClear} className="vv-btn vv-btn-ghost">Limpiar filtros</button>
        <a href={waLink(GENERAL_WA_MESSAGE)} target="_blank" rel="noopener noreferrer" className="vv-btn vv-btn-primary">
          Preguntar por WhatsApp
        </a>
      </div>
    </div>
  )
}

export default function Home() {
  const { products, loading, error } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const filters = useMemo(() => filtersFromParams(params), [params])
  const results = useMemo(() => visibleProducts(products, filters), [products, filters])

  const onChange = useCallback(
    (next) => setParams(filtersToParams(next), { replace: true, preventScrollReset: true }),
    [setParams],
  )
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  return (
    <>
      <Hero products={products} />
      <CategoryTiles products={products} />

      <section id="catalogo" aria-labelledby="catalogo-title" className="mx-auto max-w-6xl scroll-mt-36 px-4 py-8">
        <h2 id="catalogo-title" className="vv-section-title">CATÁLOGO</h2>
        <hr className="vv-divider mb-5 mt-3" />

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="sticky top-40">
              <FilterFields filters={filters} onChange={onChange} products={products} />
            </div>
          </aside>

          <div className="space-y-5">
            <FilterToolbar
              filters={filters}
              onChange={onChange}
              resultCount={results.length}
              onOpenSheet={() => setSheetOpen(true)}
            />
            {loading && !products.length ? (
              <LoadingFace label="Cargando el catálogo" />
            ) : error && !products.length ? (
              <div className="vv-box p-6 text-center" role="alert">
                <h3 className="font-title text-xl font-bold">No pudimos cargar el catálogo</h3>
                <p className="mt-1 text-muted">Revisa tu conexión y vuelve a intentar.</p>
                <button type="button" onClick={() => window.location.reload()} className="vv-btn vv-btn-primary mt-4">
                  Volver a intentar
                </button>
              </div>
            ) : results.length ? (
              <ProductGrid products={results} />
            ) : (
              <EmptyState onClear={() => onChange({})} />
            )}
          </div>
        </div>
      </section>

      <TrustSection />

      <FilterSheet
        open={sheetOpen}
        onClose={closeSheet}
        resultCount={results.length}
        filters={filters}
        onChange={onChange}
        products={products}
      />
    </>
  )
}
