// OCR en el navegador: tesseract.js se carga con import() dinámico (chunk propio, solo en /admin/nuevo).
import { STRIP_SEPARATOR } from '../../shared/parseBanner.js'

let workerPromise = null

async function getWorker(onProgress) {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) =>
      createWorker('spa', 1, { logger: (m) => m.status === 'recognizing text' && onProgress?.(m.progress) }),
    )
  }
  return workerPromise
}

/** Franja superior e inferior (25 %), ×2, en gris: donde vive el banner con precio y código. */
async function strips(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const stripH = Math.max(1, Math.round(bitmap.height * 0.25))
  const make = async (sy) => {
    const canvas = Object.assign(document.createElement('canvas'), { width: bitmap.width * 2, height: stripH * 2 })
    const ctx = canvas.getContext('2d')
    ctx.filter = 'grayscale(1)'
    ctx.drawImage(bitmap, 0, sy, bitmap.width, stripH, 0, 0, canvas.width, canvas.height)
    return canvas
  }
  const result = { top: await make(0), bottom: await make(bitmap.height - stripH) }
  bitmap.close?.()
  return result
}

export async function read(file, onProgress) {
  const worker = await getWorker(onProgress)
  const { top, bottom } = await strips(file)
  const a = (await worker.recognize(top)).data
  const b = (await worker.recognize(bottom)).data
  return {
    text: `${(a.text ?? '').trim()}${STRIP_SEPARATOR}${(b.text ?? '').trim()}`,
    confidence: Math.round(((a.confidence ?? 0) + (b.confidence ?? 0)) / 2),
  }
}
