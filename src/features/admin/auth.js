// Sesión del admin con Supabase Auth. "admin" = existe su fila en `admins` (la RLS es la protección real).
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

const ERRORS = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'Confirma tu correo antes de entrar.',
}

export function useAdminSessionState(client = supabase) {
  const [state, setState] = useState({ status: client ? 'loading' : 'unconfigured', user: null })

  const check = useCallback(async (session) => {
    if (!session?.user) {
      setState({ status: 'anon', user: null })
      return
    }
    const { data, error } = await client.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
    setState({ status: !error && data ? 'admin' : 'not-admin', user: session.user })
  }, [client])

  useEffect(() => {
    if (!client) return undefined
    let alive = true
    client.auth.getSession().then(({ data }) => alive && check(data.session))
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) check(session)
    })
    return () => {
      alive = false
      sub?.subscription?.unsubscribe()
    }
  }, [client, check])

  const signIn = useCallback(async (email, password) => {
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return ERRORS[error.message] ?? error.message
    return null
  }, [client])

  const signOut = useCallback(() => client.auth.signOut(), [client])

  return useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut])
}

const SessionContext = createContext(null)

function LiveSession({ client, children }) {
  const live = useAdminSessionState(client)
  return createElement(SessionContext.Provider, { value: live }, children)
}

/** `value` inyecta una sesión fija (pruebas) sin tocar Supabase. */
export function AdminSessionProvider({ client = supabase, value, children }) {
  if (value) return createElement(SessionContext.Provider, { value }, children)
  return createElement(LiveSession, { client }, children)
}

/** { status: 'loading'|'anon'|'not-admin'|'admin'|'unconfigured', user, signIn, signOut } */
export function useAdminSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useAdminSession debe usarse dentro de <AdminSessionProvider>')
  return ctx
}
