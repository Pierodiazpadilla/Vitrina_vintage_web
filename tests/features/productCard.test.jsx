import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../../src/features/cart/cartStore.js'
import ProductCard from '../../src/features/catalog/ProductCard.jsx'
import { byCode } from '../fixtures/products.js'

function renderCard(product) {
  render(
    <MemoryRouter>
      <CartProvider products={[product]}>
        <ProductCard product={product} />
      </CartProvider>
    </MemoryRouter>,
  )
  return screen.getByTestId(`card-${product.code}`)
}

beforeEach(() => localStorage.clear())

describe('ProductCard', () => {
  it('Original / Réplica', () => {
    expect(within(renderCard(byCode('DB1082'))).getByText('Original')).toBeInTheDocument()
  })
  it('Réplica', () => {
    expect(within(renderCard(byCode('VR1111'))).getByText('Réplica')).toBeInTheDocument()
  })

  it('descuento: precio final, precio original tachado y -35%', () => {
    const card = renderCard(byCode('VR1149'))
    expect(within(card).getByText('S/ 162.50')).toBeInTheDocument()
    const old = within(card).getByText('S/ 250.00')
    expect(old.tagName).toBe('S')
    expect(within(card).getByText('-35%')).toBeInTheDocument()
  })

  it('stock 5 → "Quedan 5"', () => {
    expect(within(renderCard(byCode('VR1111'))).getByText('Quedan 5')).toBeInTheDocument()
  })
  it('stock 3 → "Últimas unidades"', () => {
    const card = renderCard({ ...byCode('VR1111'), stock: 3 })
    expect(within(card).getByText('Últimas unidades')).toBeInTheDocument()
  })
  it('stock 1 → sin aviso de stock', () => {
    const card = renderCard(byCode('DB1082'))
    expect(within(card).queryByText(/Quedan|Últimas unidades/)).toBeNull()
  })

  it('preventa sin precio → "Precio a consultar", consultar por WhatsApp y sin "+ a mi lista"', () => {
    const card = renderCard(byCode('PV0001'))
    expect(within(card).getByText('Precio a consultar')).toBeInTheDocument()
    const cta = within(card).getByRole('link', { name: /Consultar por WhatsApp/ })
    expect(cta.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//)
    expect(within(card).queryByRole('button', { name: /a mi lista/ })).toBeNull()
  })

  it('preventa con precio → badge "Preventa" y CTA "Reservar"', () => {
    const card = renderCard(byCode('PV0002'))
    expect(within(card).getByText('Preventa')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /Reservar/ })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: '+ a mi lista' })).toBeInTheDocument()
  })

  it('vendido → "Vendido" y "Avísame si llega otro"', () => {
    const card = renderCard(byCode('CZ0010'))
    expect(within(card).getByText('Vendido')).toBeInTheDocument()
    const cta = within(card).getByRole('link', { name: /Avísame si llega otro/ })
    expect(decodeURIComponent(cta.getAttribute('href'))).toMatch(/CZ0010/)
    expect(within(card).queryByRole('button', { name: /a mi lista/ })).toBeNull()
  })

  it('con versiones manda a elegir versión en el detalle', () => {
    const card = renderCard(byCode('TMP-3f9a1c2b'))
    expect(within(card).getByRole('link', { name: 'Elegir versión' })).toHaveAttribute('href', '/p/tmp-3f9a1c2b')
    expect(within(card).getByText('desde')).toBeInTheDocument()
  })

  it('imagen: thumb, lazy y con width/height', () => {
    const p = byCode('DB1082')
    const img = renderCard(p).querySelector('img')
    expect(img).toHaveAttribute('src', p.images[0].thumb)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('width')
    expect(img).toHaveAttribute('height')
  })

  it('muestra editorial y año como stickers', () => {
    const card = renderCard(byCode('DB1082'))
    expect(within(card).getByText('Navarrete')).toBeInTheDocument()
    expect(within(card).getByText('1999')).toBeInTheDocument()
  })
})
