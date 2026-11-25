// Worker de tesseract.js (español) reutilizable. La primera vez descarga spa.traineddata y lo cachea.
import { createWorker } from 'tesseract.js'
import { STRIP_SEPARATOR } from '../../src/shared/parseBanner.js'
import { ocrStrips } from './images.mjs'

export async function createOcr() {
  const worker = await createWorker('spa')
  return {
    async read(buffer) {
      const { data } = await worker.recognize(buffer)
      return { text: data.text ?? '', confidence: data.confidence ?? 0 }
    },
    /** OCR de la franja superior e inferior, unidas con el separador que entiende parseBanner. */
    async readBanner(buffer) {
      const { top, bottom } = await ocrStrips(buffer)
      const a = await this.read(top)
      const b = await this.read(bottom)
      return { text: `${a.text.trim()}${STRIP_SEPARATOR}${b.text.trim()}`, confidence: Math.round((a.confidence + b.confidence) / 2) }
    },
    close: () => worker.terminate(),
  }
}
