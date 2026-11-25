// @vitest-environment node
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { findCatalogRoot, scanCatalog } from '../../scripts/lib/scan.mjs'

let root
let catalog

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'vv-scan-'))
  catalog = join(root, 'zip', 'Catálogo Vitrina Vintage')
  const put = async (rel, content) => {
    const abs = join(catalog, ...rel.split('/'))
    await mkdir(join(abs, '..'), { recursive: true })
    await writeFile(abs, content)
  }
  await put('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (24).jpg', 'foto-24')
  await put('_ 35__ DESC/VITRINAdblic (24).jpg', 'foto-24') // misma imagen
  await put('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (16)a.jpg', 'foto-16a')
  await put('_1 DRAGON BALL/LICENCIADOS/VITRINAdblic (16)b.jpg', 'foto-16b')
  await put('GRATIS/ARMABLE (1).jpg', 'gratis')
  await put('BIENVENIDO.JPG', 'hola')
  // carpeta con tilde en NFD, como la trae el zip de Google Drive en Windows
  await put('_2 POKÉMON/SIN LICENCIA/VITRINApokemon (1).jpg', 'poke')
  await put('_2 POKÉMON/SIN LICENCIA/notas.txt', 'no es foto')
})

afterAll(() => rm(root, { recursive: true, force: true }))

describe('scanCatalog', () => {
  it('encuentra la raíz real del catálogo dentro de carpetas anidadas', async () => {
    expect(await findCatalogRoot(root)).toBe(catalog)
  })

  it('ignora GRATIS, archivos sueltos de la raíz y lo que no es imagen', async () => {
    const groups = await scanCatalog(catalog)
    const paths = groups.flatMap((g) => g.relPaths)
    expect(paths.some((p) => p.startsWith('GRATIS'))).toBe(false)
    expect(paths).not.toContain('BIENVENIDO.JPG')
    expect(paths.some((p) => p.endsWith('.txt'))).toBe(false)
  })

  it('(24) es un grupo con 2 rutas y una sola foto (mismo MD5)', async () => {
    const g = (await scanCatalog(catalog)).find((x) => x.key === 'vitrinadblic (24)')
    expect(g.relPaths).toHaveLength(2)
    expect(g.files).toHaveLength(1)
    expect(g.prefix).toBe('dblic')
  })

  it('(16) agrupa a y b en orden', async () => {
    const g = (await scanCatalog(catalog)).find((x) => x.key === 'vitrinadblic (16)')
    expect(g.files.map((f) => f.photoIndex)).toEqual(['a', 'b'])
    expect(new Set(g.files.map((f) => f.md5)).size).toBe(2)
  })

  it('normaliza las rutas NFD a NFC', async () => {
    const g = (await scanCatalog(catalog)).find((x) => x.key === 'vitrinapokemon (1)')
    expect(g.relPaths[0]).toBe('_2 POKÉMON/SIN LICENCIA/VITRINApokemon (1).jpg'.normalize('NFC'))
  })
})
