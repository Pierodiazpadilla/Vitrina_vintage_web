import { useEffect, useId, useRef, useState } from 'react'
import { CATEGORIES } from '../../shared/catalogRules.js'
import { filterProducts } from '../../shared/search.js'
import { TAG_LABELS } from './Badges.jsx'
import { IconClose, IconFilter } from '../layout/icons.jsx'

const STATE_TAGS = ['sellado', 'completo', 'set-a-pegar', 'tapa-dura', 'tapa-blanda', 'combo', 'sobres']

export const SORT_OPTIONS = [
  { id: 'new', label: 'Novedades' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'discount', label: 'Mayor descuento' },
]

const toggle = (list = [], value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

/** Chips de filtros activos (cada uno se quita con un toque). */
export function activeChips(filters) {
  const chips = []
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, clear: (f) => ({ ...f, q: undefined }) })
  for (const c of filters.cat ?? []) {
    chips.push({ key: `cat-${c}`, label: CATEGORIES[c] ?? c, clear: (f) => ({ ...f, cat: toggle(f.cat, c) }) })
  }
  if (filters.orig) {
    chips.push({ key: 'orig', label: filters.orig === 'original' ? 'Originales' : 'Réplicas', clear: (f) => ({ ...f, orig: undefined }) })
  }
  if (filters.era) {
    chips.push({ key: 'era', label: filters.era === 'retro' ? 'Retro' : 'Modernos', clear: (f) => ({ ...f, era: undefined }) })
  }
  for (const t of filters.tags ?? []) {
    chips.push({ key: `tag-${t}`, label: TAG_LABELS[t] ?? t, clear: (f) => ({ ...f, tags: toggle(f.tags, t) }) })
  }
  if (filters.preorder) chips.push({ key: 'pre', label: 'Preventas', clear: (f) => ({ ...f, preorder: undefined }) })
  if (filters.discount) chips.push({ key: 'off', label: 'Con descuento', clear: (f) => ({ ...f, discount: undefined }) })
  if (filters.min != null) chips.push({ key: 'min', label: `Desde S/ ${filters.min}`, clear: (f) => ({ ...f, min: undefined }) })
  if (filters.max != null) chips.push({ key: 'max', label: `Hasta S/ ${filters.max}`, clear: (f) => ({ ...f, max: undefined }) })
  return chips
}

function Check({ checked, onChange, children, count }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-[var(--color-primary-dark)]" />
      <span className="flex-1">{children}</span>
      {count != null && <span className="font-mono text-xs text-muted">{count}</span>}
    </label>
  )
}

function Radio({ name, checked, onChange, children }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px]">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-5 w-5 accent-[var(--color-primary-dark)]" />
      {children}
    </label>
  )
}

