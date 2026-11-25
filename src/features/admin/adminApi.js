// Escrituras del panel. Todas pasan por la RLS (is_admin()); aquí solo se arman los cambios correctos.
import { createContext, useContext } from 'react'
import { supabase } from '../../lib/supabase.js'
import { validateForPublish } from '../../shared/validation.js'

export const BUCKET = 'catalog'

export class ValidationError extends Error {
  constructor(errors) {
    super(errors.join(' · '))
    this.errors = errors
  }
}

/** Carpeta de origen (sin el archivo) de la primera foto importada. */
export function folderOf(row) {
  const first = row?.source_files?.[0]
  if (!first) return 'Cargados a mano'
  const parts = first.split('/')
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'Raíz'
}

const union = (a = [], b = []) => [...new Set([...(a ?? []), ...(b ?? [])])]

/** Columnas editables (lo que el formulario puede mandar). */
export const EDITABLE = [
  'code', 'code_is_temp', 'title', 'price', 'discount_percent', 'category', 'is_original', 'era', 'condition',
  'tags', 'variants', 'editorial', 'year', 'extras', 'stock', 'is_preorder', 'preorder_eta', 'images', 'image_url',
  'featured_rank',
]

/** Limpia y tipa lo que viene del formulario. */
export function toPatch(form) {
  const patch = {}
  for (const k of EDITABLE) if (k in form) patch[k] = form[k]
  const num = (v) => (v === '' || v == null ? null : Number(v))
  if ('code' in patch) patch.code = String(patch.code ?? '').trim().toUpperCase()
  if ('code' in patch) patch.code_is_temp = patch.code.startsWith('TMP-')
  if ('price' in patch) patch.price = num(patch.price)
  if ('year' in patch) patch.year = num(patch.year)
  if ('discount_percent' in patch) patch.discount_percent = num(patch.discount_percent) ?? 0
  if ('stock' in patch) patch.stock = num(patch.stock) ?? 1
  if ('variants' in patch) {
    patch.variants = (patch.variants ?? [])
      .map((v) => ({ label: String(v.label ?? '').trim(), price: Number(v.price) }))
      .filter((v) => v.label || v.price)
    const prices = patch.variants.map((v) => v.price).filter((n) => n > 0)
    if (prices.length) patch.price = Math.min(...prices)
  }
  for (const k of ['title', 'condition', 'editorial', 'extras', 'preorder_eta', 'era']) {
    if (k in patch && typeof patch[k] === 'string') patch[k] = patch[k].trim() || null
  }
  if ('images' in patch) patch.image_url = patch.images?.[0]?.full ?? null
  return patch
}

function must({ data, error }) {
  if (error) {
    if (error.code === '23505') throw new Error('Ya existe otro producto con ese código.')
    throw new Error(error.message)
  }
  return data
}

/**
 * @param {object} client  cliente de Supabase (sesión del admin)
 * @param {{ toWebpVariants?: Function }} deps  conversión a webp (inyectable en pruebas)
 */
