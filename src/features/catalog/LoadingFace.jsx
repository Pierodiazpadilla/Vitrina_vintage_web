/** La carita de la consola como estado de carga. */
export default function LoadingFace({ label = 'Cargando' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-2 py-16 text-navy">
      <span className="font-display text-3xl" aria-hidden="true">
        ^<span className="vv-blink">_</span>^
      </span>
      <span className="text-sm text-muted">{label}…</span>
    </div>
  )
}
