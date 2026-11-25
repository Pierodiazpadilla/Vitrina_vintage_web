import { screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { draftRow, fakeApi, renderAdmin } from './adminHelpers.jsx'

const rows = () => [
  draftRow({ code: 'DB1082' }),
  draftRow({ code: 'TMP-3F9A1C2B', code_is_temp: true, title: 'Album WALT DISNEY', price: 60, ocr_warnings: ['code_missing'], source_files: ['_6 VARIADO/SIN LICENCIA/RETRO/VITRINAvarr (62).jpg'], category: 'variado', is_original: false }),
  draftRow({ code: 'PK1511', title: 'POKEMON binder', category: 'pokemon', source_files: ['_2 POKÉMON/LICENCIADOS/VITRINApokemonlic (1).jpg'] }),
]

async function setup(list = rows(), apiOverrides = {}) {
  const api = fakeApi({ listDrafts: vi.fn(async () => list), ...apiOverrides })
  renderAdmin('/admin/revision', { api })
  await screen.findByRole('textbox', { name: 'Título' }, { timeout: 5000 })
  return api
}

const title = () => screen.getByRole('textbox', { name: 'Título' })
const counter = () => screen.getByTestId('counter').textContent

describe('Revisión rápida', () => {
  it('muestra el primer borrador prellenado, el OCR plegable y el contador', async () => {
    await setup()
    expect(title()).toHaveValue('Dragon Ball Z 3 álbum')
    expect(screen.getByRole('textbox', { name: /Código/ })).toHaveValue('DB1082')
    expect(screen.getByTestId('raw-ocr').closest('details')).not.toHaveAttribute('open')
    expect(counter()).toBe('1 / 3')
  })

  it('Ctrl+Enter aprueba (publish) y pasa al siguiente', async () => {
    const api = await setup()
    title().focus()
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    await waitFor(() => expect(api.publish).toHaveBeenCalledWith('id-DB1082', expect.objectContaining({ code: 'DB1082' })))
    await waitFor(() => expect(title()).toHaveValue('Album WALT DISNEY'))
    expect(counter()).toBe('1 / 2')
  })

  it('Enter en un campo de una línea aprueba', async () => {
    const api = await setup()
    await userEvent.type(title(), ' original{Enter}')
    await waitFor(() => expect(api.publish).toHaveBeenCalledWith('id-DB1082', expect.objectContaining({ title: 'Dragon Ball Z 3 álbum original' })))
  })

  it('en un textarea, S y H escriben y no disparan atajos', async () => {
    const api = await setup()
    const extras = screen.getByRole('textbox', { name: 'Incluye (extras)' })
    await userEvent.type(extras, 'sobres H')
    expect(extras).toHaveValue('sobres H')
    expect(api.hide).not.toHaveBeenCalled()
    expect(counter()).toBe('1 / 3')
  })

  it('fuera de campos: S y → saltan, ← vuelve, H oculta, 2 muestra la segunda foto', async () => {
    const api = await setup()
    document.body.focus()
    await userEvent.keyboard('s')
    expect(counter()).toBe('2 / 3')
    await userEvent.keyboard('{ArrowRight}')
    expect(counter()).toBe('3 / 3')
    await userEvent.keyboard('{ArrowLeft}')
    expect(counter()).toBe('2 / 3')
    await userEvent.keyboard('2')
    expect(screen.getByAltText('Foto 2 de 2')).toBeInTheDocument()
    await userEvent.keyboard('h')
    await waitFor(() => expect(api.hide).toHaveBeenCalledWith('id-TMP-3F9A1C2B'))
    await waitFor(() => expect(counter()).toBe('2 / 2'))
  })

  it('muestra avisos del OCR y resalta el código temporal', async () => {
    await setup()
    await userEvent.keyboard('s')
    expect(within(screen.getByTestId('warnings')).getByText('No se leyó el código')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Código/ })).toHaveAttribute('data-temp')
  })

  it('un producto inválido muestra lo que falta y no avanza', async () => {
    const api = await setup([draftRow({ code: 'X1', price: null, is_original: null })])
    const btn = screen.getByRole('button', { name: /^Falta:/ })
    expect(btn).toHaveTextContent('el precio')
    expect(btn).toHaveTextContent('original o réplica')
    fireEvent.click(btn)
    expect(api.publish).not.toHaveBeenCalled()
    expect(await screen.findByText('Para publicar falta:')).toBeInTheDocument()
    expect(counter()).toBe('1 / 1')
  })

  it('el filtro por carpeta reduce la cola', async () => {
    await setup()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Carpeta' }), '_2 POKÉMON/LICENCIADOS')
    expect(counter()).toBe('1 / 1')
    expect(title()).toHaveValue('POKEMON binder')
  })

  it('sin borradores invita a subir uno nuevo', async () => {
    renderAdmin('/admin/revision', { api: fakeApi() })
    expect(await screen.findByText('No hay borradores por revisar', {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
