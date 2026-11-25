// Escaneo de raw-catalog/: MD5 por archivo y agrupación por nombre base (spec §7 pasos 1–3).
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { normalizeBaseName, prefixOf, sortPhotos } from '../../src/shared/fileGrouping.js'
import { isIgnoredPath } from '../../src/shared/catalogRules.js'

const IMAGE = /\.(jpe?g|png)$/i

export function md5File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5')
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')))
  })
}

async function walk(dir, rel = '') {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    // Los zip de Google Drive en Windows traen nombres en NFD: se guardan en NFC.
    const name = e.name.normalize('NFC')
    const relPath = rel ? `${rel}/${name}` : name
    const absPath = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(absPath, relPath)))
    else if (IMAGE.test(name)) out.push({ absPath, relPath })
  }
  return out
}

/**
 * La carpeta descargada suele venir anidada (raw-catalog/<zip>/<Catálogo>/...): baja mientras haya
 * una sola subcarpeta y ningún archivo.
 */
export async function findCatalogRoot(dir) {
  let current = dir
  for (;;) {
    const entries = await readdir(current, { withFileTypes: true })
    const dirs = entries.filter((e) => e.isDirectory())
    const files = entries.filter((e) => e.isFile() && !e.name.startsWith('.'))
    if (dirs.length !== 1 || files.length > 0) return current
    current = join(current, dirs[0].name)
  }
}

/**
 * @returns {Promise<{ key, prefix, relPaths: string[], files: { absPath, relPath, md5, photoIndex }[] }[]>}
 *   files sin duplicados por MD5 y ordenadas (principal primero); relPaths incluye todas las copias.
 */
export async function scanCatalog(root) {
  const all = (await walk(root)).filter((f) => !isIgnoredPath(f.relPath))
  const groups = new Map()
  for (const f of all) {
    const filename = f.relPath.split('/').pop()
    const { key, photoIndex } = normalizeBaseName(filename)
    const md5 = await md5File(f.absPath)
    if (!groups.has(key)) groups.set(key, { key, prefix: prefixOf(key), relPaths: [], files: [] })
    const g = groups.get(key)
    g.relPaths.push(f.relPath)
    if (!g.files.some((x) => x.md5 === md5)) g.files.push({ ...f, md5, photoIndex })
  }
  return [...groups.values()]
    .map((g) => ({ ...g, relPaths: g.relPaths.sort(), files: sortPhotos(g.files) }))
    .sort((a, b) => a.key.localeCompare(b.key, 'es', { numeric: true }))
}
