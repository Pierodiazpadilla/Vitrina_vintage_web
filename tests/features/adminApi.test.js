import { createAdminApi, folderOf, toPatch, ValidationError } from '../../src/features/admin/adminApi.js'

/** Cliente de Supabase falso: registra la cadena de llamadas y responde `result`. */
function fakeClient(result = { data: {}, error: null }) {
  const calls = []
  const storageCalls = []
  const chain = (table) => {
    const q = { table, ops: [] }
    calls.push(q)
    const proxy = new Proxy({}, {
      get(_t, prop) {
        if (prop === 'then') return (resolve, reject) => Promise.resolve(typeof result === 'function' ? result(q) : result).then(resolve, reject)
        return (...args) => {
          q.ops.push([prop, ...args])
          return proxy
        }
      },
    })
    return proxy
  }
  const client = {
    from: (table) => chain(table),
    storage: {
      from: (bucket) => ({
        upload: async (path, body, opts) => { storageCalls.push(['upload', bucket, path, opts]); return { error: null } },
        remove: async (paths) => { storageCalls.push(['remove', bucket, paths]); return { error: null } },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    },
  }
  const op = (q, name) => q.ops.find(([n]) => n === name)
  return { client, calls, storageCalls, op }
}

const valid = { code: 'pk0001', title: 'Album', price: 100, category: 'pokemon', is_original: true, stock: 1, is_preorder: false }

describe('adminApi', () => {
  it('publish con un producto inválido rechaza con los mensajes y no llama al cliente', async () => {
    const { client, calls } = fakeClient()
    const api = createAdminApi(client)
    const err = await api.publish('id1', { ...valid, price: 0, is_original: null }).catch((e) => e)
    expect(err).toBeInstanceOf(ValidationError)
    expect(err.errors).toEqual(expect.arrayContaining(['Falta el precio', 'Indica si es original o réplica']))
    expect(calls).toHaveLength(0)
  })

  it('publish válido: published, published_at y admin_edited', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).publish('id1', valid)
    const patch = op(calls[0], 'update')[1]
    expect(patch).toMatchObject({ status: 'published', admin_edited: true, code: 'PK0001' })
    expect(patch.published_at).toBeTruthy()
    expect(op(calls[0], 'eq')).toEqual(['eq', 'id', 'id1'])
  })

  it('decrementStock sobre stock 1 envía { stock: 0, status: "sold" }', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).decrementStock('id1', 1)
    expect(op(calls[0], 'update')[1]).toMatchObject({ stock: 0, status: 'sold' })
  })

  it('decrementStock sobre stock 5 deja 4', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).decrementStock('id1', 5)
    expect(op(calls[0], 'update')[1]).toEqual({ stock: 4, admin_edited: true })
  })

  it('saveProduct siempre incluye admin_edited: true', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).saveProduct('id1', { title: 'Nuevo' })
    expect(op(calls[0], 'update')[1]).toEqual({ title: 'Nuevo', admin_edited: true })
  })

  it('restock de un vendido lo vuelve a publicar', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).restock({ id: 'id1', status: 'sold', published_at: '2026-01-01' }, 3)
    expect(op(calls[0], 'update')[1]).toEqual({ stock: 3, status: 'published', admin_edited: true })
  })

  it('restock sin cantidad de un vendido con stock 0 lo publica con stock 1', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).restock({ id: 'id1', status: 'sold', stock: 0, published_at: '2026-01-01' })
    expect(op(calls[0], 'update')[1]).toEqual({ stock: 1, status: 'published', admin_edited: true })
  })

  it('restock de un publicado con stock 0 asegura stock 1', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).restock({ id: 'id1', status: 'published', stock: 0, published_at: '2026-01-01' })
    expect(op(calls[0], 'update')[1]).toEqual({ stock: 1, status: 'published', admin_edited: true })
  })

  it('restock no publica borradores ni ocultos', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).restock({ id: 'id1', status: 'hidden', stock: 0 }, 2)
    expect(op(calls[0], 'update')[1]).toEqual({ stock: 2, admin_edited: true })
  })

  it('saveProduct de vendido a Publicado valida, pone status y stock ≥ 1', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).saveProduct('id1', { ...valid, stock: 0, status: 'published' }, { status: 'sold', published_at: '2026-01-01' })
    expect(op(calls[0], 'update')[1]).toMatchObject({ status: 'published', stock: 1, admin_edited: true })
  })

  it('saveProduct a Publicado con datos incompletos rechaza sin llamar al cliente', async () => {
    const { client, calls } = fakeClient()
    const err = await createAdminApi(client).saveProduct('id1', { ...valid, price: 0, status: 'published' }, { status: 'draft' }).catch((e) => e)
    expect(err).toBeInstanceOf(ValidationError)
    expect(calls).toHaveLength(0)
  })

  it('saveProduct a Vendido deja el stock en 0', async () => {
    const { client, calls, op } = fakeClient()
    await createAdminApi(client).saveProduct('id1', { ...valid, stock: 3, status: 'sold' }, { status: 'published' })
    expect(op(calls[0], 'update')[1]).toMatchObject({ status: 'sold', stock: 0 })
  })

  it('deleteProduct borra fotos full y thumb y luego la fila', async () => {
    const { client, calls, storageCalls, op } = fakeClient()
    await createAdminApi(client).deleteProduct({ id: 'id1', images: [{ path: 'products/X/a' }] })
    expect(storageCalls[0]).toEqual(['remove', 'catalog', ['products/X/a-full.webp', 'products/X/a-thumb.webp']])
    expect(op(calls[0], 'delete')).toBeTruthy()
  })

  it('uploadImages sube full y thumb webp por foto', async () => {
    const { client, storageCalls } = fakeClient()
    const api = createAdminApi(client, { toWebpVariants: async () => ({ full: 'F', thumb: 'T', w: 1200, h: 800 }) })
    const images = await api.uploadImages('db1', [{ file: {}, md5: 'abcdef0123456789' }])
    expect(storageCalls.map((c) => c[2])).toEqual(['products/DB1/abcdef012345-full.webp', 'products/DB1/abcdef012345-thumb.webp'])
    expect(images[0]).toEqual({ path: 'products/DB1/abcdef012345', full: 'https://cdn.test/products/DB1/abcdef012345-full.webp', thumb: 'https://cdn.test/products/DB1/abcdef012345-thumb.webp', w: 1200, h: 800 })
  })

  it('findDuplicates busca por código real y por MD5', async () => {
    const { client, calls } = fakeClient({ data: [{ id: 'x' }], error: null })
    const found = await createAdminApi(client).findDuplicates({ code: 'db1082', md5s: ['m1'] })
    expect(found).toEqual([{ id: 'x' }])
    expect(calls[0].ops).toContainEqual(['eq', 'code', 'DB1082'])
    expect(calls[1].ops).toContainEqual(['overlaps', 'file_hashes', ['m1']])
  })

  it('findDuplicates ignora códigos temporales', async () => {
    const { client, calls } = fakeClient({ data: [], error: null })
    await createAdminApi(client).findDuplicates({ code: 'TMP-1', md5s: [] })
    expect(calls).toHaveLength(0)
  })

  it('un código repetido se explica en español', async () => {
    const { client } = fakeClient({ data: null, error: { code: '23505', message: 'duplicate key' } })
    await expect(createAdminApi(client).saveProduct('id', { code: 'X' })).rejects.toThrow('Ya existe otro producto con ese código.')
  })
})

describe('toPatch y folderOf', () => {
  it('normaliza código, números, versiones y portada', () => {
    const p = toPatch({ code: ' tmp-ab ', price: '', year: '1999', variants: [{ label: 'Tapa dura', price: '90' }, { label: 'Tapa blanda', price: '60' }], images: [{ full: 'f1' }] })
    expect(p).toMatchObject({ code: 'TMP-AB', code_is_temp: true, price: 60, year: 1999, image_url: 'f1' })
  })
  it('carpeta de origen', () => {
    expect(folderOf({ source_files: ['_1 DRAGON BALL/LICENCIADOS/x.jpg'] })).toBe('_1 DRAGON BALL/LICENCIADOS')
    expect(folderOf({ source_files: [] })).toBe('Cargados a mano')
  })
})
