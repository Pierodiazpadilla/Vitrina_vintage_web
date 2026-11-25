// Entrada lazy del panel: el público nunca descarga este chunk (ni tesseract.js).
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminSessionProvider } from './auth.js'
import AdminGuard from './AdminGuard.jsx'
import AdminLayout from './AdminLayout.jsx'
import LoginPage from './LoginPage.jsx'
import LoadingFace from '../catalog/LoadingFace.jsx'

const ReviewQueue = lazy(() => import('./ReviewQueue.jsx'))
const NewProduct = lazy(() => import('./NewProduct.jsx'))
const ProductsAdmin = lazy(() => import('./ProductsAdmin.jsx'))

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const prev = document.title
    document.title = 'Panel — Vitrina Vintage'
    return () => {
      meta.remove()
      document.title = prev
    }
  }, [])
}

/** `session` permite inyectar el estado de sesión en pruebas. */
export default function AdminRoot({ session }) {
  useNoIndex()
  return (
    <AdminSessionProvider value={session}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<Navigate to="revision" replace />} />
          <Route path="revision" element={<Suspense fallback={<LoadingFace />}><ReviewQueue /></Suspense>} />
          <Route path="nuevo" element={<Suspense fallback={<LoadingFace />}><NewProduct /></Suspense>} />
          <Route path="productos" element={<Suspense fallback={<LoadingFace />}><ProductsAdmin /></Suspense>} />
          <Route path="*" element={<Navigate to="revision" replace />} />
        </Route>
      </Routes>
    </AdminSessionProvider>
  )
}
