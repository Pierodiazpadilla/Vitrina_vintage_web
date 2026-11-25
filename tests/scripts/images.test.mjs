// @vitest-environment node
import sharp from 'sharp'
import { ocrStrips, webpVariants } from '../../scripts/lib/images.mjs'

const square = () => sharp({ create: { width: 1000, height: 1000, channels: 3, background: { r: 23, g: 152, b: 183 } } }).jpeg().toBuffer()

describe('images', () => {
  it('ocrStrips: franjas de 25 % arriba y abajo, ×2 y en gris', async () => {
    const { top, bottom } = await ocrStrips(await square())
    for (const strip of [top, bottom]) {
      const m = await sharp(strip).metadata()
      expect([m.width, m.height]).toEqual([2000, 500])
      expect(m.channels).toBeLessThanOrEqual(2)
    }
  })

  it('webpVariants: full 1200 y thumb 480, en webp', async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#ffffff' } }).jpeg().toBuffer()
    const { full, thumb, w, h } = await webpVariants(big)
    const mf = await sharp(full).metadata()
    const mt = await sharp(thumb).metadata()
    expect([mf.format, mf.width, mf.height]).toEqual(['webp', 1200, 800])
    expect([mt.format, mt.width, mt.height]).toEqual(['webp', 480, 320])
    expect([w, h]).toEqual([1200, 800])
  })

  it('no agranda fotos pequeñas', async () => {
    const { w } = await webpVariants(await sharp({ create: { width: 600, height: 400, channels: 3, background: '#000' } }).png().toBuffer())
    expect(w).toBe(600)
  })
})
