// Atajos de la revisión rápida (spec §10):
//   Ctrl/⌘+Enter (en cualquier lado) o Enter en un campo de una línea → aprobar y siguiente
//   Fuera de campos: S / → saltar · ← anterior · H ocultar · 1–9 foto
// Con el foco en un textarea o select las letras escriben y no disparan nada.
import { useEffect, useRef } from 'react'

const SINGLE_LINE = new Set(['text', 'number', 'search', 'url', 'email', 'tel', ''])

function isTyping(el) {
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useReviewShortcuts(handlers, { enabled = true } = {}) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      const h = ref.current
      const target = e.target
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        h.onApprove?.()
        return
      }
      if (e.key === 'Enter' && target?.tagName === 'INPUT' && SINGLE_LINE.has(target.type ?? '')) {
        e.preventDefault()
        h.onApprove?.()
        return
      }
      if (isTyping(target) || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === 's' || key === 'ArrowRight') h.onSkip?.()
      else if (key === 'ArrowLeft') h.onPrev?.()
      else if (key === 'h') h.onHide?.()
      else if (/^[1-9]$/.test(key)) h.onPhoto?.(Number(key) - 1)
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])
}
