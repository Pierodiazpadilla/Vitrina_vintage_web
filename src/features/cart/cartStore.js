// Lista de pedido (spec §9): líneas { code, variant, qty } persistidas en localStorage,
// topadas al stock y revalidadas contra el catálogo actual antes de armar el mensaje.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { safeStorage } from '../../lib/storage.js'
import { isPriceOnRequest, maxQty, unitPrice } from '../../shared/pricing.js'

export const CART_KEY = 'vv:cart:v1'

const sameLine = (l, code, variant) => l.code === code && (l.variant ?? null) === (variant ?? null)

function isValidLine(l) {
  return (
    l != null && typeof l === 'object' && typeof l.code === 'string' && l.code !== '' &&
    (l.variant == null || typeof l.variant === 'string') &&
    Number.isInteger(l.qty) && l.qty > 0
  )
}

function loadLines() {
  const saved = safeStorage.get(CART_KEY, [])
  if (!Array.isArray(saved)) return []
  return saved.filter(isValidLine).map((l) => ({ code: l.code, variant: l.variant ?? null, qty: l.qty }))
}

function reducer(lines, action) {
  switch (action.type) {
    case 'set': {
      const { code, variant, qty } = action
      if (qty <= 0) return lines.filter((l) => !sameLine(l, code, variant))
      if (lines.some((l) => sameLine(l, code, variant))) {
        return lines.map((l) => (sameLine(l, code, variant) ? { ...l, qty } : l))
      }
      return [...lines, { code, variant: variant ?? null, qty }]
    }
    case 'replace':
      return action.lines
    default:
      return lines
  }
}

/** Revisa cada línea contra el catálogo actual. Pura: devuelve las líneas válidas y los avisos. */
export function revalidateLines(lines, products) {
  const byCode = new Map(products.map((p) => [p.code, p]))
  const kept = []
  const notices = []
  for (const line of lines) {
    const p = byCode.get(line.code)
    if (!p || p.status === 'hidden') {
      notices.push(`${line.code} ya no está disponible`)
      continue
    }
    if (p.status === 'sold') {
      notices.push(`${line.code} ya fue vendido`)
      continue
    }
    if (isPriceOnRequest(p)) {
      notices.push(`${line.code} ya no tiene precio publicado; consúltalo por WhatsApp`)
      continue
    }
    if (unitPrice(p, line.variant) == null) {
      notices.push(line.variant
        ? `${line.code}: la versión «${line.variant}» ya no está disponible`
        : `${line.code} ya no tiene precio publicado`)
      continue
    }
    const max = maxQty(p)
    if (max <= 0) {
      notices.push(`${line.code} ya fue vendido`)
      continue
    }
    if (line.qty > max) {
      notices.push(`${line.code}: solo quedan ${max}, ajustamos tu cantidad`)
      kept.push({ ...line, qty: max })
      continue
    }
    kept.push(line)
  }
  return { lines: kept, notices }
}

const CartContext = createContext(null)

export function CartProvider({ products = [], children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, loadLines)
  const [panelOpen, setPanelOpen] = useState(false)
  const linesRef = useRef(lines)
  linesRef.current = lines
  const productsRef = useRef(products)
  productsRef.current = products

  useEffect(() => {
    safeStorage.set(CART_KEY, lines)
  }, [lines])

  const add = useCallback((product, variant = null) => {
    if (!product || isPriceOnRequest(product)) return false
    if (unitPrice(product, variant) == null) return false
    const max = maxQty(product)
    const current = linesRef.current.find((l) => sameLine(l, product.code, variant))?.qty ?? 0
    if (max <= 0 || current >= max) return current > 0
    const qty = current + 1
    linesRef.current = reducer(linesRef.current, { type: 'set', code: product.code, variant, qty })
    dispatch({ type: 'set', code: product.code, variant, qty })
    return true
  }, [])

  const setQty = useCallback((code, variant, qty) => {
    const product = productsRef.current.find((p) => p.code === code)
    const current = linesRef.current.find((l) => sameLine(l, code, variant))?.qty ?? 0
    const max = product ? maxQty(product) : current
    const next = Math.max(0, Math.min(Math.floor(Number(qty) || 0), max))
    linesRef.current = reducer(linesRef.current, { type: 'set', code, variant, qty: next })
    dispatch({ type: 'set', code, variant, qty: next })
  }, [])

  const remove = useCallback((code, variant = null) => setQty(code, variant, 0), [setQty])

  const clear = useCallback(() => {
    linesRef.current = []
    dispatch({ type: 'replace', lines: [] })
  }, [])

  const revalidate = useCallback((currentProducts) => {
    const result = revalidateLines(linesRef.current, currentProducts)
    linesRef.current = result.lines
    dispatch({ type: 'replace', lines: result.lines })
    return result
  }, [])

  const value = useMemo(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    add,
    remove,
    setQty,
    clear,
    revalidate,
    panelOpen,
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
  }), [lines, add, remove, setQty, clear, revalidate, panelOpen])

  return createElement(CartContext.Provider, { value }, children)
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
