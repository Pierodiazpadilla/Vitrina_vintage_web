// Convierte un grupo de fotos + lecturas OCR en un candidato a producto (spec §7 pasos 4–6). Puro.
import { parseBanner } from '../../src/shared/parseBanner.js'
import { resolveMeta } from '../../src/shared/catalogRules.js'
import { mergeParsed } from '../../src/shared/ocrMerge.js'

export { mergeParsed, needsMoreOcr } from '../../src/shared/ocrMerge.js'

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
