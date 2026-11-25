// Confianza y preguntas frecuentes, con el contenido real de las políticas.
import { Link } from 'react-router-dom'
import { BRAND } from '../../shared/brand.js'

const PROMISES = [
  {
    title: 'Originales, y te decimos cuándo no',
    body: 'La mayoría de lo que vendemos es original. Si algo es réplica o reimpresión, lleva la etiqueta Réplica y lo dice la publicación.',
    href: '/politicas#garantia',
  },
  {
    title: `Reclamos dentro de ${BRAND.claimDays} días`,
    body: `Revisamos cada colección antes de entregarla. Tienes ${BRAND.claimDays} días calendario desde la entrega o el envío para reclamar.`,
    href: '/politicas#garantia',
  },
  {
    title: 'Envíos a todo el Perú y al extranjero',
    body: 'Entrega gratis en puntos de Lima, Olva o Shalom a provincias y DHL al extranjero.',
    href: '/politicas#envios-peru',
  },
  {
    title: 'Preventas con reglas claras',
    body: 'Se separan con el pago total. Si el fabricante la cancela o cambia, eliges reembolso total o cambio por otro producto.',
    href: '/politicas#preventas',
  },
]

const FAQ = [
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Agrega lo que quieras a tu lista, elige entrega y pago, y envíala por WhatsApp. Te confirmamos disponibilidad y el costo de envío.',
  },
  {
    q: '¿Qué medios de pago aceptan?',
    a: 'En Perú: Yape, Plin, transferencia (BCP, BBVA, Interbank, Scotiabank), efectivo solo en entregas gratuitas en Lima y tarjeta con link de Mercado Pago (+7 %). Desde el extranjero: Western Union, MoneyGram o PayPal ($10 USD fijos + 8 % aprox. en América).',
  },
  {
    q: '¿Hacen envíos a provincia?',
    a: 'Sí, con Olva Courier (agencia o domicilio; producto y envío se pagan antes) o Shalom (solo agencia; el envío se paga al recoger).',
  },
  {
    q: '¿Los sobres y paquetones vienen manipulados?',
    a: 'Nunca se abren ni se manipulan. Lo que salga en ellos es azar: no respondemos por repetidas, especiales o si completas la colección.',
  },
  {
    q: '¿Puedo cancelar una separación?',
    a: 'Si no dejaste adelanto, avísanos el mismo día. Con depósito, el producto se retira de la venta y el adelanto no se devuelve.',
  },
]

export default function TrustSection() {
  return (
    <section aria-labelledby="compra-segura" className="mx-auto max-w-6xl px-4 py-10">
      <h2 id="compra-segura" className="vv-section-title">COMPRA SEGURA</h2>
      <hr className="vv-divider mb-6 mt-3" />
      {/* Una sola vitrina dividida en compartimentos, no cuatro tarjetas iguales */}
      <ul className="vv-box grid overflow-hidden sm:grid-cols-2">
        {PROMISES.map((p, i) => (
          <li
            key={p.title}
            className={`border-navy p-5 ${i > 0 ? "border-t-2" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l-2" : ""}`}
          >
            <h3 className="font-title text-lg font-bold leading-snug">{p.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">{p.body}</p>
            <Link to={p.href} className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-primary-dark underline underline-offset-4">
              Leer la política
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="font-title text-2xl font-bold">Preguntas frecuentes</h2>
          <p className="mt-2 text-muted">Lo que más nos preguntan por WhatsApp.</p>
          <Link to="/politicas" className="vv-btn vv-btn-ghost mt-4">Guía completa de compra y envíos</Link>
        </div>
        <div>
          {FAQ.map((item) => (
            <details key={item.q} className="group" style={{ borderTop: 'var(--border-hard)' }}>
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-title text-[17px] font-semibold">
                {item.q}
                <span aria-hidden="true" className="font-mono text-xl group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-prose pb-4 text-[15px] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
