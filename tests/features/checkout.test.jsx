import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'
import { PRODUCTS, byCode } from '../fixtures/products.js'
import { CART_KEY } from '../../src/features/cart/cartStore.js'
import { NAME_MAX } from '../../src/features/cart/CheckoutForm.jsx'

function seed(lines) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines))
}

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: /Mi lista de pedido/ }))
  return screen.findByRole('dialog', { name: /MI LISTA/ }, { timeout: 5000 })
}

const deliveryNames = (dialog) =>
  within(within(dialog).getByRole('group', { name: 'Entrega' })).getAllByRole('radio').map((r) => r.closest('label').querySelector('.font-bold').textContent)
const paymentNames = (dialog) =>
  within(within(dialog).getByRole('group', { name: 'Pago' })).getAllByRole('radio').map((r) => r.closest('label').querySelector('.font-bold').textContent)

beforeEach(() => localStorage.clear())

describe('Lista de pedido y checkout', () => {
  it('al abrir revalida y muestra los avisos', async () => {
    seed([{ code: 'DB1082', variant: null, qty: 1 }, { code: 'VR1111', variant: null, qty: 4 }])
    const products = PRODUCTS.map((p) =>
      p.code === 'DB1082' ? { ...p, status: 'sold' } : p.code === 'VR1111' ? { ...p, stock: 2 } : p)
    renderApp('/', { products })
    const dialog = await openPanel()
    const status = within(dialog).getByRole('status')
    expect(status).toHaveTextContent('DB1082 ya fue vendido')
    expect(status).toHaveTextContent(/VR1111: solo quedan 2/)
    expect(within(dialog).queryByTestId('line-DB1082')).toBeNull()
    expect(within(within(dialog).getByTestId('line-VR1111')).getByText('2')).toBeInTheDocument()
  })

  it('lista vacía invita a ver el catálogo', async () => {
    renderApp('/')
    const dialog = await openPanel()
    expect(within(dialog).getByText('Tu lista está vacía')).toBeInTheDocument()
  })

  it('las cantidades se topan al stock', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 5 }])
    renderApp('/')
    const dialog = await openPanel()
    expect(within(dialog).getByRole('button', { name: 'Agregar uno' })).toBeDisabled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Quitar uno' }))
    expect(within(dialog).getByRole('button', { name: 'Agregar uno' })).toBeEnabled()
  })

  it('Provincias deja solo Olva y Shalom', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Provincias (Perú)' }))
    expect(deliveryNames(dialog)).toEqual(['Olva Courier', 'Shalom'])
  })

  it('Efectivo contraentrega solo con la entrega gratuita en punto de encuentro', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    expect(paymentNames(dialog)).toContain('Efectivo contraentrega')
    await userEvent.click(within(dialog).getByRole('radio', { name: /Olva Courier/ }))
    expect(paymentNames(dialog)).not.toContain('Efectivo contraentrega')
    await userEvent.click(within(dialog).getByRole('radio', { name: /Entrega gratuita en punto de encuentro/ }))
    expect(paymentNames(dialog)).toContain('Efectivo contraentrega')
  })

  it('Mercado Pago muestra el recargo de 7 % y el total', async () => {
    seed([{ code: 'DB1082', variant: null, qty: 1 }, { code: 'VR1149', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    await userEvent.click(within(dialog).getByRole('radio', { name: /Mercado Pago/ }))
    const summary = within(dialog).getByTestId('order-summary')
    expect(summary).toHaveTextContent('S/ 412.50')
    expect(summary).toHaveTextContent('(+7%)')
    expect(summary).toHaveTextContent('S/ 28.88')
    expect(within(dialog).getByTestId('order-total')).toHaveTextContent('S/ 441.38')
  })

  it('Extranjero pide país; PayPal con España muestra "podría aplicar" y los $10 USD aparte', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Extranjero' }))
    expect(deliveryNames(dialog)).toEqual(['DHL internacional'])
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'País' }), 'ES')
    await userEvent.click(within(dialog).getByRole('radio', { name: /PayPal/ }))
    const summary = within(dialog).getByTestId('order-summary')
    expect(summary).toHaveTextContent(/podría aplicar/)
    expect(summary).toHaveTextContent('+ $10 USD')
    expect(within(dialog).getByTestId('order-total')).toHaveTextContent('S/ 50.00')
  })

  it('PayPal en México suma 8 %', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 2 }])
    renderApp('/')
    const dialog = await openPanel()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Extranjero' }))
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'País' }), 'MX')
    await userEvent.click(within(dialog).getByRole('radio', { name: /PayPal/ }))
    expect(within(dialog).getByTestId('order-total')).toHaveTextContent('S/ 108.00')
  })

  it('enviar está deshabilitado hasta completar datos y aceptar las políticas; luego abre wa.me con el pedido', async () => {
    seed([{ code: 'DB1082', variant: null, qty: 1 }, { code: 'VR1149', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    const send = () =>
      within(dialog).queryByRole('link', { name: /Enviar pedido por WhatsApp/ }) ??
      within(dialog).getByRole('button', { name: /Enviar pedido por WhatsApp/ })
    expect(send()).toBeDisabled()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Provincias (Perú)' }))
    await userEvent.click(within(dialog).getByRole('radio', { name: /Olva Courier/ }))
    await userEvent.click(within(dialog).getByRole('radio', { name: /Mercado Pago/ }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'Juan Pérez')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Ciudad' }), 'Arequipa')
    expect(send()).toBeDisabled()
    expect(within(dialog).getByText(/Falta: aceptar las políticas/)).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('checkbox', { name: /acepto las Políticas/ }))
    const link = send()
    expect(link.tagName).toBe('A')
    const href = link.getAttribute('href')
    expect(href.startsWith('https://wa.me/51941392619?text=')).toBe(true)
    const text = decodeURIComponent(href.split('text=')[1])
    expect(text).toContain('- [DB1082] ')
    expect(text).toContain('*Total:* S/ 441.38')
    expect(text).toContain('*Entrega:* Olva Courier — Arequipa (envío a cotizar)')
    expect(text).toContain('*Cliente:* Juan Pérez')
    expect(text).toContain('plazo de reclamos: 5 días')
    expect(text).not.toMatch(/https?:/)
  })

  it('limita el largo del nombre y lo deja en una línea', async () => {
    seed([{ code: 'VR1111', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    const name = within(dialog).getByRole('textbox', { name: 'Nombre' })
    expect(name).toHaveAttribute('maxLength', String(NAME_MAX))
    await userEvent.type(name, 'A'.repeat(NAME_MAX + 20))
    expect(name.value.length).toBe(NAME_MAX)
  })

  it('con preventa en la lista muestra el resumen de la política de preventa', async () => {
    seed([{ code: 'PV0002', variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    expect(within(dialog).getByTestId('preorder-policy')).toHaveTextContent(/pago total/)
  })

  it('el punto de encuentro es obligatorio en la entrega gratuita', async () => {
    seed([{ code: byCode('VR1111').code, variant: null, qty: 1 }])
    renderApp('/')
    const dialog = await openPanel()
    await userEvent.click(within(dialog).getByRole('radio', { name: /Yape/ }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'Ana')
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /acepto las Políticas/ }))
    expect(within(dialog).getByText(/Falta: punto de encuentro/)).toBeInTheDocument()
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Punto de encuentro' }), 'Real Plaza Centro Cívico')
    const text = decodeURIComponent(within(dialog).getByRole('link', { name: /Enviar pedido/ }).getAttribute('href').split('text=')[1])
    expect(text).toContain('Entrega gratuita — Real Plaza Centro Cívico (gratis)')
  })
})
