import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { waLink } from '../../shared/whatsapp.js'
import { BRAND, GENERAL_WA_MESSAGE } from '../../shared/brand.js'
import { POLICY_TABS } from './content.js'
import { IconWhatsApp } from '../layout/icons.jsx'

export default function PoliciesPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const tabRefs = useRef([])
  const fromHash = POLICY_TABS.findIndex((t) => `#${t.id}` === hash)
  const active = fromHash >= 0 ? fromHash : 0
  const tab = POLICY_TABS[active]

  useEffect(() => {
    const prev = document.title
    document.title = `Guía de compra y envíos — ${BRAND.name}`
    return () => {
      document.title = prev
    }
  }, [])

  useEffect(() => {
    tabRefs.current[active]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [active])

  const select = (i, focus = false) => {
    navigate({ hash: POLICY_TABS[i].id }, { replace: true })
    if (focus) tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e) => {
    const last = POLICY_TABS.length - 1
    const moves = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }
    if (e.key in moves) {
      e.preventDefault()
      select(moves[e.key], true)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-[26px] leading-tight sm:text-[36px]">GUÍA DE COMPRA Y ENVÍOS</h1>
      <hr className="vv-divider my-4 w-24" />
      <p className="max-w-prose text-[17px] text-muted">
        Cómo entregamos, cómo pagas y qué pasa si algo sale mal. Si tienes una duda que no está aquí, escríbenos.
      </p>

      <div
        role="tablist"
        aria-label="Temas de la guía"
        className="vv-scroll-x -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:px-0"
        onKeyDown={onKeyDown}
      >
        {POLICY_TABS.map((t, i) => {
          const selected = i === active
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el }}
              role="tab"
              id={`tab-${t.id}`}
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={`min-h-[44px] shrink-0 rounded-brand px-3 text-sm font-bold ${
                selected ? 'bg-navy text-card shadow-hard-sm' : 'bg-card text-navy'
              }`}
              style={{ border: 'var(--border-hard)' }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <section
        role="tabpanel"
        id={`panel-${tab.id}`}
        aria-labelledby={`tab-${tab.id}`}
        tabIndex={0}
        className="vv-box mt-3 p-5 sm:p-8"
      >
        <h2 className="font-title text-2xl font-bold">{tab.label}</h2>
        <p className="mt-2 max-w-prose text-[16px] leading-relaxed">{tab.intro}</p>
        <div className="mt-6 space-y-6">
          {tab.blocks.map((b) => (
            <div key={b.title} className="max-w-prose">
              <h3 className="font-title text-lg font-bold">{b.title}</h3>
              {b.text && <p className="mt-1 leading-relaxed text-muted">{b.text}</p>}
              {b.items && (
                <ul className="mt-2 space-y-1.5">
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-2 leading-relaxed text-muted">
                      <span aria-hidden="true" className="mt-[0.55em] h-2 w-2 shrink-0 bg-primary-dark" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <a href={waLink(GENERAL_WA_MESSAGE)} target="_blank" rel="noopener noreferrer" className="vv-btn vv-btn-primary mt-8">
        <IconWhatsApp /> Preguntar por WhatsApp
      </a>
    </div>
  )
}
