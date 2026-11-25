// Decisión insertar / actualizar sin pisar ediciones del admin (spec §7 pasos 7 y 9). Puro: sin red.

const union = (a = [], b = []) => [...new Set([...(a ?? []), ...(b ?? [])])]
const upper = (s) => String(s ?? '').toUpperCase()

/**
 * Fila existente que corresponde al candidato: code (no temporal) → MD5 → source_key.
 * @param {{ code, codeIsTemp, md5s: string[], sourceKey }} candidate
 */
export function findExisting(candidate, existing) {
  if (!candidate.codeIsTemp && candidate.code) {
    const byCode = existing.find((r) => upper(r.code) === upper(candidate.code))
    if (byCode) return byCode
  }
  const md5s = new Set(candidate.md5s ?? [])
  const byHash = existing.find((r) => (r.file_hashes ?? []).some((h) => md5s.has(h)))
  if (byHash) return byHash
  if (candidate.sourceKey) {
    const byKey = existing.find((r) => r.source_key === candidate.sourceKey)
    if (byKey) return byKey
  }
  return null
}

/** Campos de contenido (los que el admin puede corregir). */
function contentFields(c) {
  return {
    title: c.title,
    price: c.price ?? null,
    variants: c.variants ?? [],
    category: c.category,
    is_original: c.isOriginal ?? null,
    era: c.era ?? null,
    condition: c.condition ?? null,
    tags: c.tags ?? [],
    editorial: c.editorial ?? null,
    year: c.year ?? null,
    extras: c.extras ?? null,
    raw_ocr_text: c.rawOcrText ?? null,
    ocr_warnings: c.warnings ?? [],
  }
}

function mergeImages(current = [], added = []) {
  const seen = new Set((current ?? []).map((i) => i.path))
  return [...(current ?? []), ...(added ?? []).filter((i) => !seen.has(i.path))]
}

/**
 * @returns {{ action: 'insert'|'update-full'|'update-append', patch: object }}
 *   update-append (editado por el admin o ya publicado): solo fotos, hashes, rutas y el descuento.
 */
export function planUpsert(candidate, row) {
  const images = mergeImages(row?.images, candidate.images)
  const tracking = {
    images,
    image_url: images[0]?.full ?? row?.image_url ?? null,
    file_hashes: union(row?.file_hashes, candidate.md5s),
    source_files: union(row?.source_files, candidate.sourceFiles),
  }

  if (!row) {
    return {
      action: 'insert',
      patch: {
        code: upper(candidate.code),
        code_is_temp: Boolean(candidate.codeIsTemp),
        ...contentFields(candidate),
        discount_percent: candidate.discountPercent ?? 0,
        stock: 1,
        status: 'draft',
        admin_edited: false,
        source_key: candidate.sourceKey ?? null,
        ...tracking,
      },
    }
  }

  if (row.status === 'draft' && !row.admin_edited) {
    // Un código real nuevo reemplaza al temporal; uno temporal nunca reemplaza a uno real.
    const code = !candidate.codeIsTemp && candidate.code ? upper(candidate.code) : row.code
    return {
      action: 'update-full',
      patch: {
        code,
        code_is_temp: !candidate.codeIsTemp && candidate.code ? false : Boolean(row.code_is_temp ?? candidate.codeIsTemp),
        ...contentFields(candidate),
        discount_percent: Math.max(Number(row.discount_percent) || 0, candidate.discountPercent ?? 0),
        source_key: row.source_key ?? candidate.sourceKey ?? null,
        ...tracking,
      },
    }
  }

  const patch = { ...tracking }
  if ((candidate.discountPercent ?? 0) > 0) patch.discount_percent = candidate.discountPercent
  return { action: 'update-append', patch }
}

const firstFilled = (...values) => values.find((v) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))

/** Grupos distintos con el mismo código real → un solo producto (warning merged_by_code). */
export function mergeByCode(candidates) {
  const out = []
  const byCode = new Map()
  for (const c of candidates) {
    const key = c.codeIsTemp || !c.code ? null : upper(c.code)
    const prev = key ? byCode.get(key) : null
    if (!prev) {
      const copy = { ...c }
      out.push(copy)
      if (key) byCode.set(key, copy)
      continue
    }
    const seen = new Set(prev.files?.map((f) => f.md5) ?? [])
    Object.assign(prev, {
      md5s: union(prev.md5s, c.md5s),
      sourceFiles: union(prev.sourceFiles, c.sourceFiles),
      files: [...(prev.files ?? []), ...(c.files ?? []).filter((f) => !seen.has(f.md5))],
      title: firstFilled(prev.title, c.title),
      price: firstFilled(prev.price, c.price) ?? null,
      variants: firstFilled(prev.variants, c.variants) ?? [],
      category: firstFilled(prev.category, c.category),
      isOriginal: prev.isOriginal ?? c.isOriginal ?? null,
      era: firstFilled(prev.era, c.era) ?? null,
      condition: firstFilled(prev.condition, c.condition) ?? null,
      tags: union(prev.tags, c.tags),
      editorial: firstFilled(prev.editorial, c.editorial) ?? null,
      year: firstFilled(prev.year, c.year) ?? null,
      extras: firstFilled(prev.extras, c.extras) ?? null,
      discountPercent: Math.max(prev.discountPercent ?? 0, c.discountPercent ?? 0),
      rawOcrText: [prev.rawOcrText, c.rawOcrText].filter(Boolean).join('\n\n'),
      warnings: union(union(prev.warnings, c.warnings), ['merged_by_code']),
      mergedKeys: union(prev.mergedKeys ?? [prev.sourceKey], [c.sourceKey]),
    })
  }
  return out
}
