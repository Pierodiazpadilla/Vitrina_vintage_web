// @vitest-environment node
import { findExisting, planUpsert, resolveCode } from '../../scripts/lib/upsertPlan.mjs'

const cand = {
  code: 'DB1082',
  codeIsTemp: false,
  md5s: ['m1', 'm2'],
  sourceKey: 'vitrinadblic (7)',
  sourceFiles: ['_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (7).jpg'],
  files: [{ md5: 'm1' }, { md5: 'm2' }],
  title: 'Dragon Ball Z 3 álbum',
  price: 250,
  variants: [],
  discountPercent: 0,
  category: 'dragon-ball',
  isOriginal: true,
  era: null,
  condition: 'Sellado',
  tags: ['sellado'],
  editorial: 'Navarrete',
  year: 1999,
  extras: null,
  rawOcrText: 'texto',
  warnings: [],
  images: [{ path: 'products/DB1082/m1', full: 'f1', thumb: 't1', w: 1, h: 1 }],
}

describe('findExisting', () => {
  it('por MD5 (alguna foto en común)', () => {
    expect(findExisting({ code: 'TMP-ab12cd34', codeIsTemp: true, md5s: ['m1'], sourceKey: 'k' }, [{ code: 'ZZ1', file_hashes: ['m1'] }]).code).toBe('ZZ1')
  })
  it('luego por nombre base', () => {
    expect(findExisting({ code: 'TMP-1', codeIsTemp: true, md5s: ['n'], sourceKey: 'vitrinadblic (24)' }, [{ code: 'Q', file_hashes: [], source_key: 'vitrinadblic (24)' }]).code).toBe('Q')
  })
  it('el mismo código con otras fotos y otro nombre NO es el mismo producto (el catálogo reutiliza códigos)', () => {
    expect(findExisting({ code: 'DB0126', codeIsTemp: false, md5s: ['x'], sourceKey: 'vitrinadb (34)' }, [{ code: 'DB0126', file_hashes: ['y'], source_key: 'vitrinadblic (1)' }])).toBe(null)
  })
  it('MD5 gana aunque el código leído cambie entre corridas', () => {
    expect(findExisting({ code: 'DB9999', codeIsTemp: false, md5s: ['m1'], sourceKey: 'k' }, [{ code: 'DB1082', file_hashes: ['m1'] }]).code).toBe('DB1082')
  })
})

describe('resolveCode', () => {
  const taken = new Set(['DB0126', 'DB0126-2'])
  it('código libre → se usa', () => {
    expect(resolveCode({ code: 'db1082', codeIsTemp: false }, null, taken)).toEqual({ code: 'DB1082', codeIsTemp: false, duplicate: false })
  })
  it('código tomado por otro producto → sufijo libre y aviso', () => {
    expect(resolveCode({ code: 'DB0126', codeIsTemp: false }, null, taken)).toEqual({ code: 'DB0126-3', codeIsTemp: false, duplicate: true })
  })
  it('fila emparejada con código real → se conserva (re-ejecución estable)', () => {
    expect(resolveCode({ code: 'DB0126', codeIsTemp: false }, { code: 'DB0126-2', code_is_temp: false }, taken).code).toBe('DB0126-2')
  })
  it('un código real reemplaza al temporal de la fila; uno temporal no cambia nada', () => {
    expect(resolveCode({ code: 'DB2000', codeIsTemp: false }, { code: 'TMP-1', code_is_temp: true }, taken)).toEqual({ code: 'DB2000', codeIsTemp: false, duplicate: false })
    expect(resolveCode({ code: 'TMP-9', codeIsTemp: true }, { code: 'TMP-1', code_is_temp: true }, taken).code).toBe('TMP-1')
  })
})

describe('planUpsert', () => {
  it('fila nueva → insert como borrador', () => {
    const p = planUpsert(cand, null)
    expect(p.action).toBe('insert')
    expect(p.patch).toMatchObject({ status: 'draft', code: 'DB1082', price: 250, stock: 1, admin_edited: false, is_original: true })
    expect(p.patch.image_url).toBe('f1')
    expect(p.patch.file_hashes).toEqual(['m1', 'm2'])
  })

  it('borrador sin editar → update-full', () => {
    expect(planUpsert(cand, { status: 'draft', admin_edited: false }).action).toBe('update-full')
  })

  it('editado por el admin o publicado → solo agrega fotos, hashes y descuento', () => {
    const p = planUpsert({ ...cand, price: 999, discountPercent: 35 }, { status: 'published', admin_edited: true, price: 250, images: [{ path: 'a', full: 'fa' }], file_hashes: ['old'] })
    expect(p.action).toBe('update-append')
    expect(p.patch.price).toBeUndefined()
    expect(p.patch.title).toBeUndefined()
    expect(p.patch.code).toBeUndefined()
    expect(p.patch.discount_percent).toBe(35)
    expect(p.patch.file_hashes).toEqual(expect.arrayContaining(['old', ...cand.md5s]))
    expect(p.patch.images.map((i) => i.path)).toEqual(['a', 'products/DB1082/m1'])
    expect(p.patch.image_url).toBe('fa')
  })

  it('no duplica fotos ya guardadas', () => {
    const p = planUpsert(cand, { status: 'published', admin_edited: true, images: cand.images, file_hashes: ['m1'] })
    expect(p.patch.images).toHaveLength(1)
    expect(p.patch.discount_percent).toBeUndefined()
  })
})
