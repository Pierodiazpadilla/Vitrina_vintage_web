#!/usr/bin/env node
// Importador masivo del catálogo (spec §7).
// Uso: node scripts/import-catalog.mjs [--dry-run] [--only "<subcarpeta>"] [--limit N] [--concurrency 3] [--root raw-catalog]
// Lee SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY de .env / .env.local.
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { normalizeText } from '../src/shared/text.js'
import { findCatalogRoot, scanCatalog } from './lib/scan.mjs'
import { webpVariants } from './lib/images.mjs'
import { createOcr } from './lib/ocr.mjs'
import { buildCandidate, mergeParsed, needsMoreOcr } from './lib/candidate.mjs'
import { findExisting, planUpsert, resolveCode } from './lib/upsertPlan.mjs'
import { parseBanner } from '../src/shared/parseBanner.js'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    only: { type: 'string' },
    limit: { type: 'string' },
    concurrency: { type: 'string', default: '3' },
    root: { type: 'string', default: 'raw-catalog' },
  },
})
const dryRun = args['dry-run']
const concurrency = Math.max(1, Number(args.concurrency) || 3)
const BUCKET = 'catalog'
const SELECT = 'id, code, code_is_temp, file_hashes, source_key, source_files, status, admin_edited, images, image_url, discount_percent'

const errors = []
const logError = (file, group, stage, error) => {
  errors.push({ file, group, stage, error: String(error?.message ?? error), at: new Date().toISOString() })
  console.error(`  ✗ [${stage}] ${group}: ${error?.message ?? error}`)
}

function supabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function loadExisting(client) {
  if (!client) return []
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('products').select(SELECT).range(from, from + 999)
    if (error) throw new Error(`No se pudo leer products: ${error.message}`)
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

/** Ejecuta fn sobre items con N tareas en paralelo; cada tarea recibe su propio contexto. */
async function pool(items, n, makeCtx, fn) {
  let next = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    const ctx = await makeCtx()
    try {
      while (next < items.length) {
        const i = next++
        await fn(items[i], ctx, i)
      }
    } finally {
      await ctx?.close?.()
    }
  })
  await Promise.all(workers)
}

async function ocrGroup(group, ocr) {
  const reads = []
  for (const file of group.files) {
    let buffer
    try {
      buffer = await readFile(file.absPath)
    } catch (e) {
      logError(file.relPath, group.key, 'read', e)
      continue
    }
    try {
      reads.push(await ocr.readBanner(buffer))
    } catch (e) {
      logError(file.relPath, group.key, 'ocr', e)
      continue
    }
    const sofar = mergeParsed(reads.map((r) => parseBanner(r.text, { confidence: r.confidence })))
    if (!needsMoreOcr(sofar)) break
  }
  return buildCandidate(group, reads)
}

async function uploadImages(client, code, candidate, knownHashes) {
  const images = []
  for (const file of candidate.files) {
    if (knownHashes.has(file.md5)) continue
    const base = `products/${code}/${file.md5.slice(0, 12)}`
    try {
      const { full, thumb, w, h } = await webpVariants(await readFile(file.absPath))
      for (const [suffix, body] of [['full', full], ['thumb', thumb]]) {
        const { error } = await client.storage.from(BUCKET).upload(`${base}-${suffix}.webp`, body, { contentType: 'image/webp', upsert: true })
        if (error) throw new Error(error.message)
      }
      const url = (p) => client.storage.from(BUCKET).getPublicUrl(p).data.publicUrl
      images.push({ path: base, full: url(`${base}-full.webp`), thumb: url(`${base}-thumb.webp`), w, h })
    } catch (e) {
      logError(file.relPath, candidate.sourceKey, 'upload', e)
    }
  }
  return images
}

