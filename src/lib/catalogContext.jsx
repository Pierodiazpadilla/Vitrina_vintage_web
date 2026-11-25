// Una sola carga del catálogo para toda la app; las páginas lo leen con useCatalog().
import { createContext, useContext } from 'react'
import { useProducts } from './products.js'

const CatalogContext = createContext({ products: [], loading: false, error: null })

export function CatalogProvider({ children, value }) {
  // `value` permite inyectar productos en pruebas sin tocar la red.
  if (value) return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  return <LiveCatalog>{children}</LiveCatalog>
}

function LiveCatalog({ children }) {
  const state = useProducts()
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => useContext(CatalogContext)
