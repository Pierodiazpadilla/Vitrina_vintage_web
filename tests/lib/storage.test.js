import { safeStorage } from '../../src/lib/storage.js'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('safeStorage', () => {
  it('stores and reads JSON', () => {
    safeStorage.set('k', { a: 1 })
    expect(safeStorage.get('k', null)).toEqual({ a: 1 })
  })
  it('returns the fallback when the key is missing', () => {
    expect(safeStorage.get('missing', [])).toEqual([])
  })
  it('returns the fallback on invalid JSON', () => {
    localStorage.setItem('bad', '{not json')
    expect(safeStorage.get('bad', 'fb')).toBe('fb')
  })
  it('returns the fallback when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(safeStorage.get('k', 'fb')).toBe('fb')
  })
  it('does not throw when writing fails (quota, private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => safeStorage.set('k', 1)).not.toThrow()
  })
})
