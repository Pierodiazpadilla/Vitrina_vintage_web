// sharp: franjas para OCR y variantes webp (spec §7 pasos 5 y 8).
import sharp from 'sharp'

const STRIP = 0.25

/** 25 % superior e inferior, ×2 y en gris: el banner con precio y código vive ahí. */
export async function ocrStrips(buffer) {
  // Se rota primero (EXIF) para medir el alto real de la foto tal como se ve.
  const rotated = await sharp(buffer).rotate().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = rotated.info
  const stripH = Math.max(1, Math.round(h * STRIP))
  const strip = (top) =>
    sharp(rotated.data)
      .extract({ left: 0, top, width: w, height: stripH })
      .resize(w * 2, stripH * 2)
      .toColourspace('b-w')
      .png()
      .toBuffer()
  return { top: await strip(0), bottom: await strip(h - stripH) }
}

/** full: lado mayor 1200 px q80 · thumb: 480 px q75. */
export async function webpVariants(buffer) {
  const base = sharp(buffer).rotate()
  const full = await base.clone().resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
  const thumb = await base.clone().resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()
  return { full: full.data, thumb, w: full.info.width, h: full.info.height }
}
