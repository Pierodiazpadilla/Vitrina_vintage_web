// Revisión rápida de borradores: foto + formulario prellenado, "Aprobar y siguiente" y atajos (spec §10.1).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../shared/catalogRules.js'
import { validateForPublish } from '../../shared/validation.js'
import { folderOf, useAdminApi } from './adminApi.js'
import ProductForm from './ProductForm.jsx'
import { useReviewShortcuts } from './useReviewShortcuts.js'
import LoadingFace from '../catalog/LoadingFace.jsx'
import { IconArrow } from '../layout/icons.jsx'

const toForm = (row) => ({ ...row, price: row.price ?? '', year: row.year ?? '', variants: row.variants ?? [], tags: row.tags ?? [] })

/** "Falta el precio", "Falta la categoría" → "el precio, la categoría" */
const shortMissing = (errors) => errors.map((e) => e.replace(/^Falta /, '').replace(/^Indica si es /, 'si es ')).join(', ')

export default function ReviewQueue() {
  const api = useAdminApi()
  const [drafts, setDrafts] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [filters, setFilters] = useState({ category: '', folder: '', warn: 'all' })
  const [index, setIndex] = useState(0)
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api.listDrafts().then(setDrafts, (e) => setLoadError(e.message))
  }, [api])

  const folders = useMemo(() => [...new Set((drafts ?? []).map(folderOf))].sort(), [drafts])
  const queue = useMemo(() => (drafts ?? []).filter((r) => {
    if (filters.category && r.category !== filters.category) return false
    if (filters.folder && folderOf(r) !== filters.folder) return false
    const warned = (r.ocr_warnings ?? []).length > 0
    if (filters.warn === 'with' && !warned) return false
    if (filters.warn === 'without' && warned) return false
    return true
  }), [drafts, filters])

  const safeIndex = Math.min(index, Math.max(0, queue.length - 1))
  const current = queue[safeIndex]
  const next = queue[safeIndex + 1]

  useEffect(() => {
    setForm(current ? toForm(current) : null)
    setPhoto(0)
    setMessage(null)
  }, [current])

  // Precarga la foto del siguiente para que el cambio sea instantáneo.
  useEffect(() => {
    const src = next?.images?.[0]?.full
    if (src && typeof Image !== 'undefined') new Image().src = src
  }, [next])

  const errors = form ? validateForPublish(form) : []
  const images = form?.images ?? []

  const removeCurrent = useCallback((id) => setDrafts((list) => list.filter((r) => r.id !== id)), [])

  const approve = useCallback(async () => {
    if (!form || busy) return
    if (validateForPublish(form).length) {
      setMessage('Completa lo que falta para publicar.')
      return
    }
    setBusy(true)
    try {
      await api.publish(form.id, form)
      removeCurrent(form.id)
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }, [api, form, busy, removeCurrent])

  const hide = useCallback(async () => {
    if (!form || busy) return
    setBusy(true)
    try {
      await api.hide(form.id)
      removeCurrent(form.id)
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }, [api, form, busy, removeCurrent])

  const skip = useCallback(() => setIndex((i) => Math.min(i + 1, Math.max(0, queue.length - 1))), [queue.length])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useReviewShortcuts({
    onApprove: approve,
    onSkip: skip,
    onPrev: prev,
    onHide: hide,
    onPhoto: (n) => n < images.length && setPhoto(n),
  }, { enabled: !!form })

  if (loadError) return <p role="alert" className="p-6 font-bold">No se pudieron cargar los borradores: {loadError}</p>
  if (!drafts) return <LoadingFace label="Cargando borradores" />

  const filterBar = (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block font-bold">Carpeta</span>
        <select aria-label="Carpeta" value={filters.folder} onChange={(e) => { setFilters({ ...filters, folder: e.target.value }); setIndex(0) }} className="vv-input w-auto text-sm">
          <option value="">Todas</option>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Categoría</span>
        <select aria-label="Categoría" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setIndex(0) }} className="vv-input w-auto text-sm">
          <option value="">Todas</option>
          {Object.entries(CATEGORIES).map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Avisos</span>
        <select aria-label="Avisos" value={filters.warn} onChange={(e) => { setFilters({ ...filters, warn: e.target.value }); setIndex(0) }} className="vv-input w-auto text-sm">
          <option value="all">Todos</option>
          <option value="with">Solo con avisos</option>
          <option value="without">Solo sin avisos</option>
        </select>
      </label>
      <p className="ml-auto font-mono text-sm" data-testid="counter">{queue.length ? `${safeIndex + 1} / ${queue.length}` : '0 / 0'}</p>
    </div>
  )

  if (!current || !form) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {filterBar}
        <div className="vv-box mx-auto max-w-md p-8 text-center">
          <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
          <h1 className="mt-3 font-title text-xl font-bold">No hay borradores por revisar</h1>
          <p className="mt-1 text-muted">Importa más fotos o sube un producto nuevo.</p>
          <Link to="/admin/nuevo" className="vv-btn vv-btn-primary mt-4">Nuevo producto</Link>
        </div>
      </main>
    )
  }

  const img = images[Math.min(photo, Math.max(0, images.length - 1))]

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 pb-28 pt-4 lg:pb-8">
      {filterBar}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Fotos" className="space-y-3">
          <div className="vv-box relative overflow-hidden">
            {img ? (
              <a href={img.full} target="_blank" rel="noopener noreferrer" title="Abrir en grande">
                <img src={img.full} alt={`Foto ${photo + 1} de ${images.length}`} className="max-h-[70vh] w-full bg-card object-contain" />
              </a>
            ) : (
              <p className="p-10 text-center text-muted">Sin fotos</p>
            )}
            {images.length > 1 && (
              <span className="absolute bottom-2 right-2 rounded-[3px] bg-navy px-2 py-1 font-mono text-xs text-card">{photo + 1}/{images.length}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((im, i) => (
                <button key={im.path ?? i} type="button" onClick={() => setPhoto(i)} aria-pressed={i === photo} aria-label={`Foto ${i + 1}`} className={`h-14 w-14 overflow-hidden rounded-brand bg-card ${i === photo ? 'shadow-hard-sm' : 'opacity-60'}`} style={{ border: 'var(--border-hard)' }}>
                  <img src={im.thumb} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">{(form.source_files ?? []).join(' · ')}</p>
          {form.raw_ocr_text && (
            <details className="vv-box p-3">
              <summary className="cursor-pointer text-sm font-bold">Texto leído por OCR</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs" data-testid="raw-ocr">{form.raw_ocr_text}</pre>
            </details>
          )}
          <p className="hidden text-xs text-muted lg:block">
            Atajos: Enter o Ctrl+Enter aprueba · S o → salta · ← vuelve · H oculta · 1–9 cambia de foto
          </p>
        </section>

        <section aria-label="Datos del producto">
          <ProductForm value={form} onChange={setForm} errors={message ? errors : []} />
          {message && !errors.length && <p role="alert" className="mt-3 font-bold">{message}</p>}
          <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t-4 border-navy bg-surface p-3 lg:static lg:mt-6 lg:border-t-0 lg:bg-transparent lg:p-0">
            <button type="button" onClick={prev} disabled={safeIndex === 0} className="vv-btn vv-btn-ghost px-3" aria-label="Anterior">
              <IconArrow dir="left" width="16" height="16" />
            </button>
            <button type="button" onClick={skip} className="vv-btn vv-btn-ghost">Saltar</button>
            <button type="button" onClick={hide} disabled={busy} className="vv-btn vv-btn-ghost">Ocultar</button>
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              aria-disabled={errors.length > 0}
              className="vv-btn vv-btn-primary flex-1"
            >
              {errors.length ? `Falta: ${shortMissing(errors)}` : busy ? 'Publicando…' : 'Aprobar y siguiente'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
