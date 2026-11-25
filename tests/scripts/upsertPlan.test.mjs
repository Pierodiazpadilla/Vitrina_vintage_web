// @vitest-environment node
import { findExisting, mergeByCode, planUpsert } from '../../scripts/lib/upsertPlan.mjs'

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
  it('por código', () => {
    expect(findExisting({ code: 'DB1082', codeIsTemp: false, md5s: ['x'], sourceKey: 'k' }, [{ code: 'DB1082' }])).toEqual({ code: 'DB1082' })
  })
  it('por código sin importar mayúsculas', () => {
    expect(findExisting({ code: 'db1082', codeIsTemp: false, md5s: [], sourceKey: 'k' }, [{ code: 'DB1082' }])?.code).toBe('DB1082')
  })
  it('un código temporal no se usa: busca por MD5', () => {
    expect(findExisting({ code: 'TMP-ab12cd34', codeIsTemp: true, md5s: ['m1'], sourceKey: 'k' }, [{ code: 'ZZ1', file_hashes: ['m1'] }]).code).toBe('ZZ1')
  })
  it('por último, por nombre base', () => {
    expect(findExisting({ code: 'TMP-1', codeIsTemp: true, md5s: ['n'], sourceKey: 'vitrinadblic (24)' }, [{ code: 'Q', file_hashes: [], source_key: 'vitrinadblic (24)' }]).code).toBe('Q')
  })
  it('sin coincidencias → null', () => {
    expect(findExisting(cand, [{ code: 'OTRO', file_hashes: ['zz'], source_key: 'x' }])).toBe(null)
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

  it('un código real reemplaza al temporal; uno temporal no reemplaza al real', () => {
    expect(planUpsert(cand, { status: 'draft', admin_edited: false, code: 'TMP-1', code_is_temp: true }).patch).toMatchObject({ code: 'DB1082', code_is_temp: false })
    expect(planUpsert({ ...cand, code: 'TMP-9', codeIsTemp: true }, { status: 'draft', admin_edited: false, code: 'DB1', code_is_temp: false }).patch.code).toBe('DB1')
  })

  it('editado por el admin o publicado → solo agrega fotos, hashes y descuento', () => {
    const p = planUpsert({ ...cand, price: 999, discountPercent: 35 }, { status: 'published', admin_edited: true, price: 250, images: [{ path: 'a', full: 'fa' }], file_hashes: ['old'] })
    expect(p.action).toBe('update-append')
    expect(p.patch.price).toBeUndefined()
    expect(p.patch.title).toBeUndefined()
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

describe('mergeByCode', () => {
  const c1 = { ...cand, sourceKey: 'a', md5s: ['m1'], files: [{ md5: 'm1' }], price: null, warnings: [] }
  const c2 = { ...cand, sourceKey: 'b', md5s: ['m9'], files: [{ md5: 'm9' }], price: 250, discountPercent: 35, warnings: ['low_confidence'] }

  it('fusiona grupos con el mismo código real', () => {
    const out = mergeByCode([c1, c2])
    expect(out).toHaveLength(1)
    expect(out[0].md5s).toEqual(['m1', 'm9'])
    expect(out[0].price).toBe(250)
    expect(out[0].discountPercent).toBe(35)
    expect(out[0].warnings).toEqual(expect.arrayContaining(['merged_by_code', 'low_confidence']))
  })

  it('no fusiona códigos temporales', () => {
    expect(mergeByCode([{ ...c1, code: 'TMP-1', codeIsTemp: true }, { ...c2, code: 'TMP-1', codeIsTemp: true }])).toHaveLength(2)
  })
})
