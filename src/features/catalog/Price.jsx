import { displayPrice, money } from './productActions.js'

/** Precio en mono, grande, en azul marino: lo segundo que se ve tras la foto. */
export default function Price({ product, variant = null, size = 'md' }) {
  const p = displayPrice(product, variant)
  const big = { sm: 'text-lg', md: 'text-xl sm:text-2xl', lg: 'text-3xl sm:text-4xl' }[size]
  if (p.onRequest) {
    return <p className={`font-mono font-bold leading-tight text-navy ${size === 'lg' ? 'text-2xl' : 'text-base'}`}>Precio a consultar</p>
  }
  if (p.final == null) return null
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 font-mono leading-none text-navy">
      {p.from && <span className="text-xs font-medium text-muted">desde</span>}
      <span className={`${big} font-bold tracking-tight`}>{money(p.final)}</span>
      {p.list != null && (
        <s className="text-sm text-muted" aria-label={`Antes ${money(p.list)}`}>{money(p.list)}</s>
      )}
    </p>
  )
}
