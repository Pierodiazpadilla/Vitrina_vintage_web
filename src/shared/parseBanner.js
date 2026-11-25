// Interpreta el texto OCR del banner de una foto del catálogo. Spec §6 parseBanner.
// Lo usan el importador (Node) y /admin (navegador): JS puro, sin dependencias.
import { normalizeText } from './text.js'
import { licenseFromText } from './catalogRules.js'

/** Separa el texto de la franja superior del de la inferior. */
export const STRIP_SEPARATOR = '\n=====\n'

export const EDITORIALS = [
  'Navarrete', 'Panini', 'Salo', 'Cromy', 'Pacosa', 'Bandai', 'Upper Deck', 'Topps', 'Merlin',
  '3 Reyes', 'Kame House', 'Elite', 'Sabritas',
]

const MIN_CONFIDENCE = 70
const TITLE_MAX = 90

// ───────────────────────── limpieza ─────────────────────────

const LEGAL_MARKERS = [
  'solo se aceptan', 'reclamos', 'no nos hacemos responsables', 'coleccion revisada',
  'entrega o envio', 'hueco de polilla', 'tal cual indica',
]

/** Índice (en el texto original) donde empieza el aviso legal, o -1. */
function legalIndex(line) {
  // normalizeText conserva la longitud solo sin tildes combinadas; buscamos sobre una versión 1:1
  const plain = line.normalize('NFC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  let best = -1
  for (const marker of LEGAL_MARKERS) {
    const i = plain.indexOf(marker)
    if (i !== -1 && (best === -1 || i < best)) best = i
  }
  if (best === -1) return -1
  // traducir el índice de `plain` a `line` (NFC): contar caracteres base
  const nfc = line.normalize('NFC')
  let base = 0
  for (let k = 0; k < nfc.length; k++) {
    if (base === best) return k
    base += nfc[k].normalize('NFD').replace(/[̀-ͯ]/g, '').length
  }
  return nfc.length
}

/** Quita el aviso legal (y todo lo que viene después) de una franja. */
export function cleanBanner(text) {
  const out = []
  for (const raw of String(text ?? '').normalize('NFC').split(/\r?\n/)) {
    const i = legalIndex(raw)
    if (i === -1) {
      out.push(raw)
      continue
    }
    const before = raw.slice(0, i).trim()
    if (before) out.push(before)
    break
  }
  return out.join('\n').trim()
}

// ───────────────────────── bloque del banner ─────────────────────────

const SIGNALS = [
  /\d\s*soles?\b/i, /s\/\.?\s*\d/i, /\bc[o0]d\b\.?/i, /\beditorial\b/i, /\ba[nñ]o\s*[:/]?\s*(19|20)\d\d/i,
  /[aá]lbum/i, /set completo/i, /colecci[oó]n/i, /\boriginal/i, /licenciad/i, /r[eé]plica/i,
  /navarrete/i, /panini/i, /\bincluye\b/i, /tapa\s*(dura|blanda)/i,
]

const SHORT_WORDS = new Set(['a', 'y', 'de', 'la', 'el', 'en', 'con', 'por', 'del', 'los', 'las', 'al', 'un', 'su', 'sin'])
const STRONG_SIGNAL = /\d\s*soles?\b|s\/\.?\s*\d|\bc[o0]d\b/i
const OPEN_END = /(\(?c[o0]d\.?|[+,(-])\s*$/i
const VOWEL = /[aeiouáéíóúAEIOUÁÉÍÓÚ]/

function isRealToken(core) {
  if (SHORT_WORDS.has(core.toLowerCase())) return true
  if (/^\p{L}{3,}$/u.test(core) && VOWEL.test(core)) return true
  if (/\d/.test(core) && core.replace(/[^\p{L}\d]/gu, '').length >= 2) return true
  return /^\p{L}+[\p{L}'.-]*\p{L}+$/u.test(core) && core.length >= 3 && VOWEL.test(core)
}

function realRatio(line) {
  const cores = line
    .split(/\s+/)
    .map((t) => t.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, ''))
    .filter(Boolean)
  if (cores.length < 2) return 0
  return cores.filter(isRealToken).length / cores.length
}

/**
 * Línea legible: ≥ 70 % de "palabras reales"; basta ≥ 50 % si trae precio/código
 * o si continúa una línea que quedó abierta ("(Cod.", "+", ",").
 */
function isTextLike(line, previous) {
  const ratio = realRatio(line)
  if (ratio >= 0.7) return true
  const relaxed = STRONG_SIGNAL.test(line) || (previous != null && OPEN_END.test(previous))
  return relaxed && ratio >= 0.5
}

function signalScore(text) {
  return SIGNALS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0)
}

// Ruido típico al inicio: símbolos o letras sueltas ("E [Álbum…", "Z licenciados") salvo "a"/"y".
const LEADING_NOISE = /^(?:[^\p{L}\d(¡+\s]+\s*|(?![aAyY]\s)\p{L}\s+(?=\S))+/u

function tidyLine(line) {
  return line
    .replace(LEADING_NOISE, '')
    .replace(/^[^\p{L}\d(¡+]+/u, '')
    .replace(/(\s+[^\s\p{Ll}])+$/u, '')
    .trim()
}

/** Bloque contiguo de líneas legibles con más señales de banner. */
function bannerBlock(section) {
  // "|" en la salida de tesseract es un corte de columna: se trata como salto de línea
  const lines = cleanBanner(section)
    .split(/\n|\|/)
    .map((l) => l.trim())
    .filter(Boolean)
  const blocks = []
  let current = []
  const close = () => {
    // descarta líneas iniciales aceptadas solo por la regla relajada si luego hay una línea clara
    const firstStrict = current.findIndex((l) => l.strict)
    const kept = firstStrict > 0 ? current.slice(firstStrict) : current
    if (kept.length) blocks.push(kept.map((l) => l.text))
    current = []
  }
  for (const line of lines) {
    if (isTextLike(line, current.at(-1)?.text)) {
      current.push({ text: tidyLine(line), strict: realRatio(line) >= 0.7 })
    } else if (current.length) close()
  }
  if (current.length) close()
  // dentro de cada bloque, las líneas iniciales sin ninguna señal son ruido de la imagen
  for (let i = 0; i < blocks.length; i++) {
    const firstWithSignal = blocks[i].findIndex((l) => signalScore(l) > 0)
    if (firstWithSignal > 0) blocks[i] = blocks[i].slice(firstWithSignal)
  }
  let best = null
  let bestScore = 0
  for (const block of blocks) {
    const text = block.join(' ')
    const score = signalScore(text)
    if (score > bestScore) {
      best = text
      bestScore = score
    }
  }
  return best ? best.replace(/\s+/g, ' ').trim() : ''
}

// ───────────────────────── campos ─────────────────────────

const PRICE_RE = /(\d{1,3}(?:[.,]\d{3})+|\d{1,5})(?:[.,](\d{1,2}))?\s*soles?\b/gi
const PRICE_PEN_RE = /s\/\.?\s*(\d{1,5})(?:[.,](\d{1,2}))?/gi

function toNumber(intPart, dec) {
  const n = Number(String(intPart).replace(/[.,]/g, '') + (dec ? '.' + dec : ''))
  return Number.isFinite(n) ? n : null
}

function findPrices(text) {
  const found = []
  for (const re of [PRICE_RE, PRICE_PEN_RE]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const value = toNumber(m[1], m[2])
      if (value != null && value > 0) found.push({ value, index: m.index, match: m[0] })
    }
  }
  return found.sort((a, b) => a.index - b.index)
}

function variantLabel(text, index) {
  const before = text.slice(0, index)
  const segment = before.split(/[.;]|\s-\s/).pop() ?? ''
  const cleaned = segment
    .replace(/\b(versi[oó]n|a|por|de)\s*$/i, '')
    .replace(/^\s*(versi[oó]n)\s+/i, '')
    .replace(/\b(a|por)\s*$/i, '')
    .trim()
  if (!cleaned) return null
  const lower = cleaned.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function fixCodeDigits(s) {
  return s.replace(/[oO]/g, '0').replace(/[lI]/g, '1')
}

function findCode(text) {
  const withLetters = text.match(/c[o0]d\.?\s*:?\s*([a-z]{2})\s*-?\s*([0-9oOlI]{3,5})\b/i)
  if (withLetters) return { code: withLetters[1].toUpperCase() + fixCodeDigits(withLetters[2]), match: withLetters[0], suspicious: false }
  const numeric = text.match(/c[o0]d\.?\s*:?\s*(\d{3,5})\b/i)
  if (numeric) return { code: null, match: numeric[0], suspicious: true }
  return { code: null, match: null, suspicious: false }
}

function findYear(text) {
  const explicit = text.match(/a[nñ]o\s*[:/]?\s*((?:19|20)\d{2})/i)
  if (explicit) return Number(explicit[1])
  const candidates = [...text.matchAll(/(?<![\w/])((?:19|20)\d{2})(?![\w/])/g)].map((m) => Number(m[1]))
  const unique = [...new Set(candidates)]
  return unique.length === 1 ? unique[0] : null
}

function findEditorial(text) {
  const norm = normalizeText(text)
  for (const name of EDITORIALS) {
    if (new RegExp(`(^|[^\\p{L}\\d])${normalizeText(name)}([^\\p{L}\\d]|$)`, 'u').test(norm)) return name
  }
  const generic = text.match(/editorial\s+([\p{L}\d][\p{L}\d ]{1,20}?)(?=\s*[,.;)(]|\s+(?:licenciad|original|año|idioma)|$)/iu)
  if (!generic) return null
  return generic[1].trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

function findTags(text) {
  const t = normalizeText(text)
  const tags = []
  if (/\bsellad[oa]s?\b/.test(t)) tags.push('sellado')
  if (/\ba pegar\b/.test(t)) tags.push('set-a-pegar')
  if (/\b(set|coleccion) complet[oa]\b|\bcomplet[oa] \(|\(\d+\/\d+\)/.test(t)) tags.push('completo')
  if (/\bincomplet[oa]\b/.test(t)) tags.push('incompleto')
  if (/tapa\s*dura/.test(t)) tags.push('tapa-dura')
  if (/tapa\s*blanda/.test(t)) tags.push('tapa-blanda')
  if (/\bvaci[oa]\b/.test(t)) tags.push('vacio')
  if (/\bsobres?\b|\bpaqueton(es)?\b/.test(t)) tags.push('sobres')
  if (/\+[^+]*(\bsobres?\b|paqueton|binder|coleccionador|armables?)/.test(t) || /\bpack\b/.test(t)) tags.push('combo')
  return tags
}

const CONDITIONS = [
  [/\bsellad[oa]s?\b/, 'Sellado'],
  [/set complet[oa] a pegar|\ba pegar\b/, 'Set completo a pegar'],
  [/\b(album|álbum) vaci[oa]\b|\bvaci[oa]\b/, 'Álbum vacío'],
  [/\bcoleccion complet[oa]\b|\bset complet[oa]\b/, 'Colección completa'],
  [/\bincomplet[oa]\b/, 'Incompleto'],
  [/\llen[oa]\b/, 'Lleno'],
]

function findCondition(text) {
  const t = normalizeText(text)
  for (const [re, label] of CONDITIONS) if (re.test(t)) return label
  return null
}

function cutTitle(s) {
  if (s.length <= TITLE_MAX) return s
  const cut = s.slice(0, TITLE_MAX + 1)
  const space = cut.lastIndexOf(' ')
  return (space > 40 ? cut.slice(0, space) : cut.slice(0, TITLE_MAX)).replace(/[\s,;:-]+$/, '')
}

const TRIM_PUNCT = /^[\s,.;:/\-–—|]+|[\s,.;:/\-–—|(]+$/g

function titleAndExtras(text, { prices, codeMatch, editorial }) {
  let rest = text
  for (const p of prices) rest = rest.replace(p.match, ' ')
  if (codeMatch) rest = rest.replace(codeMatch, ' ')
  rest = rest
    .replace(/\(\s*\)/g, ' ')
    .replace(/\b(versi[oó]n|cada uno|por)\b\s*(?=[,.\-]|$)/gi, ' ')
    .replace(/\ba[nñ]o\s*[:/]?\s*(19|20)\d{2}/gi, ' ')
  if (editorial) {
    const ed = editorial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    rest = rest
      .replace(new RegExp(`(editorial\\s+)?${ed}(\\s+(original(es)?|licenciad[oa]s?))?`, 'gi'), ' ')
  }
  rest = rest
    .replace(/\s+/g, ' ')
    .replace(/\s+[-–—/]\s*(?=[,.])/g, '')
    .replace(/\s+([,.])/g, '$1')
    .replace(/([,.])[,.]+/g, '$1')
    .replace(TRIM_PUNCT, '')
  // primera oración con contenido real (≥ 3 letras)
  const sentences = rest.split(/\.\s+(?=[\p{Lu}¡])/u)
  const firstSentence = sentences.find((s) => (s.match(/\p{L}/gu) ?? []).length >= 3) ?? sentences[0]
  const plus = firstSentence.indexOf('+')
  const rawTitle = (plus > 0 ? firstSentence.slice(0, plus) : firstSentence)
    .replace(/\s[-–]\s.*$/, '')
    .replace(TRIM_PUNCT, '')
  const title = rawTitle.length >= 3 ? cutTitle(rawTitle) : null
  const consumed = plus > 0 ? firstSentence.slice(0, plus) : firstSentence
  const extras = rest.slice(rest.indexOf(consumed) + consumed.length).replace(TRIM_PUNCT, '').replace(/^\+\s*/, '')
  return { title, extras: extras.length >= 3 ? extras : null }
}

// ───────────────────────── API ─────────────────────────

/**
 * @param {string} text  OCR de la franja superior y la inferior (separadas por STRIP_SEPARATOR).
 * @param {{ confidence?: number }} [opts]
 */
export function parseBanner(text, opts = {}) {
  const sections = String(text ?? '').split(STRIP_SEPARATOR)
  const blocks = sections.map(bannerBlock).filter(Boolean)
  const banner =
    blocks.find((b) => findPrices(b).length || findCode(b).code) ?? blocks[0] ?? ''

  const prices = findPrices(banner)
  const distinct = [...new Map(prices.map((p) => [p.value, p])).values()]
  const variants =
    distinct.length > 1
      ? distinct.map((p, i) => ({ label: variantLabel(banner, p.index) ?? `Opción ${i + 1}`, price: p.value }))
      : []
  const price = distinct.length ? Math.min(...distinct.map((p) => p.value)) : null

  const { code, match: codeMatch, suspicious } = findCode(banner)
  const editorial = banner ? findEditorial(banner) : null
  const { title, extras } = banner ? titleAndExtras(banner, { prices, codeMatch, editorial }) : { title: null, extras: null }

  const warnings = []
  if (price == null) warnings.push('price_missing')
  if (!code) warnings.push('code_missing')
  if (suspicious) warnings.push('code_suspicious')
  if (!title) warnings.push('title_missing')
  if (variants.length) warnings.push('multiple_prices')
  if (opts.confidence != null && opts.confidence < MIN_CONFIDENCE) warnings.push('low_confidence')

  return {
    price,
    variants,
    title,
    condition: banner ? findCondition(banner) : null,
    tags: banner ? findTags(banner) : [],
    editorial,
    year: banner ? findYear(banner) : null,
    code,
    extras,
    isOriginalHint: banner ? licenseFromText(banner) : null,
    warnings,
  }
}
