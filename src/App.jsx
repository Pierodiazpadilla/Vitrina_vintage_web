import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CatalogProvider, useCatalog } from './lib/catalogContext.jsx'
import { CartProvider } from './features/cart/cartStore.js'
import Layout from './features/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import ProductPage from './pages/ProductPage.jsx'
import LoadingFace from './features/catalog/LoadingFace.jsx'

const PoliciesPage = lazy(() => import('./features/policies/PoliciesPage.jsx'))
const AdminRoot = lazy(() => import('./features/admin/AdminRoot.jsx'))

function WithCart({ children }) {
  const { products } = useCatalog()
  return <CartProvider products={products}>{children}</CartProvider>
}

/** `catalog` inyecta productos en pruebas; en la app se cargan de Supabase o de los fixtures. */
export default function App({ catalog }) {
  return (
    <CatalogProvider value={catalog}>
      <WithCart>
        <Routes>
            <Route path="/admin/*" element={<Suspense fallback={<LoadingFace />}><AdminRoot /></Suspense>} />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="p/:code" element={<ProductPage />} />
              <Route path="politicas" element={<PoliciesPage />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
      </WithCart>
    </CatalogProvider>
  )
}
