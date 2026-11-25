import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminRoot from '../../src/features/admin/AdminRoot.jsx'
import { AdminApiContext } from '../../src/features/admin/adminApi.js'
import { LocationProbe } from './helpers.jsx'

export const adminSession = (status = 'admin') => ({
  status,
  user: status === 'anon' ? null : { id: 'u1', email: 'dueno@example.com' },
  signIn: vi.fn(async () => null),
  signOut: vi.fn(),
})

export function draftRow(overrides = {}) {
  return {
    id: overrides.code ?? 'id',
    code: 'DB1082',
    code_is_temp: false,
    title: 'Dragon Ball Z 3 álbum',
    price: 250,
    discount_percent: 0,
    category: 'dragon-ball',
    is_original: true,
    era: null,
    condition: 'Sellado',
    tags: ['sellado'],
    variants: [],
    editorial: 'Navarrete',
    year: 1999,
    extras: null,
    stock: 1,
    is_preorder: false,
    preorder_eta: null,
    featured_rank: null,
    images: [
      { path: 'products/DB1082/a', full: '/a-full.webp', thumb: '/a-thumb.webp', w: 1, h: 1 },
      { path: 'products/DB1082/b', full: '/b-full.webp', thumb: '/b-thumb.webp', w: 1, h: 1 },
    ],
    status: 'draft',
    raw_ocr_text: '250 soles. Dragon Ball Z 3 álbum (Cod. DB1082)',
    ocr_warnings: [],
    source_files: ['_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg'],
    file_hashes: ['m1'],
    ...overrides,
    id: overrides.id ?? `id-${overrides.code ?? 'DB1082'}`,
  }
}

export function fakeApi(overrides = {}) {
  return {
    listDrafts: vi.fn(async () => []),
    listAll: vi.fn(async () => []),
    saveProduct: vi.fn(async (id, patch) => ({ id, ...patch })),
    createProduct: vi.fn(async (form, status) => ({ id: 'new', ...form, status })),
    publish: vi.fn(async (id, p) => ({ ...p, id, status: 'published' })),
    hide: vi.fn(async (id) => ({ id, status: 'hidden' })),
    markSold: vi.fn(),
    decrementStock: vi.fn(),
    restock: vi.fn(),
    setFeatured: vi.fn(),
    deleteProduct: vi.fn(async () => undefined),
    uploadImages: vi.fn(async () => [{ path: 'p', full: '/f.webp', thumb: '/t.webp', w: 1, h: 1 }]),
    findDuplicates: vi.fn(async () => []),
    appendImages: vi.fn(async (row) => row),
    ...overrides,
  }
}

export function renderAdmin(path, { session = adminSession(), api = fakeApi() } = {}) {
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AdminApiContext.Provider value={api}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoot session={session} />} />
        </Routes>
      </AdminApiContext.Provider>
      <LocationProbe />
    </MemoryRouter>,
  )
  return { ...utils, api, session }
}
