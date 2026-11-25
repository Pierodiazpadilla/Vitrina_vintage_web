import { NavLink, Outlet } from 'react-router-dom'
import { useAdminSession } from './auth.js'
import { BRAND } from '../../shared/brand.js'

const LINKS = [
  { to: '/admin/revision', label: 'Revisión rápida' },
  { to: '/admin/nuevo', label: 'Nuevo producto' },
  { to: '/admin/productos', label: 'Productos' },
]

export default function AdminLayout() {
  const { user, signOut } = useAdminSession()
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 bg-surface" style={{ borderBottom: 'var(--divider)' }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <img src={BRAND.logo} alt="Vitrina Vintage" width="460" height="182" className="h-9 w-auto" />
          <nav aria-label="Panel" className="vv-scroll-x flex gap-2 overflow-x-auto">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `inline-flex min-h-[44px] shrink-0 items-center rounded-brand px-3 text-sm font-bold ${isActive ? 'bg-navy text-card' : 'bg-card'}`}
                style={{ border: 'var(--border-hard)' }}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <a href="/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary-dark underline">Ver tienda</a>
            <span className="hidden text-muted md:inline">{user?.email}</span>
            <button type="button" onClick={signOut} className="vv-btn vv-btn-ghost min-h-[40px] px-3 text-sm">Salir</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
