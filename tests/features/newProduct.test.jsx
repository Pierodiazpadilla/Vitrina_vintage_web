import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeApi, renderAdmin } from './adminHelpers.jsx'

vi.mock('../../src/features/admin/browserOcr.js', () => ({
  read: vi.fn(async () => ({ text: '250 soles. Dragon Ball Z 3 álbum. Navarrete original, año 1999. (Cod. DB1082)', confidence: 88 })),
}))
vi.mock('../../src/features/admin/browserImages.js', () => ({
  md5OfFile: vi.fn(async (f) => (f.name === 'b.jpg' ? 'bbbbbbbbbbbbbbbb' : '3f9a1c2b00000000')),
}))

import * as browserOcr from '../../src/features/admin/browserOcr.js'

const photo = (name = 'a.jpg') => new File(['x'], name, { type: 'image/jpeg' })

async function pick(api, files = [photo()]) {
  renderAdmin('/admin/nuevo', { api })
  const input = await screen.findByTestId('file-input', {}, { timeout: 5000 })
  fireEvent.change(input, { target: { files } })
  return screen.findByRole('textbox', { name: 'Título' }, { timeout: 5000 })
}

beforeEach(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:x')
  globalThis.URL.revokeObjectURL = vi.fn()
})

describe('Nuevo producto', () => {
  it('lee la foto y prellena el formulario con parseBanner', async () => {
    const title = await pick(fakeApi())
    expect(browserOcr.read).toHaveBeenCalled()
    expect(title).toHaveValue('Dragon Ball Z 3 álbum')
    expect(screen.getByRole('textbox', { name: /Código/ })).toHaveValue('DB1082')
    expect(screen.getByRole('spinbutton', { name: /Precio/ })).toHaveValue(250)
    expect(screen.getByRole('textbox', { name: 'Editorial' })).toHaveValue('Navarrete')
  })

  it('si ya existe, ofrece agregar las fotos al producto existente', async () => {
    const existing = { id: 'e1', code: 'DB1082', title: 'Dragon Ball Z 3 álbum', status: 'published', images: [], file_hashes: [] }
    const api = fakeApi({ findDuplicates: vi.fn(async () => [existing]) })
    await pick(api)
    expect(api.findDuplicates).toHaveBeenCalledWith({ code: 'DB1082', md5s: ['3f9a1c2b00000000'] })
    await userEvent.click(screen.getByRole('button', { name: 'Agregar fotos al producto existente' }))
    await waitFor(() => expect(api.appendImages).toHaveBeenCalledWith(existing, expect.any(Array), ['3f9a1c2b00000000']))
    expect(await screen.findByText(/Fotos agregadas a DB1082/)).toBeInTheDocument()
  })

  it('"Guardar borrador" guarda como draft aunque falten datos', async () => {
    const api = fakeApi()
    await pick(api)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
    await waitFor(() => expect(api.createProduct).toHaveBeenCalledWith(expect.objectContaining({ code: 'DB1082', images: expect.any(Array) }), 'draft'))
  })

  it('"Publicar" respeta validateForPublish (falta categoría) y no sube nada', async () => {
    const api = fakeApi()
    await pick(api)
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(await screen.findByText('Falta la categoría')).toBeInTheDocument()
    expect(api.uploadImages).not.toHaveBeenCalled()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'dragon-ball')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    await waitFor(() => expect(api.createProduct).toHaveBeenCalledWith(expect.objectContaining({ category: 'dragon-ball' }), 'published'))
  })

  it('sin código en el banner propone TMP-<8 hex del md5>', async () => {
    browserOcr.read.mockResolvedValueOnce({ text: 'Album sin código ni precio', confidence: 90 })
    await pick(fakeApi())
    expect(screen.getByRole('textbox', { name: /Código/ })).toHaveValue('TMP-3f9a1c2b')
  })

  it('marcar "Preventa" permite publicar sin precio', async () => {
    browserOcr.read.mockResolvedValueOnce({ text: 'Álbum Dragon Ball Z portada metálica (Cod. PV0001) original', confidence: 90 })
    const api = fakeApi()
    await pick(api)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'dragon-ball')
    await userEvent.click(screen.getByRole('radio', { name: 'Original' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Preventa' }))
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    await waitFor(() => expect(api.createProduct).toHaveBeenCalledWith(expect.objectContaining({ is_preorder: true, price: '' }), 'published'))
  })
})
