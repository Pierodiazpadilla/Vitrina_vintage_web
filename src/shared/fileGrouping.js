// Agrupa las fotos del catálogo por nombre base: "VITRINAdblic (16)a.jpg" y "(16)b.jpg"
// son fotos del mismo producto. Spec §6 fileGrouping.

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i

function fileNameOf(path) {
  const parts = String(path).split(/[\\/]/)
  return parts[parts.length - 1]
}

function stripExtensions(name) {
  let out = name
  while (IMAGE_EXT.test(out)) out = out.replace(IMAGE_EXT, '')
  return out
}

/** @returns {{ key: string, photoIndex: string | null }} */
export function normalizeBaseName(filename) {
  const base = stripExtensions(fileNameOf(filename)).toLowerCase().replace(/\s+/g, ' ').trim()
  const match = base.match(/^(.*\(\d+\))\s*([a-z0-9])?$/)
  if (!match) return { key: base, photoIndex: null }
  return { key: match[1], photoIndex: match[2] ?? null }
}

/** "vitrinavarlicm (10)" → "varlicm" */
export function prefixOf(key) {
  const match = String(key).toLowerCase().match(/^vitrina([a-z]+)\s*\(/)
  return match ? match[1] : ''
}

/** Foto principal (sin sufijo) primero, luego alfanumérico. No muta la entrada. */
export function sortPhotos(items) {
  return [...items].sort((a, b) => {
    if (a.photoIndex === b.photoIndex) return 0
    if (a.photoIndex == null) return -1
    if (b.photoIndex == null) return 1
    return a.photoIndex.localeCompare(b.photoIndex, 'es', { numeric: true })
  })
}
