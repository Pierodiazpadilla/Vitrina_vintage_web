// Carga del catálogo público: una sola consulta, caché en localStorage (stale-while-revalidate).
import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { safeStorage } from './storage.js'

export const CACHE_KEY = 'vv:products:v1'

export const PUBLIC_COLUMNS = [
  'code', 'title', 'price', 'discount_percent', 'category', 'is_original', 'era', 'condition', 'tags',
  'editorial', 'year', 'extras', 'variants', 'stock', 'featured_rank', 'is_preorder', 'preorder_eta',
  'images', 'status', 'published_at',
].join(',')

export async function fetchPublicProducts(client = supabase) {
  if (!client) throw new Error('Supabase no está configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  const { data, error } = await client.from('products').select(PUBLIC_COLUMNS).in('status', ['published', 'sold'])
  if (error) throw new Error(error.message)
  return data ?? []
}

async function loadFixtures() {
  const mod = await import('../../tests/fixtures/products.js')
  return mod.PRODUCTS
}

const fixturesByEnv = import.meta.env.VITE_USE_FIXTURES === 'true'

/**
 * @param {{ client?: object, useFixtures?: boolean }} [options]  (inyectables para pruebas)
 * @returns {{ products: object[], loading: boolean, error: Error | null }}
 */
export function useProducts({ client = supabase, useFixtures = fixturesByEnv } = {}) {
  const [state, setState] = useState(() => ({
    products: useFixtures ? [] : safeStorage.get(CACHE_KEY, []),
    loading: true,
    error: null,
  }))

  useEffect(() => {
    let cancelled = false
    const load = useFixtures ? loadFixtures() : fetchPublicProducts(client)
    load.then(
      (products) => {
        if (cancelled) return
        if (!useFixtures) safeStorage.set(CACHE_KEY, products)
        setState({ products, loading: false, error: null })
      },
      (error) => {
        if (cancelled) return
        setState((s) => ({ ...s, loading: false, error }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [client, useFixtures])

  return state
}
