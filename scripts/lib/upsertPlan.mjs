// Decisión insertar / actualizar sin pisar ediciones del admin (spec §7 pasos 7 y 9). Puro: sin red.
//
// Cambio respecto al plan original: el catálogo real REUTILIZA códigos entre productos distintos
// (p. ej. DB0126 = postales a 15 soles y también la colección Yokos a 1200; DT0090 = original y réplica).
// Por eso un código igual NO identifica al mismo producto: se empareja por MD5 o por nombre base,
// y un código ya tomado recibe sufijo "-2", "-3"… con el aviso `duplicate_code` para el admin.

const union = (a = [], b = []) => [...new Set([...(a ?? []), ...(b ?? [])])]
const upper = (s) => String(s ?? '').toUpperCase()

/**
 * Fila existente que corresponde al candidato: alguna foto (MD5) en común → mismo nombre base.
 * @param {{ md5s: string[], sourceKey }} candidate
 */
export function findExisting(candidate, existing) {
  const md5s = new Set(candidate.md5s ?? [])
  const byHash = existing.find((r) => (r.file_hashes ?? []).some((h) => md5s.has(h)))
  if (byHash) return byHash
  if (candidate.sourceKey) {
    const byKey = existing.find((r) => r.source_key === candidate.sourceKey)
    if (byKey) return byKey
  }
  return null
}

/**
 * Código final del candidato sin chocar con otros productos.
 * @param {object} candidate  con code y codeIsTemp
 * @param {object|null} row  fila emparejada (si hay)
 * @param {Set<string>} taken  códigos usados por OTRAS filas (en mayúsculas)
 * @returns {{ code: string, codeIsTemp: boolean, duplicate: boolean }}
 */
export function resolveCode(candidate, row, taken) {
  if (row && !row.code_is_temp) return { code: row.code, codeIsTemp: false, duplicate: false }
  if (candidate.codeIsTemp) {
    return row ? { code: row.code, codeIsTemp: true, duplicate: false } : { code: upper(candidate.code), codeIsTemp: true, duplicate: false }
  }
  const wanted = upper(candidate.code)
  if (!taken.has(wanted)) return { code: wanted, codeIsTemp: false, duplicate: false }
  let n = 2
  while (taken.has(`${wanted}-${n}`)) n++
  return { code: `${wanted}-${n}`, codeIsTemp: false, duplicate: true }
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
 * El candidato ya trae su código resuelto (resolveCode).
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
    return {
      action: 'update-full',
      patch: {
        code: upper(candidate.code ?? row.code),
        code_is_temp: Boolean(candidate.codeIsTemp),
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
