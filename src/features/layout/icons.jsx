// Íconos inline de trazo grueso (sin dependencias). currentColor hereda el color del texto.
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, focusable: 'false' }

export function IconSearch(props) {
  return (
    <svg {...base} {...props} stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  )
}

/** Bolsa/lista de pedido con esquinas cuadradas, en el lenguaje de la consola. */
export function IconBag(props) {
  return (
    <svg {...base} {...props} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="miter">
      <path d="M4 8h16l-1.2 12H5.2z" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
    </svg>
  )
}

export function IconWhatsApp(props) {
  return (
    <svg {...base} {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg {...base} {...props} stroke="currentColor" strokeWidth="3" strokeLinecap="square">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconArrow({ dir = 'right', ...props }) {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir]
  return (
    <svg {...base} {...props} style={{ transform: `rotate(${rot}deg)` }} fill="currentColor">
      {/* flecha pixelada */}
      <path d="M8 4h3v3h3v3h3v4h-3v3h-3v3H8v-4h3v-2h3v-4h-3V8H8z" />
    </svg>
  )
}

export function IconFilter(props) {
  return (
    <svg {...base} {...props} stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props} stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
      <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
    </svg>
  )
}
