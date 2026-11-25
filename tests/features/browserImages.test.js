import { fitWithin, toWebpVariants } from '../../src/features/admin/browserImages.js'

function fakeEnv(width, height) {
  const canvases = []
  return {
    canvases,
    createImageBitmap: async () => ({ width, height, close: vi.fn() }),
    createCanvas: (w, h) => {
      const c = {
        width: w,
        height: h,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (cb, type, quality) => cb({ type, quality, w, h }),
      }
      canvases.push(c)
      return c
    },
  }
}

describe('browserImages', () => {
  it('3000×2000 → full 1200×800 y thumb 480×320 en webp', async () => {
    const env = fakeEnv(3000, 2000)
    const out = await toWebpVariants(new Blob(['x']), env)
    expect([out.w, out.h]).toEqual([1200, 800])
    expect(out.full).toMatchObject({ type: 'image/webp', quality: 0.8, w: 1200, h: 800 })
    expect(out.thumb).toMatchObject({ type: 'image/webp', quality: 0.75, w: 480, h: 320 })
  })

  it('no agranda fotos pequeñas y respeta las verticales', () => {
    expect(fitWithin(400, 300, 1200)).toEqual({ w: 400, h: 300 })
    expect(fitWithin(1000, 2000, 480)).toEqual({ w: 240, h: 480 })
  })
})
