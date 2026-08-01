// Lightweight in-memory cache for API GET responses.
// Not localStorage/sessionStorage — this resets on full page reload,
// but eliminates redundant fetches during normal in-app navigation
// (e.g. Forums -> Subcategory -> back -> Subcategory again).

const store = new Map(); // key -> { data, ts }
const inflight = new Map(); // key -> Promise (dedupes concurrent identical fetches)

const DEFAULT_TTL = 30_000; // 30s: fresh enough, still avoids refetch spam

/**
 * Get cached data for a key, or fetch it via fetcher() if missing/stale.
 * Returns { data, stale } where stale=true means data is cached but
 * a background revalidation has been kicked off — caller can render
 * the stale data immediately and re-render when the fresh data arrives
 * via the onRevalidate callback.
 */
export async function cachedFetch(key, fetcher, { ttl = DEFAULT_TTL, onRevalidate } = {}) {
  const cached = store.get(key);
  const now = Date.now();

  if (cached) {
    const isFresh = now - cached.ts < ttl;
    if (!isFresh && onRevalidate) {
      // Stale-while-revalidate: return cached data now, refresh in background
      revalidate(key, fetcher, onRevalidate);
    }
    return cached.data;
  }

  // No cache yet — fetch and dedupe concurrent calls for the same key
  if (inflight.has(key)) return inflight.get(key);

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, ts: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

function revalidate(key, fetcher, onRevalidate) {
  if (inflight.has(key)) return; // already revalidating
  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, ts: Date.now() });
      inflight.delete(key);
      onRevalidate(data);
      return data;
    })
    .catch(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
}

/** Manually clear one key or the whole cache — call after mutations (create/edit/delete). */
export function invalidateCache(key) {
  if (key) {
    store.delete(key);
    inflight.delete(key);
  } else {
    store.clear();
    inflight.clear();
  }
}

/** Directly seed the cache with known-fresh data, skipping a network round-trip.
 *  Useful when an endpoint (e.g. login) already returns the data another
 *  cached endpoint (e.g. /api/auth/me) would otherwise need to re-fetch. */
export function setCache(key, data) {
  store.set(key, { data, ts: Date.now() });
}
