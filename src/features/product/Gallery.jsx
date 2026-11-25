import { useRef, useState } from 'react'
import ProductImage from '../catalog/ProductImage.jsx'
import { IconArrow } from '../layout/icons.jsx'

export default function Gallery({ images = [], title, children }) {
  const [index, setIndex] = useState(0)
  const touch = useRef(null)
  const count = images.length
  const go = (delta) => setIndex((i) => (i + delta + count) % count)
  const current = images[Math.min(index, Math.max(0, count - 1))]

  return (
    <div>
      <div
        className="vv-box relative overflow-hidden"
        aria-roledescription="galería"
        aria-label={`Fotos de ${title}`}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touch.current == null || count < 2) return
          const dx = e.changedTouches[0].clientX - touch.current
          touch.current = null
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        }}
      >
        <ProductImage
          key={current?.full ?? 'none'}
          image={current}
          alt={count > 1 ? `${title}, foto ${index + 1} de ${count}` : title}
          variant="full"
          priority
          className="aspect-square w-full bg-card object-contain"
        />
        {children}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="vv-btn vv-btn-ghost absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 p-0">
              <IconArrow dir="left" width="18" height="18" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="vv-btn vv-btn-ghost absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 p-0">
              <IconArrow dir="right" width="18" height="18" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-[3px] bg-navy px-2 py-1 font-mono text-xs text-card" aria-live="polite">
              {index + 1}/{count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="mt-3 flex gap-2" aria-label="Elegir foto">
          {images.map((img, i) => (
            <li key={img.full ?? i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={i === index}
                className={`block h-16 w-16 overflow-hidden rounded-brand bg-card ${i === index ? 'shadow-hard-sm' : 'opacity-60'}`}
                style={{ border: 'var(--border-hard)' }}
              >
                <ProductImage image={img} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
