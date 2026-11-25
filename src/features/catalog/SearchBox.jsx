import { useEffect, useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { filtersToParams } from '../../shared/search.js'
import { IconSearch } from '../layout/icons.jsx'

/** Busca en todo el catálogo: envía a /?q=… (una búsqueda nueva limpia los filtros). */
export default function SearchBox({ className = '' }) {
  const id = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const urlQuery = location.pathname === '/' ? new URLSearchParams(location.search).get('q') ?? '' : ''
  const [value, setValue] = useState(urlQuery)

  useEffect(() => setValue(urlQuery), [urlQuery])

  function onSubmit(e) {
    e.preventDefault()
    const q = value.trim()
    const params = filtersToParams(q ? { q } : {}).toString()
    navigate(params ? `/?${params}#catalogo` : '/#catalogo')
  }

  return (
    <form role="search" onSubmit={onSubmit} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">Buscar en el catálogo</label>
      <input
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca un álbum, serie o código"
        className="vv-input pr-12"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-navy"
      >
        <IconSearch />
      </button>
    </form>
  )
}
