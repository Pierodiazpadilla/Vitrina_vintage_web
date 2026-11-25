// Normaliza texto para comparar: sin tildes (también en NFD), minúsculas, espacios colapsados.
export function normalizeText(value) {
  if (value == null) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
