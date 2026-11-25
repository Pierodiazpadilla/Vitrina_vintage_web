// Convierte un grupo de fotos + lecturas OCR en un candidato a producto (spec §7 pasos 4–6). Puro.
import { parseBanner } from '../../src/shared/parseBanner.js'
import { resolveMeta } from '../../src/shared/catalogRules.js'

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

/**
 * @param {{ key, prefix, relPaths, files: { md5 }[] }} group
 * @param {{ text, confidence }[]} reads  lecturas OCR en el orden de las fotos
 */
export function buildCandidate(group, reads) {
  const parsed = mergeParsed(reads.map((r) => parseBanner(r.text, { confidence: r.confidence })))
  const rawOcrText = reads.map((r) => r.text).join('\n\n')
  const meta = resolveMeta(group.relPaths, group.prefix, rawOcrText)
  const warnings = [...parsed.warnings]
  let isOriginal = meta.isOriginal ?? parsed.isOriginalHint ?? null
  if (isOriginal == null) warnings.push('license_unknown')
  let category = meta.category
  if (!category) {
    category = 'variado'
    warnings.push('category_missing')
  }
  const main = group.files[0]
  const codeIsTemp = !parsed.code
  return {
    sourceKey: group.key,
    code: parsed.code ?? `TMP-${main.md5.slice(0, 8)}`,
    codeIsTemp,
    title: parsed.title ?? group.key,
    price: parsed.price,
    variants: parsed.variants,
    discountPercent: meta.discountPercent,
    category,
    isOriginal,
    era: meta.era,
    condition: parsed.condition,
    tags: parsed.tags,
    editorial: parsed.editorial,
    year: parsed.year,
    extras: parsed.extras,
    rawOcrText,
    warnings: [...new Set(warnings)],
    md5s: group.files.map((f) => f.md5),
    sourceFiles: group.relPaths,
    files: group.files,
  }
}
