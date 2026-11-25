import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './helpers.jsx'
import { CART_KEY } from '../../src/features/cart/cartStore.js'
import { splitExtras } from '../../src/features/product/ProductDetail.jsx'

beforeEach(() => localStorage.clear())

describe('Detalle de producto', () => {
  it('/p/db1082 muestra DB1082 (código sin distinguir mayúsculas)', () => {
    renderApp('/p/db1082')
    expect(screen.getByRole('heading', { level: 1, name: 'Dragon Ball Z 3 álbum' })).toBeInTheDocument()
    expect(screen.getByText('Código DB1082')).toBeInTheDocument()
    expect(document.title).toMatch(/DB1082/)
  })

  it('código inexistente → mensaje y enlace al catálogo', () => {
    renderApp('/p/nope123')
    expect(screen.getByText('No encontramos este producto')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/#catalogo')
  })

  it('con versiones obliga a elegir una y el precio cambia', async () => {
    renderApp('/p/tmp-3f9a1c2b')
    const bar = screen.getByTestId('buy-bar')
    const add = within(bar).getByRole('button', { name: 'Elige una versión' })
    expect(add).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: /Tapa dura/ }))
    expect(screen.getByText('S/ 90.00', { selector: 'span.font-bold' })).toBeInTheDocument()
    await userEvent.click(within(bar).getByRole('button', { name: '+ a mi lista' }))
    expect(JSON.parse(localStorage.getItem(CART_KEY))).toEqual([{ code: 'TMP-3f9a1c2b', variant: 'Tapa dura', qty: 1 }])
    expect(within(bar).getByRole('link', { name: /Pedir por WhatsApp/ }).getAttribute('href')).toContain(encodeURIComponent('(Tapa dura)'))
  })

  it('"+ a mi lista" agrega {code, variant: null}', async () => {
    renderApp('/p/vr1111')
    await userEvent.click(within(screen.getByTestId('buy-bar')).getByRole('button', { name: '+ a mi lista' }))
    expect(JSON.parse(localStorage.getItem(CART_KEY))).toEqual([{ code: 'VR1111', variant: null, qty: 1 }])
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
  })

  it('la galería navega con botones accesibles', async () => {
    renderApp('/p/vr1149')
    expect(screen.getByAltText(/foto 1 de 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }))
    expect(screen.getByAltText(/foto 2 de 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))
    expect(screen.getByAltText(/foto 1 de 2/)).toBeInTheDocument()
  })

  it('extras aparecen en "Incluye"', () => {
    renderApp('/p/pv0001')
    const section = screen.getByRole('region', { name: 'INCLUYE' })
    expect(within(section).getByText('305 stickers (36 especiales)')).toBeInTheDocument()
    expect(within(section).getByText('Caja para figuritas')).toBeInTheDocument()
  })

  it('barra inferior con el CTA; la preventa sin precio solo consulta', () => {
    renderApp('/p/pv0001')
    const bar = screen.getByTestId('buy-bar')
    expect(within(bar).getByRole('link', { name: /Consultar por WhatsApp/ })).toBeInTheDocument()
    expect(within(bar).queryByRole('button')).toBeNull()
  })

  it('splitExtras separa por · + y comas fuera de paréntesis', () => {
    expect(splitExtras('álbum sellado + caja (dorada, grande), póster')).toEqual(['Álbum sellado', 'Caja (dorada, grande)', 'Póster'])
  })
})
