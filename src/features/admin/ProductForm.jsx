// Formulario de producto compartido por revisión, alta y edición.
import { useId } from 'react'
import { CATEGORIES } from '../../shared/catalogRules.js'
import { TAG_LABELS } from '../catalog/Badges.jsx'

const WARNING_LABELS = {
  price_missing: 'No se leyó el precio',
  code_missing: 'No se leyó el código',
  title_missing: 'No se leyó el título',
  low_confidence: 'Lectura OCR dudosa',
  multiple_prices: 'Varios precios: revisa las versiones',
  license_unknown: 'No se sabe si es original',
  category_missing: 'Sin categoría por carpeta',
  duplicate_code: 'Código repetido: otro producto ya lo usa (se agregó un sufijo)',
  code_suspicious: 'Código dudoso',
}
export const warningLabel = (w) => WARNING_LABELS[w] ?? w

function Field({ label, children, wide = false, hint }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export default function ProductForm({ value, onChange, errors = [] }) {
  const id = useId()
  const set = (patch) => onChange({ ...value, ...patch })
  const input = (key, props = {}) => (
    <input
      {...props}
      value={value[key] ?? ''}
      onChange={(e) => set({ [key]: e.target.value })}
      className={`vv-input ${props.className ?? ''}`}
    />
  )
  const tags = value.tags ?? []
  const variants = value.variants ?? []
  const isTemp = String(value.code ?? '').toUpperCase().startsWith('TMP-')

  return (
    <div className="space-y-4">
      {(value.ocr_warnings ?? []).length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Avisos del OCR" data-testid="warnings">
          {value.ocr_warnings.map((w) => (
            <li key={w} className="vv-sticker vv-sticker-warm">{warningLabel(w)}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Código" hint={isTemp ? 'Código temporal: cámbialo si el banner tiene uno' : undefined}>
          {input('code', { type: 'text', autoComplete: 'off', className: `font-mono uppercase ${isTemp ? '!bg-[var(--color-accent-tint)]' : ''}`, 'data-temp': isTemp || undefined })}
        </Field>
        <Field label="Categoría">
          <select value={value.category ?? ''} onChange={(e) => set({ category: e.target.value })} className="vv-input">
            <option value="">Elige…</option>
            {Object.entries(CATEGORIES).map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
          </select>
        </Field>
        <Field label="Título" wide>{input('title', { type: 'text' })}</Field>
        <Field label="Precio (S/)" hint={value.is_preorder ? 'En preventa puede quedar vacío: “Precio a consultar”' : undefined}>
          {input('price', { type: 'number', inputMode: 'decimal', min: 0, step: '0.01', className: 'font-mono' })}
        </Field>
        <Field label="Descuento (%)">{input('discount_percent', { type: 'number', min: 0, max: 90, className: 'font-mono' })}</Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-bold">¿Original?</legend>
          <div className="flex gap-2">
            {[['Original', true], ['Réplica', false], ['No sé', null]].map(([label, v]) => (
              <label key={label} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-brand px-3 text-sm font-bold ${value.is_original === v ? 'bg-navy text-card' : 'bg-card'}`} style={{ border: 'var(--border-hard)' }}>
                <input type="radio" name={`${id}-orig`} checked={value.is_original === v} onChange={() => set({ is_original: v })} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Época">
          <select value={value.era ?? ''} onChange={(e) => set({ era: e.target.value || null })} className="vv-input">
            <option value="">Sin definir</option>
            <option value="retro">Retro</option>
            <option value="moderna">Moderna</option>
          </select>
        </Field>
        <Field label="Stock">{input('stock', { type: 'number', min: 0, className: 'font-mono' })}</Field>
        <Field label="Editorial">{input('editorial', { type: 'text' })}</Field>
        <Field label="Año">{input('year', { type: 'number', className: 'font-mono' })}</Field>
        <Field label="Estado" wide>{input('condition', { type: 'text', placeholder: 'Sellado, Set completo a pegar…' })}</Field>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-bold">Etiquetas</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_LABELS).map(([tag, label]) => {
            const on = tags.includes(tag)
            return (
              <label key={tag} className={`flex min-h-[40px] cursor-pointer items-center rounded-brand px-2.5 text-sm font-bold ${on ? 'bg-navy text-card' : 'bg-card'}`} style={{ border: 'var(--border-hard)' }}>
                <input type="checkbox" checked={on} onChange={() => set({ tags: on ? tags.filter((t) => t !== tag) : [...tags, tag] })} className="sr-only" />
                {label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <Field label="Incluye (extras)" wide>
        <textarea value={value.extras ?? ''} onChange={(e) => set({ extras: e.target.value })} rows={2} className="vv-input py-2" />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Versiones con precio propio</legend>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input aria-label={`Versión ${i + 1}`} value={v.label} onChange={(e) => set({ variants: variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="vv-input flex-1" />
            <input aria-label={`Precio versión ${i + 1}`} type="number" value={v.price ?? ''} onChange={(e) => set({ variants: variants.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })} className="vv-input w-28 font-mono" />
            <button type="button" onClick={() => set({ variants: variants.filter((_, j) => j !== i) })} className="vv-btn vv-btn-ghost px-3" aria-label={`Quitar versión ${i + 1}`}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set({ variants: [...variants, { label: '', price: '' }] })} className="text-sm font-bold text-primary-dark underline">
          + Agregar versión
        </button>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-[44px] items-center gap-3 font-bold">
          <input type="checkbox" checked={!!value.is_preorder} onChange={(e) => set({ is_preorder: e.target.checked })} className="h-5 w-5 accent-[var(--color-primary-dark)]" />
          Preventa
        </label>
        {value.is_preorder && <Field label="Llega (fecha estimada)">{input('preorder_eta', { type: 'text', placeholder: 'Diciembre 2026' })}</Field>}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-brand bg-[var(--color-accent-tint)] p-3 text-sm" style={{ border: 'var(--border-hard)' }}>
          <p className="font-bold">Para publicar falta:</p>
          <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
