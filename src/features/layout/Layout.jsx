import { lazy, Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../cart/cartStore.js'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import FloatingWhatsApp from './FloatingWhatsApp.jsx'
import LoadingFace from '../catalog/LoadingFace.jsx'

const CartPanel = lazy(() => import('../cart/CartPanel.jsx'))

export default function Layout() {
  const { pathname, hash } = useLocation()
  const { panelOpen } = useCart()
  const onProduct = pathname.startsWith('/p/')

  // Con #ancla, a esa sección; al cambiar de página sin ancla, arriba.
  // Cambiar solo los filtros (?…) no mueve la página.
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        el.scrollIntoView?.({ block: 'start' })
        lastPath.current = pathname
        return
      }
    }
    if (lastPath.current !== pathname) window.scrollTo?.(0, 0)
    lastPath.current = pathname
  }, [pathname, hash])

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-2">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Suspense fallback={<LoadingFace />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      {!onProduct && !panelOpen && <FloatingWhatsApp />}
      {panelOpen && (
        <Suspense fallback={null}>
          <CartPanel />
        </Suspense>
      )}
    </>
  )
}
