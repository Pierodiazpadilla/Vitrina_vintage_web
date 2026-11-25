// Alta de producto desde el celular o la PC: fotos → OCR en el navegador → formulario prellenado (spec §10.2).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { parseBanner } from '../../shared/parseBanner.js'
import { licenseFromText } from '../../shared/catalogRules.js'
import { mergeParsed, needsMoreOcr } from '../../shared/ocrMerge.js'
import { validateForPublish } from '../../shared/validation.js'
import { useAdminApi, ValidationError } from './adminApi.js'
import { md5OfFile } from './browserImages.js'
import * as browserOcr from './browserOcr.js'
import ProductForm from './ProductForm.jsx'

export function formFromOcr(reads, md5s) {
  const parsed = mergeParsed(reads.map((r) => parseBanner(r.text, { confidence: r.confidence })))
  const raw = reads.map((r) => r.text).join('\n\n')
  return {
    code: parsed.code ?? `TMP-${md5s[0].slice(0, 8)}`,
    title: parsed.title ?? '',
    price: parsed.price ?? '',
    variants: parsed.variants ?? [],
    discount_percent: 0,
    category: '',
    is_original: parsed.isOriginalHint ?? licenseFromText(raw),
    era: null,
    condition: parsed.condition ?? '',
    tags: parsed.tags ?? [],
    editorial: parsed.editorial ?? '',
    year: parsed.year ?? '',
    extras: parsed.extras ?? '',
    stock: 1,
    is_preorder: false,
    preorder_eta: '',
    raw_ocr_text: raw,
    ocr_warnings: parsed.warnings ?? [],
    file_hashes: md5s,
    images: [],
  }
}

export default function NewProduct() {
  const api = useAdminApi()
  const [items, setItems] = useState([]) // { file, md5, url }
  const [progress, setProgress] = useState(null)
  const [form, setForm] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => () => items.forEach((i) => i.url && URL.revokeObjectURL?.(i.url)), [items])

  async function onFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name))
    if (!files.length) return
    setMessage(null)
    setDone(null)
    setForm(null)
    setDuplicates([])
    setErrors([])
    const loaded = []
    for (const file of files) {
      loaded.push({ file, md5: await md5OfFile(file), url: URL.createObjectURL?.(file) ?? '' })
    }
    setItems(loaded)
    const reads = []
    try {
      for (const [i, item] of loaded.entries()) {
        setProgress(`Leyendo el texto de la foto ${i + 1} de ${loaded.length}…`)
        reads.push(await browserOcr.read(item.file))
        if (!needsMoreOcr(mergeParsed(reads.map((r) => parseBanner(r.text, { confidence: r.confidence }))))) break
      }
    } catch (e) {
      setMessage(`No se pudo leer el texto (${e.message}). Completa los datos a mano.`)
    }
    setProgress(null)
    const next = formFromOcr(reads.length ? reads : [{ text: '', confidence: 0 }], loaded.map((i) => i.md5))
    setForm(next)
    try {
      setDuplicates(await api.findDuplicates({ code: next.code, md5s: next.file_hashes }))
    } catch {
      setDuplicates([])
    }
  }

  async function save(status) {
    if (!form) return
    if (status === 'published') {
      const errs = validateForPublish(form)
      setErrors(errs)
      if (errs.length) return
    }
    setBusy(status === 'published' ? 'Publicando…' : 'Guardando…')
    setMessage(null)
    try {
      const images = await api.uploadImages(form.code, items, (i, n) => setBusy(`Subiendo foto ${i + 1} de ${n}…`))
      const row = await api.createProduct({ ...form, images }, status)
      setDone({ code: row.code, status })
    } catch (e) {
      if (e instanceof ValidationError) setErrors(e.errors)
      else setMessage(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function appendTo(row) {
    setBusy('Agregando fotos…')
    try {
      const images = await api.uploadImages(row.code, items)
      await api.appendImages(row, images, items.map((i) => i.md5))
      setDone({ code: row.code, status: 'appended' })
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(null)
    }
  }

  const reset = () => {
    setItems([])
    setForm(null)
    setDone(null)
    setDuplicates([])
    setErrors([])
  }

  if (done) {
    const text = { published: 'Publicado', draft: 'Guardado como borrador', appended: 'Fotos agregadas a' }[done.status]
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="font-display text-4xl" aria-hidden="true">^ ^</p>
        <h1 className="mt-3 font-title text-2xl font-bold">{text} {done.code}</h1>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={reset} className="vv-btn vv-btn-primary">Subir otro producto</button>
          <Link to="/admin/productos" className="vv-btn vv-btn-ghost">Ver productos</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-28 pt-6 lg:pb-10">
      <h1 className="font-display text-2xl">NUEVO PRODUCTO</h1>

      <div className="flex flex-wrap gap-2">
        <label className="vv-btn vv-btn-primary cursor-pointer">
          Tomar foto
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        </label>
        <label className="vv-btn vv-btn-ghost cursor-pointer">
          Elegir fotos
          <input data-testid="file-input" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        </label>
      </div>
      <p className="text-sm text-muted">La primera foto es la portada. Leemos el banner (precio, código, editorial) y prellenamos los datos.</p>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Fotos elegidas">
          {items.map((i) => (
            <li key={i.md5}><img src={i.url} alt={i.file.name} className="h-20 w-20 rounded-brand bg-card object-cover" style={{ border: 'var(--border-hard)' }} /></li>
          ))}
        </ul>
      )}

      {progress && <p role="status" className="font-mono text-sm">{progress}</p>}
      {message && <p role="alert" className="font-bold">{message}</p>}

      {duplicates.length > 0 && (
        <div className="vv-box space-y-2 bg-[var(--color-accent-tint)] p-4" data-testid="duplicates">
          <p className="font-bold">Esto se parece a un producto que ya existe:</p>
          {duplicates.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2">
              <span><span className="font-mono">{d.code}</span> — {d.title} <span className="text-sm text-muted">({d.status})</span></span>
              <button type="button" disabled={!!busy} onClick={() => appendTo(d)} className="vv-btn vv-btn-ghost text-sm">
                Agregar fotos al producto existente
              </button>
            </div>
          ))}
        </div>
      )}

      {form && (
        <>
          <ProductForm value={form} onChange={setForm} errors={errors} />
          <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t-4 border-navy bg-surface p-3 lg:static lg:border-t-0 lg:bg-transparent lg:p-0">
            <button type="button" disabled={!!busy} onClick={() => save('draft')} className="vv-btn vv-btn-ghost flex-1">Guardar borrador</button>
            <button type="button" disabled={!!busy} onClick={() => save('published')} className="vv-btn vv-btn-primary flex-1">{busy ?? 'Publicar'}</button>
          </div>
        </>
      )}
    </main>
  )
}
