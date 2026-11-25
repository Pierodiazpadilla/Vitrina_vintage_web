import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'
import { PRODUCTS } from '../fixtures/products.js'
import { heroProducts } from '../../src/features/catalog/Hero.jsx'
import { layoutCards } from '../../src/features/catalog/ProductGrid.jsx'

const grid = () => screen.getByRole('region', { name: 'CATÁLOGO' })
const cardCodes = () => within(grid()).queryAllByTestId(/^card-/).map((el) => el.dataset.testid.slice(5))

beforeEach(() => localStorage.clear())

describe('Home', () => {
  it('con ?q=db1082 solo se ve DB1082', () => {
    renderApp('/?q=db1082')
    expect(cardCodes()).toEqual(['DB1082'])
  })

  it('"Mostrar vendidos" agrega los vendidos', async () => {
    renderApp('/')
    expect(cardCodes()).not.toContain('CZ0010')
    await userEvent.click(within(grid()).getByRole('checkbox', { name: 'Mostrar vendidos' }))
    expect(cardCodes()).toContain('CZ0010')
    expect(cardCodes().at(-1)).toBe('CZ0010')
    expect(screen.getByTestId('location').textContent).toMatch(/sold=1/)
  })

  it('cambiar un filtro actualiza la URL y la grilla', async () => {
    renderApp('/')
    const aside = screen.getByRole('complementary', { name: 'Filtros' })
    await userEvent.click(within(aside).getByRole('radio', { name: 'Réplicas' }))
    expect(screen.getByTestId('location').textContent).toMatch(/orig=replica/)
    for (const code of cardCodes()) expect(PRODUCTS.find((p) => p.code === code).is_original).toBe(false)
  })

  it('quitar un chip de filtro activo lo saca de la URL', async () => {
    renderApp('/?cat=pokemon')
    expect(cardCodes()).toEqual(['PK1511'])
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro Pokémon' }))
    expect(screen.getByTestId('location').textContent).not.toMatch(/cat=/)
  })

  it('estado vacío con la carita y "Limpiar filtros"', async () => {
    renderApp('/?q=zzzzzz')
    expect(screen.getByText('No hay productos con estos filtros')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(cardCodes().length).toBeGreaterThan(3)
  })

  it('el panel de filtros móvil muestra cuántos resultados hay', async () => {
    renderApp('/?cat=dragon-ball')
    await userEvent.click(screen.getByRole('button', { name: /^Filtros/ }))
    const dialog = screen.getByRole('dialog', { name: 'Filtros' })
    expect(within(dialog).getByRole('button', { name: /Ver 2 resultados/ })).toBeInTheDocument()
  })

  it('la sección de confianza menciona los 5 días de reclamo', () => {
    renderApp('/')
    const trust = screen.getByRole('region', { name: 'COMPRA SEGURA' })
    expect(within(trust).getAllByText(/5 días/).length).toBeGreaterThan(0)
  })
})

describe('Hero', () => {
  it('usa featured_rank ordenado', () => {
    expect(heroProducts(PRODUCTS).map((p) => p.code)).toEqual(['PV0001', 'PV0002', 'PV0003'])
  })

  it('sin destacados, muestra las preventas publicadas más recientes', () => {
    const noFeatured = PRODUCTS.map((p) => ({ ...p, featured_rank: null }))
    expect(heroProducts(noFeatured).map((p) => p.code)).toEqual(['PV0002', 'PV0003', 'PV0001'])
  })

  it('sin destacados ni preventas no se renderiza', () => {
    const plain = PRODUCTS.map((p) => ({ ...p, featured_rank: null, is_preorder: false }))
    renderApp('/', { products: plain })
    expect(screen.queryByTestId('hero')).toBeNull()
  })

  it('la cruceta cambia de producto', async () => {
    renderApp('/')
    const hero = screen.getByTestId('hero')
    expect(within(hero).getByText('01/03')).toBeInTheDocument()
    await userEvent.click(within(hero).getByRole('button', { name: 'Producto siguiente' }))
    expect(within(hero).getByText('02/03')).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: /Reservar/ })).toBeInTheDocument()
  })
})

describe('layoutCards', () => {
  it('doble ancho para destacados/descuento, como máximo una cada 6', () => {
    const items = Array.from({ length: 14 }, (_, i) => ({ code: `X${i}`, status: 'published', featured_rank: null, discount_percent: i < 3 || i === 9 ? 35 : 0 }))
    const wide = layoutCards(items).map((c, i) => (c.wide ? i : null)).filter((i) => i != null)
    expect(wide).toEqual([0, 9])
  })
})

describe('Explora la vitrina', () => {
  it('cada categoría tiene una foto distinta', async () => {
    const { categoryTiles } = await import('../../src/features/catalog/CategoryTiles.jsx')
    const tiles = categoryTiles(PRODUCTS)
    const keys = tiles.map((t) => t.cover?.full)
    expect(keys.every(Boolean)).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('reserva la única foto posible a quien no tiene otra', async () => {
    const { assignCovers } = await import('../../src/features/catalog/CategoryTiles.jsx')
    const a = { full: 'a' }
    const b = { full: 'b' }
    // la primera prefiere "a", pero la segunda solo tiene "a": la primera debe ceder y tomar "b"
    expect(assignCovers([[a, b], [a]]).map((x) => x.full)).toEqual(['b', 'a'])
    // sin fotos suficientes, la que sobra queda sin foto (nunca repetida)
    expect(assignCovers([[a], [a]]).map((x) => x?.full ?? null)).toEqual(['a', null])
  })

  it('las imágenes renderizadas no se repiten', () => {
    renderApp('/')
    const region = screen.getByRole('region', { name: 'EXPLORA LA VITRINA' })
    const srcs = [...region.querySelectorAll('img')].map((img) => img.getAttribute('src'))
    expect(new Set(srcs).size).toBe(srcs.length)
  })
})
