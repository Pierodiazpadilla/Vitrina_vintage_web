import { renderHook, waitFor } from '@testing-library/react'
import { PUBLIC_COLUMNS, fetchPublicProducts, useProducts, CACHE_KEY } from '../../src/lib/products.js'
import { PRODUCTS } from '../fixtures/products.js'

function fakeClient(result) {
  const calls = []
  const client = {
    from(table) {
      calls.push(['from', table])
      return {
        select(cols) {
          calls.push(['select', cols])
          return {
            in(col, values) {
              calls.push(['in', col, values])
              return Promise.resolve(result)
            },
          }
        },
      }
    },
  }
  return { client, calls }
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('PUBLIC_COLUMNS', () => {
  it('lists exactly the public columns of spec §8', () => {
    expect(PUBLIC_COLUMNS.split(',').map((c) => c.trim())).toEqual([
      'code', 'title', 'price', 'discount_percent', 'category', 'is_original', 'era', 'condition', 'tags',
      'editorial', 'year', 'extras', 'variants', 'stock', 'featured_rank', 'is_preorder', 'preorder_eta',
      'images', 'status', 'published_at',
    ])
  })
  it('never exposes internal columns', () => {
    for (const c of ['raw_ocr_text', 'source_files', 'file_hashes', 'admin_edited', 'ocr_warnings']) {
      expect(PUBLIC_COLUMNS).not.toContain(c)
    }
  })
})

describe('fetchPublicProducts', () => {
  it('queries published and sold products with the public columns', async () => {
    const { client, calls } = fakeClient({ data: PRODUCTS, error: null })
    const rows = await fetchPublicProducts(client)
    expect(rows).toEqual(PRODUCTS)
    expect(calls).toEqual([
      ['from', 'products'],
      ['select', PUBLIC_COLUMNS],
      ['in', 'status', ['published', 'sold']],
    ])
  })
  it('throws the Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } })
    await expect(fetchPublicProducts(client)).rejects.toThrow('boom')
  })
  it('throws a clear error when Supabase is not configured', async () => {
    await expect(fetchPublicProducts(null)).rejects.toThrow(/Supabase/)
  })
})

describe('useProducts', () => {
  it('paints cached products first, then the fresh ones, and caches them', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify([PRODUCTS[0]]))
    const { client } = fakeClient({ data: PRODUCTS, error: null })
    const { result } = renderHook(() => useProducts({ client }))
    expect(result.current.products).toEqual([PRODUCTS[0]])
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.products).toEqual(PRODUCTS))
    expect(result.current.loading).toBe(false)
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual(PRODUCTS)
  })
  it('keeps cached products and exposes the error when the fetch fails', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify([PRODUCTS[0]]))
    const { client } = fakeClient({ data: null, error: { message: 'offline' } })
    const { result } = renderHook(() => useProducts({ client }))
    await waitFor(() => expect(result.current.error).not.toBe(null))
    expect(result.current.products).toEqual([PRODUCTS[0]])
    expect(result.current.loading).toBe(false)
  })
  it('works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const { client } = fakeClient({ data: PRODUCTS, error: null })
    const { result } = renderHook(() => useProducts({ client }))
    expect(result.current.products).toEqual([])
    await waitFor(() => expect(result.current.products).toEqual(PRODUCTS))
  })
  it('uses the fixtures when asked', async () => {
    const { result } = renderHook(() => useProducts({ useFixtures: true }))
    await waitFor(() => expect(result.current.products.length).toBe(PRODUCTS.length))
  })
})
