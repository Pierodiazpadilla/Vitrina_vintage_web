import { Link } from 'react-router-dom'
import { BRAND, GENERAL_WA_MESSAGE, SOCIAL_LINKS } from '../../shared/brand.js'
import { waLink, WHATSAPP_NUMBER } from '../../shared/whatsapp.js'
import { IconWhatsApp } from './icons.jsx'

const prettyPhone = (n) => `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`

export default function Footer() {
  const linked = SOCIAL_LINKS.filter((s) => s.url)
  const unlinked = SOCIAL_LINKS.filter((s) => !s.url).map((s) => s.label)

  return (
    <footer className="mt-16 bg-card pb-28 lg:pb-10" style={{ borderTop: 'var(--divider)' }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <img src={BRAND.logo} alt="Vitrina Vintage" width="460" height="182" loading="lazy" className="h-16 w-auto" />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Álbumes, sets a pegar, cards y sobres de colección. Si algo es réplica, lo decimos en la publicación.
          </p>
        </div>

        <div>
          <h2 className="font-title text-lg font-bold">Compra con calma</h2>
          <ul className="mt-2 space-y-1 text-[15px]">
            <li><Link className="inline-block py-2 font-bold text-primary-dark underline-offset-4 hover:underline" to="/politicas">Guía de compra y envíos</Link></li>
            <li><Link className="inline-block py-2 text-navy underline-offset-4 hover:underline" to="/politicas#preventas">Cómo funcionan las preventas</Link></li>
            <li><Link className="inline-block py-2 text-navy underline-offset-4 hover:underline" to="/politicas#garantia">Reclamos dentro de {BRAND.claimDays} días</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-title text-lg font-bold">Escríbenos</h2>
          <a
            href={waLink(GENERAL_WA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="vv-btn vv-btn-primary mt-3"
          >
            <IconWhatsApp /> <span className="font-mono">{prettyPhone(WHATSAPP_NUMBER)}</span>
          </a>
          {linked.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {linked.map((s) => (
                <li key={s.id}>
                  <a className="vv-btn vv-btn-ghost" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                </li>
              ))}
            </ul>
          )}
          {unlinked.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              Búscanos como Vitrina Vintage en {unlinked.join(', ').replace(/, ([^,]*)$/, ' y $1')}: ahí están las calificaciones de compradores.
            </p>
          )}
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 font-display text-xs text-muted">
        © {new Date().getFullYear()} VITRINA VINTAGE · COLECCIONISTAS COMO TÚ
      </p>
    </footer>
  )
}
