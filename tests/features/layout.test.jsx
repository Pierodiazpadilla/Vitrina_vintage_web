import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'
import { PRODUCTS } from '../fixtures/products.js'
import { visibleNavItems } from '../../src/shared/navigation.js'

beforeEach(() => localStorage.clear())

describe('Layout y navbar', () => {
  it('muestra el logo real con alt "Vitrina Vintage"', () => {
    renderApp('/')
    const logos = screen.getAllByAltText('Vitrina Vintage')
    expect(logos[0]).toHaveAttribute('src', '/images/logo_vitrina_vintage.jpeg')
    expect(within(screen.getByRole('banner')).getByAltText('Vitrina Vintage')).toBeInTheDocument()
  })

  it('el buscador navega a /?q=… al presionar Enter', async () => {
    renderApp('/politicas')
    const [box] = screen.getAllByRole('searchbox')
    await userEvent.type(box, 'db1082{Enter}')
    expect(screen.getByTestId('location').textContent).toMatch(/^\/\?q=db1082/)
  })

  it('el contador de la lista muestra la cantidad', async () => {
    renderApp('/')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    const card = screen.getByTestId('card-VR1111')
    await userEvent.click(within(card).getByRole('button', { name: '+ a mi lista' }))
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
  })

  it('el botón flotante abre WhatsApp de ventas', () => {
    renderApp('/')
    const link = screen.getByRole('link', { name: 'Escríbenos por WhatsApp' })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/51941392619\?text=/)
  })

  it('el botón flotante no aparece en el detalle (tiene su barra propia)', () => {
    renderApp('/p/db1082')
    expect(screen.queryByRole('link', { name: 'Escríbenos por WhatsApp' })).toBeNull()
  })

  it('los chips son los de visibleNavItems y llevan sus filtros a la URL', async () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Categorías' })
    const labels = within(nav).getAllByRole('link').map((a) => a.textContent)
    expect(labels).toEqual(visibleNavItems(PRODUCTS).map((i) => i.label))
    await userEvent.click(within(nav).getByRole('link', { name: 'Preventas' }))
    expect(screen.getByTestId('location').textContent).toMatch(/preorder=1/)
  })

  it('oculta chips de categorías sin productos', () => {
    renderApp('/', { products: PRODUCTS.filter((p) => p.category !== 'digimon') })
    const nav = screen.getByRole('navigation', { name: 'Categorías' })
    expect(within(nav).queryByRole('link', { name: 'Digimon' })).toBeNull()
  })

  it('el footer enlaza a la guía de políticas', () => {
    renderApp('/')
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Guía de compra y envíos' })).toHaveAttribute('href', '/politicas')
  })
})