export function createAdminApi(client = supabase, deps = {}) {
  const table = () => client.from('products')

  async function listRows(build) {
    const rows = []
    for (let from = 0; ; from += 1000) {
      const data = must(await build(table().select('*')).range(from, from + 999))
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  }

  const api = {
    async listDrafts({ category, folder, warningsOnly, cleanOnly } = {}) {
      const rows = await listRows((q) => q.eq('status', 'draft').order('created_at', { ascending: true }))
      return rows.filter((r) => {
        if (category && r.category !== category) return false
        if (folder && folderOf(r) !== folder) return false
        const warned = (r.ocr_warnings ?? []).length > 0
        if (warningsOnly && !warned) return false
        if (cleanOnly && warned) return false
        return true
      })
    },

    listAll() {
      return listRows((q) => q.order('updated_at', { ascending: false }))
    },

    async saveProduct(id, patch) {
      return must(await table().update({ ...toPatch(patch), admin_edited: true }).eq('id', id).select('*').single())
    },

    async createProduct(form, status = 'draft') {
      const patch = toPatch(form)
      if (status === 'published') {
        const errors = validateForPublish({ ...form, ...patch })
        if (errors.length) throw new ValidationError(errors)
      }
      const row = {
        ...patch,
        status,
        admin_edited: true,
        raw_ocr_text: form.raw_ocr_text ?? null,
        ocr_warnings: form.ocr_warnings ?? [],
        file_hashes: form.file_hashes ?? [],
        source_files: [],
        ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
      }
      return must(await table().insert(row).select('*').single())
    },

    /** Valida antes de tocar la base: si falta algo, no llama al cliente. */
    async publish(id, product) {
      const patch = toPatch(product)
      const errors = validateForPublish({ ...product, ...patch })
      if (errors.length) throw new ValidationError(errors)
      return must(await table().update({
        ...patch,
        admin_edited: true,
        status: 'published',
        published_at: product.published_at ?? new Date().toISOString(),
      }).eq('id', id).select('*').single())
    },

    async hide(id) {
      return must(await table().update({ status: 'hidden', admin_edited: true }).eq('id', id).select('*').single())
    },

    async markSold(id) {
      return must(await table().update({ stock: 0, status: 'sold', admin_edited: true }).eq('id', id).select('*').single())
    },

    /** −1 vendido; al llegar a 0 pasa a vendido. */
    async decrementStock(id, currentStock) {
      const next = Math.max(0, (Number(currentStock) || 1) - 1)
      const patch = next === 0 ? { stock: 0, status: 'sold' } : { stock: next }
      return must(await table().update({ ...patch, admin_edited: true }).eq('id', id).select('*').single())
    },

    /** Reponer: fija el stock; un vendido con stock vuelve a publicarse. */
    async restock(product, n) {
      const stock = Math.floor(Number(n))
      if (!(stock >= 1)) throw new Error('El stock debe ser al menos 1')
      const patch = { stock, admin_edited: true }
      if (product.status === 'sold') patch.status = 'published'
      return must(await table().update(patch).eq('id', product.id).select('*').single())
    },

    async setFeatured(id, rank) {
      const value = rank == null || rank === '' ? null : Math.max(1, Math.floor(Number(rank)))
      return must(await table().update({ featured_rank: value, admin_edited: true }).eq('id', id).select('*').single())
    },

    /** Borra la fila y sus fotos de Storage. */
    async deleteProduct(product) {
      const paths = (product.images ?? []).flatMap((img) => [`${img.path}-full.webp`, `${img.path}-thumb.webp`])
      if (paths.length) {
        const { error } = await client.storage.from(BUCKET).remove(paths)
        if (error) throw new Error(error.message)
      }
      must(await table().delete().eq('id', product.id))
    },

    /** Sube cada foto como full + thumb webp. items: { file, md5 }[] */
    async uploadImages(code, items, onProgress) {
      const convert = deps.toWebpVariants ?? (await import('./browserImages.js')).toWebpVariants
      const images = []
      for (const [i, { file, md5 }] of items.entries()) {
        onProgress?.(i, items.length)
        const { full, thumb, w, h } = await convert(file)
        const base = `products/${String(code).toUpperCase()}/${md5.slice(0, 12)}`
        for (const [suffix, blob] of [['full', full], ['thumb', thumb]]) {
          const { error } = await client.storage.from(BUCKET).upload(`${base}-${suffix}.webp`, blob, { contentType: 'image/webp', upsert: true })
          if (error) throw new Error(`No se pudo subir la foto: ${error.message}`)
        }
        const url = (p) => client.storage.from(BUCKET).getPublicUrl(p).data.publicUrl
        images.push({ path: base, full: url(`${base}-full.webp`), thumb: url(`${base}-thumb.webp`), w, h })
      }
      return images
    },

    /** Productos con el mismo código o con alguna de las mismas fotos (MD5). */
    async findDuplicates({ code, md5s = [] }) {
      const found = new Map()
      if (code && !String(code).toUpperCase().startsWith('TMP-')) {
        for (const r of must(await table().select('*').eq('code', String(code).toUpperCase()))) found.set(r.id, r)
      }
      if (md5s.length) {
        for (const r of must(await table().select('*').overlaps('file_hashes', md5s))) found.set(r.id, r)
      }
      return [...found.values()]
    },

    /** Agrega fotos nuevas a un producto existente. */
    async appendImages(row, images, md5s) {
      const all = [...(row.images ?? []), ...images]
      return must(await table().update({
        images: all,
        image_url: all[0]?.full ?? null,
        file_hashes: union(row.file_hashes, md5s),
        admin_edited: true,
      }).eq('id', row.id).select('*').single())
    },
  }
  return api
}

export const AdminApiContext = createContext(null)
let defaultApi = null
export function useAdminApi() {
  const injected = useContext(AdminApiContext)
  if (injected) return injected
  defaultApi ??= createAdminApi()
  return defaultApi
}