function Group({ title, children }) {
  return (
    <fieldset className="py-3" style={{ borderTop: 'var(--border-hard)' }}>
      <legend className="float-left mb-1 w-full font-title text-base font-bold">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function PriceInput({ label, value, onCommit }) {
  const [draft, setDraft] = useState(value ?? '')
  useEffect(() => setDraft(value ?? ''), [value])
  const commit = () => {
    const n = draft === '' ? undefined : Number(draft)
    if (n === undefined || (Number.isFinite(n) && n >= 0)) onCommit(n)
  }
  return (
    <label className="flex-1 text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="vv-input font-mono"
      />
    </label>
  )
}

/** Campos de filtro (iguales en la columna de escritorio y en el panel móvil). */
export function FilterFields({ filters, onChange, products }) {
  const base = products.filter((p) => p.status !== 'sold')
  const count = (f) => filterProducts(base, f).length
  const cats = Object.keys(CATEGORIES).filter((c) => count({ cat: [c] }) > 0)
  const tags = STATE_TAGS.filter((t) => count({ tags: [t] }) > 0)
  const name = useId()
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div>
      {cats.length > 0 && (
        <Group title="Categoría">
          {cats.map((c) => (
            <Check key={c} checked={(filters.cat ?? []).includes(c)} onChange={() => set({ cat: toggle(filters.cat, c) })} count={count({ cat: [c] })}>
              {CATEGORIES[c]}
            </Check>
          ))}
        </Group>
      )}
      <Group title="Licencia">
        <Radio name={`${name}-orig`} checked={!filters.orig} onChange={() => set({ orig: undefined })}>Todos</Radio>
        <Radio name={`${name}-orig`} checked={filters.orig === 'original'} onChange={() => set({ orig: 'original' })}>Originales</Radio>
        <Radio name={`${name}-orig`} checked={filters.orig === 'replica'} onChange={() => set({ orig: 'replica' })}>Réplicas</Radio>
      </Group>
      <Group title="Época">
        <Radio name={`${name}-era`} checked={!filters.era} onChange={() => set({ era: undefined })}>Todas</Radio>
        <Radio name={`${name}-era`} checked={filters.era === 'retro'} onChange={() => set({ era: 'retro' })}>Retro</Radio>
        <Radio name={`${name}-era`} checked={filters.era === 'moderna'} onChange={() => set({ era: 'moderna' })}>Modernos</Radio>
      </Group>
      {tags.length > 0 && (
        <Group title="Estado">
          {tags.map((t) => (
            <Check key={t} checked={(filters.tags ?? []).includes(t)} onChange={() => set({ tags: toggle(filters.tags, t) })}>
              {TAG_LABELS[t]}
            </Check>
          ))}
        </Group>
      )}
      <Group title="Compra">
        <Check checked={!!filters.preorder} onChange={() => set({ preorder: filters.preorder ? undefined : true })}>Solo preventas</Check>
        <Check checked={!!filters.discount} onChange={() => set({ discount: filters.discount ? undefined : true })}>Con descuento</Check>
      </Group>
      <Group title="Precio (S/)">
        <div className="flex gap-3">
          <PriceInput label="Mínimo" value={filters.min} onCommit={(min) => set({ min })} />
          <PriceInput label="Máximo" value={filters.max} onCommit={(max) => set({ max })} />
        </div>
      </Group>
    </div>
  )
}

/** Panel inferior en móvil. */
export function FilterSheet({ open, onClose, resultCount, ...fieldProps }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
      <button type="button" className="absolute inset-0 h-full w-full bg-[var(--color-scrim)]" aria-label="Cerrar filtros" tabIndex={-1} onClick={onClose} />
      <div className="vv-sheet absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[10px] bg-surface" style={{ borderTop: 'var(--divider)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-lg">FILTROS</h2>
          <button ref={closeRef} type="button" onClick={onClose} className="vv-btn vv-btn-ghost h-11 w-11 p-0" aria-label="Cerrar filtros">
            <IconClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          <FilterFields {...fieldProps} />
        </div>
        <div className="p-4" style={{ borderTop: 'var(--border-hard)' }}>
          <button type="button" onClick={onClose} className="vv-btn vv-btn-primary w-full">
            Ver {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Barra superior del catálogo: contador, filtros (móvil), orden y vendidos. */
export function FilterToolbar({ filters, onChange, resultCount, onOpenSheet }) {
  const chips = activeChips(filters)
  const sortId = useId()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-mono text-sm text-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
        </p>
        <button type="button" onClick={onOpenSheet} className="vv-btn vv-btn-ghost lg:hidden">
          <IconFilter /> Filtros{chips.length > 0 && <span className="font-mono">({chips.length})</span>}
        </button>
        <label htmlFor={sortId} className="sr-only">Ordenar</label>
        <select
          id={sortId}
          value={filters.sort ?? 'new'}
          onChange={(e) => onChange({ ...filters, sort: e.target.value === 'new' ? undefined : e.target.value })}
          className="vv-input w-auto pr-8 text-sm"
        >
          {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="mr-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={!!filters.sold}
            onChange={() => onChange({ ...filters, sold: filters.sold ? undefined : true })}
            className="h-5 w-5 accent-[var(--color-primary-dark)]"
          />
          Mostrar vendidos
        </label>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.clear(filters))}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-brand bg-navy px-2 text-sm font-bold text-card"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            {chip.label} <IconClose width="14" height="14" />
          </button>
        ))}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ sort: filters.sort, sold: filters.sold })}
            className="min-h-[44px] px-2 text-sm font-bold text-primary-dark underline underline-offset-4"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
