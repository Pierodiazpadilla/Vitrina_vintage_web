import { Navigate, useLocation } from 'react-router-dom'
import { useAdminSession } from './auth.js'
import LoadingFace from '../catalog/LoadingFace.jsx'

export default function AdminGuard({ children }) {
  const { status, user, signOut } = useAdminSession()
  const location = useLocation()

  if (status === 'loading') return <LoadingFace label="Revisando tu sesión" />
  if (status === 'unconfigured') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-title text-2xl font-bold">Falta configurar Supabase</h1>
        <p className="mt-2 text-muted">Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para usar el panel.</p>
      </div>
    )
  }
  if (status === 'anon') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }
  if (status === 'not-admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
        <h1 className="mt-4 font-title text-2xl font-bold">Esta cuenta no tiene acceso</h1>
        <p className="mt-2 text-muted">{user?.email} no está registrada como administradora de la tienda.</p>
        <button type="button" onClick={signOut} className="vv-btn vv-btn-ghost mt-6">Entrar con otra cuenta</button>
      </div>
    )
  }
  return children
}
