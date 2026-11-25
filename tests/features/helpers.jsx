import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../../src/App.jsx'
import { PRODUCTS } from '../fixtures/products.js'

export function LocationProbe() {
  const loc = useLocation()
  return <output data-testid="location">{`${loc.pathname}${loc.search}${loc.hash}`}</output>
}

export function renderApp(path = '/', { products = PRODUCTS, loading = false, error = null } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App catalog={{ products, loading, error }} />
      <LocationProbe />
    </MemoryRouter>,
  )
}
