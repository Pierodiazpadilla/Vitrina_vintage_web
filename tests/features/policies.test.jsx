import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'

describe('Guía de compra y envíos', () => {
  it('tiene las cinco pestañas', async () => {
    renderApp('/politicas')
    const tabs = await screen.findAllByRole('tab', {}, { timeout: 5000 })
    expect(tabs.map((t) => t.textContent)).toEqual(['Lima gratis', 'Envíos Perú', 'Internacional DHL', 'Preventas', 'Garantía y reclamos'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('garantía y reclamos dice 5 días (y nunca 7)', async () => {
    renderApp('/politicas#garantia')
    const panel = await screen.findByRole('tabpanel')
    expect(panel).toHaveTextContent('5 días')
    expect(panel).not.toHaveTextContent(/0?7 días/)
  })

  it('/politicas#preventas abre esa pestaña', async () => {
    renderApp('/politicas#preventas')
    expect(await screen.findByRole('tab', { name: 'Preventas' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('pago total')
  })

  it('las pestañas se recorren con el teclado', async () => {
    renderApp('/politicas')
    const first = await screen.findByRole('tab', { name: 'Lima gratis' })
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    const second = screen.getByRole('tab', { name: 'Envíos Perú' })
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(second).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Garantía y reclamos' })).toHaveFocus()
    expect(screen.getByTestId('location').textContent).toBe('/politicas#garantia')
  })
})
