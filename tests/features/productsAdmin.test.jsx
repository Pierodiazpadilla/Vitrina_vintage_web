import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { draftRow, fakeApi, renderAdmin } from './adminHelpers.jsx'

const list = () => [
  draftRow({ code: 'DB1082', status: 'published', stock: 1 }),
  draftRow({ code: 'VR1111', title: 'Album STRANGER THINGS', status: 'published', stock: 5, category: 'variado' }),
  draftRow({ code: 'TMP-ABCDEF12', title: 'Borrador sin revisar', status: 'draft' }),
  draftRow({ code: 'HID001', title: 'Oculto viejo', status: 'hidden' }),
  draftRow({ code: 'SOLD01', title: 'Vendido ya', status: 'sold', stock: 0 }),
]

async function setup(overrides = {}) {
  const api = fakeApi({ listAll: vi.fn(async () => list()), ...overrides })
  renderAdmin('/admin/productos', { api })
  await screen.findByTestId('row-DB1082', {}, { timeout: 5000 })
  return api
}

afterEach(() => vi.restoreAllMocks())

describe('Productos (admin)', () => {
  it('la búsqueda incluye borradores y ocultos', async () => {
    await setup()
    await userEvent.type(screen.getByRole('searchbox'), 'borrador')
    expect(screen.getByTestId('row-TMP-ABCDEF12')).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'oculto')
    expect(screen.getByTestId('row-HID001')).toBeInTheDocument()
    expect(screen.queryByTestId('row-DB1082')).toBeNull()
  })

  it('stock 1 → "Marcar como vendido" y no "−1 vendido"', async () => {
    const api = await setup()
    const row = screen.getByTestId('row-DB1082')
    expect(within(row).queryByRole('button', { name: '−1 vendido' })).toBeNull()
    await userEvent.click(within(row).getByRole('button', { name: 'Marcar como vendido' }))
    expect(api.markSold).toHaveBeenCalledWith('id-DB1082')
  })

  it('stock 5 → "−1 vendido" y campo para reponer', async () => {
    const api = await setup()
    const row = screen.getByTestId('row-VR1111')
    await userEvent.click(within(row).getByRole('button', { name: '−1 vendido' }))
    expect(api.decrementStock).toHaveBeenCalledWith('id-VR1111', 5)
    await userEvent.type(within(row).getByRole('spinbutton', { name: 'Reponer stock de VR1111' }), '8')
    await userEvent.click(within(row).getByRole('button', { name: 'Reponer' }))
    expect(api.restock).toHaveBeenCalledWith(expect.objectContaining({ id: 'id-VR1111' }), '8')
  })

  it('vendido → solo "Reponer" habilitado, sin campo vacío ni "Marcar vendido", y vuelve a publicado', async () => {
    const restock = vi.fn(async (row) => ({ ...row, status: 'published', stock: 1 }))
    await setup({ restock })
    const row = screen.getByTestId('row-SOLD01')
    expect(within(row).queryByRole('button', { name: 'Marcar como vendido' })).toBeNull()
    expect(within(row).queryByRole('spinbutton')).toBeNull()
    const btn = within(row).getByRole('button', { name: 'Reponer' })
    expect(btn).toBeEnabled()
    await userEvent.click(btn)
    expect(restock).toHaveBeenCalledWith(expect.objectContaining({ code: 'SOLD01', status: 'sold' }))
    await waitFor(() => expect(within(screen.getByTestId('row-SOLD01')).getByText(/Publicado/)).toBeInTheDocument())
    expect(within(screen.getByTestId('row-SOLD01')).getByRole('button', { name: 'Marcar como vendido' })).toBeInTheDocument()
  })

  it('"Editar" permite cambiar el Estado y lo envía al guardar', async () => {
    const api = await setup()
    const row = screen.getByTestId('row-SOLD01')
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }))
    await userEvent.selectOptions(within(row).getByRole('combobox', { name: 'Estado de SOLD01' }), 'published')
    await userEvent.click(within(row).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(api.saveProduct).toHaveBeenCalled())
    const [, patch, current] = api.saveProduct.mock.calls[0]
    expect(patch.status).toBe('published')
    expect(current.status).toBe('sold')
  })

  it('"Destacar" pide la posición y llama setFeatured', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('2')
    const api = await setup()
    await userEvent.click(within(screen.getByTestId('row-DB1082')).getByRole('button', { name: 'Destacar' }))
    expect(window.prompt).toHaveBeenCalled()
    expect(api.setFeatured).toHaveBeenCalledWith('id-DB1082', 2)
  })

  it('"Eliminar" pide confirmación antes de borrar', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const api = await setup()
    const del = () => within(screen.getByTestId('row-DB1082')).getByRole('button', { name: 'Eliminar' })
    await userEvent.click(del())
    expect(api.deleteProduct).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(del())
    await waitFor(() => expect(api.deleteProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'id-DB1082' })))
    await waitFor(() => expect(screen.queryByTestId('row-DB1082')).toBeNull())
  })

  it('reordenar fotos guarda images con la nueva portada', async () => {
    const api = await setup()
    const row = screen.getByTestId('row-DB1082')
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Mover foto 2 antes' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(api.saveProduct).toHaveBeenCalled())
    const [, patch] = api.saveProduct.mock.calls[0]
    expect(patch.images.map((i) => i.path)).toEqual(['products/DB1082/b', 'products/DB1082/a'])
    // image_url = images[0].full lo calcula toPatch dentro de saveProduct
    const { toPatch } = await import('../../src/features/admin/adminApi.js')
    expect(toPatch(patch).image_url).toBe('/b-full.webp')
  })
})