async function main() {
  const started = Date.now()
  const root = await findCatalogRoot(args.root)
  console.log(`Catálogo: ${root}${dryRun ? '  (dry-run: no se sube nada)' : ''}`)

  let groups = await scanCatalog(root)
  const fileCount = groups.reduce((n, g) => n + g.relPaths.length, 0)
  if (args.only) {
    const only = normalizeText(args.only)
    groups = groups.filter((g) => g.relPaths.some((p) => normalizeText(p).startsWith(only)))
  }
  if (args.limit) groups = groups.slice(0, Number(args.limit))
  console.log(`${fileCount} archivos · ${groups.length} grupos a procesar`)

  const client = supabaseClient()
  if (!client && !dryRun) throw new Error('Faltan SUPABASE_URL/VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  let existing = []
  try {
    existing = await loadExisting(client)
  } catch (e) {
    if (!dryRun) throw e
    console.warn(`  ! ${e.message} — el dry-run sigue como si la base estuviera vacía`)
  }

  // OCR (un worker de tesseract por tarea en paralelo)
  const candidates = []
  await pool(groups, concurrency, createOcr, async (group, ocr, i) => {
    try {
      candidates[i] = await ocrGroup(group, ocr)
      const c = candidates[i]
      console.log(`  ${String(i + 1).padStart(4)}/${groups.length} ${c.code.padEnd(12)} ${c.price ?? '—'} ${c.warnings.length ? `⚠ ${c.warnings.join(',')}` : ''}`)
    } catch (e) {
      logError(group.files[0]?.relPath, group.key, 'ocr', e)
    }
  })

  const ready = candidates.filter(Boolean)
  const summary = { archivos: fileCount, grupos: groups.length, insertados: 0, actualizados: 0, codigosRepetidos: 0, conWarnings: 0, fallidos: 0 }
  const preview = []

  for (const raw of ready) {
    const row = findExisting(raw, existing)
    // Códigos de OTRAS filas (los de esta misma fila no cuentan como choque).
    const taken = new Set(existing.filter((r) => r !== row).map((r) => String(r.code).toUpperCase()))
    const resolved = resolveCode(raw, row, taken)
    const candidate = {
      ...raw,
      code: resolved.code,
      codeIsTemp: resolved.codeIsTemp,
      warnings: resolved.duplicate ? [...raw.warnings, 'duplicate_code'] : raw.warnings,
    }
    if (resolved.duplicate) summary.codigosRepetidos++
    if (candidate.warnings.length) summary.conWarnings++
    if (dryRun) {
      const { action, patch } = planUpsert(candidate, row)
      preview.push({ action, matched: row?.code ?? null, ...patch, files: candidate.sourceFiles })
      // simula la fila para que los códigos siguientes vean este como tomado
      if (action === 'insert') {
        existing.push({ ...patch })
        summary.insertados++
      } else summary.actualizados++
      continue
    }
    try {
      const images = await uploadImages(client, candidate.code, candidate, new Set(row?.file_hashes ?? []))
      const { action, patch } = planUpsert({ ...candidate, images }, row)
      if (action === 'insert') {
        const { data, error } = await client.from('products').insert(patch).select(SELECT).single()
        if (error) throw new Error(error.message)
        existing.push(data)
        summary.insertados++
      } else {
        const { data, error } = await client.from('products').update(patch).eq('id', row.id).select(SELECT).single()
        if (error) throw new Error(error.message)
        existing = existing.map((r) => (r.id === row.id ? data : r))
        summary.actualizados++
      }
    } catch (e) {
      summary.fallidos++
      logError(candidate.sourceFiles[0], candidate.sourceKey, 'upsert', e)
    }
  }

  if (dryRun) await writeFile('import-preview.json', JSON.stringify(preview, null, 2))
  await writeFile('import-errors.json', JSON.stringify(errors, null, 2))
  summary.fallidos += errors.filter((e) => e.stage !== 'upsert').length

  console.log('\nResumen')
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(14)} ${v}`)
  console.log(`  tiempo         ${Math.round((Date.now() - started) / 1000)} s`)
  if (dryRun) console.log('  → import-preview.json')
  if (errors.length) console.log('  → import-errors.json')
}

main().catch((e) => {
  console.error(`Error fatal: ${e.message}`)
  process.exit(1)
})
