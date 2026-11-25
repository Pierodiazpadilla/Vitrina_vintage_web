import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAdminSession } from './auth.js'
import { BRAND } from '../../shared/brand.js'

const safeNext = (next) => (next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin/revision')

export default function LoginPage() {
  const { status, signIn } = useAdminSession()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (status === 'admin') return <Navigate to={safeNext(params.get('next'))} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(await signIn(email, password))
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <img src={BRAND.logo} alt="Vitrina Vintage" width="460" height="182" className="mx-auto h-16 w-auto" />
      <form onSubmit={onSubmit} className="vv-box mt-8 space-y-4 p-6">
        <h1 className="font-display text-xl">PANEL</h1>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Correo</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="vv-input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Contraseña</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="vv-input" />
        </label>
        {error && <p role="alert" className="text-sm font-bold">{error}</p>}
        {status === 'not-admin' && <p role="alert" className="text-sm font-bold">Esta cuenta no tiene acceso.</p>}
        <button type="submit" disabled={busy} className="vv-btn vv-btn-primary w-full">{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}
