// Conversión a webp y MD5 en el navegador (canvas + spark-md5). Solo se carga en el panel.
import SparkMD5 from 'spark-md5'

export const FULL_MAX = 1200
export const THUMB_MAX = 480

/** Tamaño que entra en un cuadrado de `max` sin agrandar. */
export function fitWithin(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h))
  return { w: Math.round(w * k), h: Math.round(h * k) }
}

const toBlob = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('El navegador no pudo crear el webp'))), 'image/webp', quality)
  })

/**
 * @param {Blob} file
 * @param {{ createImageBitmap?: Function, createCanvas?: (w, h) => HTMLCanvasElement }} env  inyectable en pruebas
 */
export async function toWebpVariants(file, env = {}) {
  const decode = env.createImageBitmap ?? ((f) => createImageBitmap(f, { imageOrientation: 'from-image' }))
  const makeCanvas = env.createCanvas ?? ((w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }))
  const bitmap = await decode(file)
  const render = async (max, quality) => {
    const size = fitWithin(bitmap.width, bitmap.height, max)
    const canvas = makeCanvas(size.w, size.h)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, size.w, size.h)
    return { blob: await toBlob(canvas, quality), ...size }
  }
  const full = await render(FULL_MAX, 0.8)
  const thumb = await render(THUMB_MAX, 0.75)
  bitmap.close?.()
  return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h }
}

export async function md5OfFile(file) {
  const buffer = await file.arrayBuffer()
  return SparkMD5.ArrayBuffer.hash(buffer)
}
