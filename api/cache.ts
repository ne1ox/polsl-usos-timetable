export interface CacheEntry<T = unknown> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
}

export interface ResponseCache {
  get(key: string): Promise<CacheEntry | undefined>;
  set(key: string, value: CacheEntry): Promise<void>;
}

export function createMemoryCache(): ResponseCache {
  const entries = new Map<string, CacheEntry>();
  return {
    async get(key) { return entries.get(key); },
    async set(key, value) { entries.set(key, value); },
  };
}

/** Persistent browser cache; unavailable/blocked storage falls back to memory. */
export function createBrowserCache(): ResponseCache {
  const fallback = createMemoryCache();
  let database: Promise<IDBDatabase> | undefined;
  let disabled = false;

  function open(): Promise<IDBDatabase> {
    return database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("polsl-timetable-v1", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("responses");
      request.onsuccess = () => {
        if (disabled) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); disabled = true; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
    });
  }

  async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("responses", mode);
      const request = action(transaction.objectStore("responses"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("Cache transaction aborted"));
    });
  }

  return {
    async get(key) {
      if (!disabled && typeof indexedDB !== "undefined") {
        try { return await run<CacheEntry | undefined>("readonly", store => store.get(key)); }
        catch { disabled = true; }
      }
      return fallback.get(key);
    },
    async set(key, value) {
      await fallback.set(key, value);
      if (!disabled && typeof indexedDB !== "undefined") {
        try { await run("readwrite", store => store.put(value, key)); }
        catch { disabled = true; }
      }
    },
  };
}
