// Une varias lecturas OCR de un mismo producto (varias fotos). Compartido por el importador y el admin.
const FIELDS = ['price', 'title', 'condition', 'editorial', 'year', 'code', 'extras', 'isOriginalHint']

/** Une varias lecturas: el primer valor no vacío gana; tags y warnings se juntan. */
export function mergeParsed(parsedList) {
  const out = { variants: [], tags: [], warnings: [] }
  for (const p of parsedList) {
    for (const f of FIELDS) if (out[f] == null && p[f] != null && p[f] !== '') out[f] = p[f]
    if (!out.variants.length && p.variants?.length) out.variants = p.variants
    out.tags = [...new Set([...out.tags, ...(p.tags ?? [])])]
  }
  for (const f of FIELDS) if (out[f] === undefined) out[f] = null
  // Los avisos de "falta" solo valen si al final sigue faltando.
  const missing = { price_missing: out.price == null, code_missing: out.code == null, title_missing: out.title == null }
  const all = parsedList.flatMap((p) => p.warnings ?? [])
  out.warnings = [...new Set(all.filter((w) => !(w in missing) || missing[w]))]
  return out
}

/** Debe seguir probando con otra foto del grupo. */
export const needsMoreOcr = (parsed) => parsed.price == null || parsed.code == null
