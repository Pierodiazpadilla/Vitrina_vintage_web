// Listado del panel: búsqueda (incluye borradores y ocultos), vendido, stock, destacar, editar y fotos (spec §10.3).
import { useEffect, useMemo, useState } from 'react'
import { searchProducts } from '../../shared/search.js'
import { STATUSES, useAdminApi } from './adminApi.js'
import ProductForm from './ProductForm.jsx'
import LoadingFace from '../catalog/LoadingFace.jsx'
import { money } from '../catalog/productActions.js'

const STATUS = { draft: 'Borrador', published: 'Publicado', sold: 'Vendido', hidden: 'Oculto' }

function PhotoEditor({ images, onChange }) {
  const move = (i, d) => {
    const next = [...images]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    onChange(next)
  }
  if (!images.length) return <p className="text-sm text-muted">Sin fotos.</p>
  return (
    <ol className="flex flex-wrap gap-3" aria-label="Fotos (la primera es la portada)">
      {images.map((img, i) => (
        <li key={img.path ?? i} className="w-24 space-y-1 text-center">
          <img src={img.thumb} alt={`Foto ${i + 1}`} className="h-24 w-24 rounded-brand bg-card object-cover" style={{ border: 'var(--border-hard)' }} />
          <div className="flex justify-center gap-1">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Mover foto ${i + 1} antes`} className="h-9 w-9 rounded-brand bg-card font-bold disabled:opacity-30" style={{ border: 'var(--border-hard)' }}>←</button>
            <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Mover foto ${i + 1} después`} className="h-9 w-9 rounded-brand bg-card font-bold disabled:opacity-30" style={{ border: 'var(--border-hard)' }}>→</button>
            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`Quitar foto ${i + 1}`} className="h-9 w-9 rounded-brand bg-card font-bold" style={{ border: 'var(--border-hard)' }}>×</button>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Row({ row, api, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(null)
  const [restock, setRestock] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await fn()
      if (updated) onUpdated(updated)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const stock = Number(row.stock ?? 1)
  const sold = row.status === 'sold'
  // Vendido o sin stock: solo "Reponer" (sin campo vacío ni "Marcar vendido").
  const outOfStock = sold || stock <= 0

  return (
    <li className="vv-box p-3" data-testid={`row-${row.code}`}>
      <div className="flex flex-wrap items-start gap-3">
        {row.images?.[0] ? (
          <img src={row.images[0].thumb} alt="" className="h-16 w-16 shrink-0 rounded-[3px] bg-card object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-[var(--color-navy-tint)] font-display text-sm">^ ^</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted">
            {row.code} · {STATUS[row.status] ?? row.status}
            {row.featured_rank != null && ` · destacado #${row.featured_rank}`}
          </p>
          <p className="font-title font-semibold leading-snug">{row.title}</p>
          <p className="font-mono text-sm">
            {row.price != null ? money(row.price) : 'Sin precio'}
            {Number(row.discount_percent) > 0 && ` (-${row.discount_percent}%)`} · stock {stock}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {!outOfStock && stock === 1 && (
          <button type="button" disabled={busy} onClick={() => run(() => api.markSold(row.id))} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">Marcar como vendido</button>
        )}
        {!outOfStock && stock > 1 && (
          <button type="button" disabled={busy} onClick={() => run(() => api.decrementStock(row.id, stock))} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">−1 vendido</button>
        )}
        {outOfStock && (
          <button type="button" disabled={busy} onClick={() => run(() => api.restock(row))} className="vv-btn vv-btn-primary min-h-[44px] text-sm">Reponer</button>
        )}
        {!outOfStock && stock > 1 && (
          <span className="flex items-center gap-1">
            <input aria-label={`Reponer stock de ${row.code}`} type="number" min="1" value={restock} onChange={(e) => setRestock(e.target.value)} className="vv-input min-h-[40px] w-20 font-mono text-sm" />
            <button type="button" disabled={busy || !restock} onClick={async () => { if (await run(() => api.restock(row, restock))) setRestock('') }} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">Reponer</button>
          </span>
        )}
        {row.featured_rank == null ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const pos = window.prompt('¿En qué posición del inicio? (1 = primero)', '1')
              if (pos != null && pos !== '') run(() => api.setFeatured(row.id, Number(pos)))
            }}
            className="vv-btn vv-btn-ghost min-h-[40px] text-sm"
          >
            Destacar
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => run(() => api.setFeatured(row.id, null))} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">Quitar destacado</button>
        )}
        {row.status === 'published' || sold ? (
          <button type="button" disabled={busy} onClick={() => run(() => api.hide(row.id))} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">Ocultar</button>
        ) : (
          <button type="button" disabled={busy} onClick={() => run(() => api.publish(row.id, row))} className="vv-btn vv-btn-ghost min-h-[40px] text-sm">Publicar</button>
        )}
        <button type="button" onClick={() => setEditing(editing ? null : { ...row, price: row.price ?? '', year: row.year ?? '' })} className="vv-btn vv-btn-ghost min-h-[40px] text-sm" aria-expanded={!!editing}>
          {editing ? 'Cerrar' : 'Editar'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(`¿Eliminar ${row.code} y sus fotos? No se puede deshacer.`)) return
            if (await run(() => api.deleteProduct(row))) onDeleted(row.id)
          }}
          className="ml-auto min-h-[40px] px-2 text-sm font-bold underline"
        >
          Eliminar
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-bold">{error}</p>}

      {editing && (
        <div className="mt-4 space-y-4 pt-4" style={{ borderTop: 'var(--border-hard)' }}>
          <PhotoEditor images={editing.images ?? []} onChange={(images) => setEditing({ ...editing, images })} />
          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-bold">Estado</span>
            <select
              aria-label={`Estado de ${row.code}`}
              value={editing.status ?? row.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              className="vv-input min-h-[44px]"
            >
              {STATUSES.map((k) => <option key={k} value={k}>{STATUS[k]}</option>)}
            </select>
          </label>
          <ProductForm value={editing} onChange={setEditing} />
          <button
            type="button"
            disabled={busy}
            onClick={async () => { if (await run(() => api.saveProduct(row.id, editing, row))) setEditing(null) }}
            className="vv-btn vv-btn-primary"
          >
            Guardar cambios
          </button>
        </div>
      )}
    </li>
  )
}

export default function ProductsAdmin() {
  const api = useAdminApi()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.listAll().then(setRows, (e) => setError(e.message))
  }, [api])

  const shown = useMemo(() => {
    const base = searchProducts(rows ?? [], q)
    return status ? base.filter((r) => r.status === status) : base
  }, [rows, q, status])

  if (error) return <p role="alert" className="p-6 font-bold">No se pudieron cargar los productos: {error}</p>
  if (!rows) return <LoadingFace label="Cargando productos" />

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1 block text-sm font-bold">Buscar</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código, título, editorial…" className="vv-input" />
        </label>
        <label>
          <span className="mb-1 block text-sm font-bold">Estado</span>
          <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} className="vv-input w-auto">
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <p className="font-mono text-sm text-muted">{shown.length} de {rows.length}</p>
      </div>
      <ul className="space-y-3">
        {shown.map((row) => (
          <Row
            key={row.id}
            row={row}
            api={api}
            onUpdated={(u) => setRows((list) => list.map((r) => (r.id === u.id ? u : r)))}
            onDeleted={(id) => setRows((list) => list.filter((r) => r.id !== id))}
          />
        ))}
      </ul>
    </main>
  )
}
