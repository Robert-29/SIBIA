/**
 * Cache en memoria con TTL para reducir latencia a Supabase
 * Los datos se almacenan por clave y expiran después de `ttlMs` ms
 */

const store = new Map();

/**
 * Obtener valor del cache
 * @param {string} key
 * @returns {any|null}
 */
export const cacheGet = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Guardar valor en cache
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs - tiempo de vida en milisegundos (default: 2 minutos)
 */
export const cacheSet = (key, value, ttlMs = 2 * 60 * 1000) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

/**
 * Invalidar una clave específica
 */
export const cacheDel = (key) => {
  store.delete(key);
};

/**
 * Invalidar todas las claves que empiecen con un prefijo
 */
export const cacheDelPattern = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

/**
 * Wrapper: obtener de cache o ejecutar función y cachear resultado
 * @param {string} key
 * @param {Function} fn - función async que retorna el valor
 * @param {number} ttlMs
 */
export const cacheOrFetch = async (key, fn, ttlMs = 2 * 60 * 1000) => {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  const result = await fn();
  if (result !== null && result !== undefined) {
    cacheSet(key, result, ttlMs);
  }
  return result;
};
