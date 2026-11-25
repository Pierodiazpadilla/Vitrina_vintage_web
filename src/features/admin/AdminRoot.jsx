// Punto de entrada lazy del panel (Fase C, tareas 14–17). Este chunk nunca lo descarga el público.
import { Link } from 'react-router-dom'

export default function AdminRoot() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-2xl">^ ^</p>
      <h1 className="mt-4 font-title text-2xl font-bold">Panel en construcción</h1>
      <p className="mt-2 text-muted">El panel de administración llega en la siguiente fase.</p>
      <Link to="/" className="vv-btn vv-btn-ghost mt-6">Volver a la tienda</Link>
    </main>
  )
}
