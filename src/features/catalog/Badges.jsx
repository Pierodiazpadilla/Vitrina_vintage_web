// Etiquetas tipo sticker (spec §8 "Tarjeta y badges"). El ámbar se reserva para "Completo"
// y "Últimas unidades" (CLAUDE.md): si aparece en todo deja de comunicar.
export const TAG_LABELS = {
  sellado: 'Sellado',
  'set-a-pegar': 'Set a pegar',
  completo: 'Completo',
  incompleto: 'Incompleto',
  'tapa-dura': 'Tapa dura',
  'tapa-blanda': 'Tapa blanda',
  vacio: 'Álbum vacío',
  combo: 'Combo',
  sobres: 'Sobres',
}

const TAG_ORDER = ['sellado', 'completo', 'set-a-pegar', 'incompleto', 'tapa-dura', 'tapa-blanda', 'vacio', 'combo', 'sobres']
const TILTS = ['-1.5deg', '1deg', '-0.5deg', '1.5deg', '-1deg', '0.5deg']

export function Sticker({ children, tone = 'plain', mono = false, tilt = 0, className = '' }) {
  const toneClass = { plain: '', cyan: 'vv-sticker-cyan', navy: 'vv-sticker-navy', warm: 'vv-sticker-warm' }[tone]
  return (
    <span
      className={`vv-sticker ${toneClass} ${mono ? 'vv-sticker-mono' : ''} ${className}`}
      style={{ transform: `rotate(${TILTS[tilt % TILTS.length]})` }}
    >
      {children}
    </span>
  )
}

/** Stickers que van sobre la foto: estado comercial. */
export function OverlayBadges({ product }) {
  const items = []
  if (product.status === 'sold') items.push(<Sticker key="sold" tone="navy">Vendido</Sticker>)
  if (product.is_preorder) items.push(<Sticker key="pre" tone="cyan">Preventa</Sticker>)
  if (Number(product.discount_percent) > 0) {
    items.push(<Sticker key="off" tone="navy" mono>-{Number(product.discount_percent)}%</Sticker>)
  }
  if (!items.length) return null
  return <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5">{items}</div>
}

/** Estado del álbum siempre visible: licencia, estado y datos técnicos. */
export default function Badges({ product, limit = 3, withMeta = true }) {
  const tags = TAG_ORDER.filter((t) => (product.tags ?? []).includes(t)).slice(0, limit)
  let i = 0
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Características">
      {product.is_original === true && <li><Sticker tilt={i++}>Original</Sticker></li>}
      {product.is_original === false && <li><Sticker tilt={i++} className="border-dashed">Réplica</Sticker></li>}
      {tags.map((t) => (
        <li key={t}><Sticker tilt={i++} tone={t === 'completo' ? 'warm' : 'plain'}>{TAG_LABELS[t]}</Sticker></li>
      ))}
      {product.era === 'retro' && !tags.length && <li><Sticker tilt={i++}>Retro</Sticker></li>}
      {withMeta && product.editorial && <li><Sticker tilt={i++} mono>{product.editorial}</Sticker></li>}
      {withMeta && product.year && <li><Sticker tilt={i++} mono>{product.year}</Sticker></li>}
    </ul>
  )
}
