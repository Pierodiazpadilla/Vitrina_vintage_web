import { useId } from 'react'
import { unitPrice } from '../../shared/pricing.js'
import { money } from '../catalog/productActions.js'

export default function VariantPicker({ product, value, onChange }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 font-title text-base font-bold">Elige la versión</legend>
      <div className="flex flex-wrap gap-2">
        {product.variants.map((v) => {
          const checked = value === v.label
          const price = unitPrice(product, v.label)
          return (
            <label
              key={v.label}
              className={`vv-press flex min-h-[48px] cursor-pointer items-center gap-2 rounded-brand px-3 ${
                checked ? 'bg-navy text-card shadow-hard-sm' : 'bg-card text-navy'
              } has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[var(--color-primary)]`}
              style={{ border: 'var(--border-hard)' }}
            >
              <input
                type="radio"
                name={name}
                value={v.label}
                checked={checked}
                onChange={() => onChange(v.label)}
                className="sr-only"
              />
              <span className="font-bold">{v.label}</span>
              {price != null && <span className="font-mono text-sm">{money(price)}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
