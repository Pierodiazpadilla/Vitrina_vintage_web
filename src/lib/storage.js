// localStorage que nunca rompe la página: navegadores in-app (Instagram/TikTok),
// modo privado o cuota llena simplemente dejan de persistir.
export const safeStorage = {
  get(key, fallback) {
    try {
      const raw = globalThis.localStorage?.getItem(key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value))
    } catch {
      // sin persistencia: la página sigue funcionando en memoria
    }
  },
}
