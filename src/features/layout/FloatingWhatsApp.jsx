import { waLink } from '../../shared/whatsapp.js'
import { GENERAL_WA_MESSAGE } from '../../shared/brand.js'
import { IconWhatsApp } from './icons.jsx'

export default function FloatingWhatsApp() {
  return (
    <a
      href={waLink(GENERAL_WA_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="vv-press fixed bottom-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-brand bg-primary-dark text-card lg:bottom-6 lg:right-6"
      style={{ border: 'var(--border-hard)', boxShadow: 'var(--shadow-hard)' }}
    >
      <IconWhatsApp width="30" height="30" />
    </a>
  )
}
