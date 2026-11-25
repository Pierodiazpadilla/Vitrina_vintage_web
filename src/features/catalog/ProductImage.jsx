// Foto real del producto. Grilla: thumb + srcset con full; detalle: full.
const THUMB_MAX = 480

export function thumbSize(img) {
  const w = Number(img?.w) || 1000
  const h = Number(img?.h) || 1000
  const k = Math.min(1, THUMB_MAX / Math.max(w, h))
  return { w: Math.round(w * k), h: Math.round(h * k) }
}

export default function ProductImage({ image, alt, variant = 'thumb', sizes, className = '', priority = false }) {
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-[var(--color-navy-tint)] text-muted ${className}`}>
        <span className="font-display text-xl" aria-hidden="true">^ ^</span>
        <span className="sr-only">Sin foto</span>
      </div>
    )
  }
  const full = { w: Number(image.w) || 1000, h: Number(image.h) || 1000 }
  const { w, h } = variant === 'thumb' ? thumbSize(image) : full
  const src = variant === 'thumb' ? image.thumb || image.full : image.full || image.thumb
  // Sin `sizes` el navegador asume 100vw y baja la foto grande: solo hay srcset si se indica el ancho.
  const srcSet = sizes && image.thumb && image.full && image.thumb !== image.full
    ? `${image.thumb} ${thumbSize(image).w}w, ${image.full} ${full.w}w`
    : undefined
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={w}
      height={h}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={priority ? 'high' : undefined}
      className={className}
    />
  )
}
