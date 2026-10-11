import { createBrowserCache, type CacheEntry, type ResponseCache } from './cache';
import type { LoadOptions } from './types';

export interface ResponseData<T> {
  data: T;
  fetchedAt: number;
  stale: boolean;
}

export interface TransportOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  cache?: ResponseCache;
  concurrency?: number;
  timeoutMs?: number;
  /** Suppress repeated failed requests; Retry-After may extend this delay. */
  errorCooldownMs?: number;
  now?: () => number;
}

export class UsosError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    endpoint: string,
    public retryAfterMs = 0,
  ) {
    super(`USOS ${endpoint}: HTTP ${status}`);
    this.name = 'UsosError';
  }
}

export interface Transport {
  get<T>(
    endpoint: string,
    params: Record<string, string>,
    ttlMs: number,
    options?: LoadOptions,
  ): Promise<ResponseData<T>>;
}

export function createTransport(options: TransportOptions = {}): Transport {
  const base = (options.baseUrl ?? 'https://usosapi.polsl.pl/services').replace(/\/$/, '');
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const cache = options.cache ?? createBrowserCache();
  const now = options.now ?? Date.now;
  const concurrency = options.concurrency ?? 2;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const errorCooldownMs = options.errorCooldownMs ?? 60_000;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('concurrency must be a positive integer');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeoutMs must be positive');
  }
  if (!Number.isFinite(errorCooldownMs) || errorCooldownMs < 0) {
    throw new Error('errorCooldownMs must be nonnegative');
  }
  const pending = new Map<string, Promise<ResponseData<unknown>>>();
  const failures = new Map<string, { retryAt: number; error: unknown }>();
  let rateLimit: { retryAt: number; error: UsosError } | undefined;
  const waiting: (() => void)[] = [];
  let active = 0;

  async function limited<T>(work: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active++;
    }
    try {
      return await work();
    } finally {
      const next = waiting.shift();
      if (next) {
        next();
      } else {
        active--;
      }
    }
  }

  return {
    async get<T>(
      endpoint: string,
      params: Record<string, string>,
      ttlMs: number,
      load: LoadOptions = {},
    ) {
      const url = new URL(`${base}/${endpoint}`);
      for (const [key, value] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b))) {
        url.searchParams.set(key, value);
      }
      const key = `v1:${url.href}`;
      let task = pending.get(key);
      if (!task) {
        task = (async () => {
          let cached: CacheEntry | undefined;
          try {
            cached = await cache.get(key);
          } catch {
            /* Storage must not prevent fetching. */
          }
          if (cached && !load.refresh && cached.expiresAt > now()) {
            return { data: cached.data, fetchedAt: cached.fetchedAt, stale: false };
          }
          try {
            const data = await limited(async () => {
              const failure = failures.get(key);
              if (failure && failure.retryAt > now()) {
                throw failure.error;
              }
              if (rateLimit && rateLimit.retryAt > now()) {
                throw rateLimit.error;
              }
              if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                throw new TypeError('Browser is offline');
              }
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), timeoutMs);
              try {
                const response = await fetcher(url, {
                  signal: controller.signal,
                  credentials: 'omit',
                });
                if (!response.ok) {
                  const body = await response.text();
                  let parsed: unknown = body;
                  try {
                    parsed = JSON.parse(body);
                  } catch {
                    /* Non-JSON upstream error. */
                  }
                  const retryHeader = response.headers.get('Retry-After');
                  const retryAfterMs = parseRetryAfter(retryHeader, now());
                  const error = new UsosError(response.status, parsed, endpoint, retryAfterMs);
                  if (response.status === 429) {
                    rateLimit = { error, retryAt: now() + Math.max(errorCooldownMs, retryAfterMs) };
                  }
                  throw error;
                }
                return await response.json();
              } finally {
                clearTimeout(timer);
              }
            });
            const fetchedAt = now();
            failures.delete(key);
            try {
              await cache.set(key, { data, fetchedAt, expiresAt: fetchedAt + ttlMs });
            } catch {
              /* A quota error must not discard a successful response. */
            }
            return { data, fetchedAt, stale: false };
          } catch (error) {
            // Do not extend a cooldown just because another component read stale data.
            const failure = failures.get(key);
            if (!failure || failure.retryAt <= now()) {
              failures.set(key, {
                error,
                retryAt: Math.max(
                  rateLimit?.retryAt ?? 0,
                  now() +
                    Math.max(errorCooldownMs, error instanceof UsosError ? error.retryAfterMs : 0),
                ),
              });
            }
            if (
              cached &&
              (!(error instanceof UsosError) || error.status === 429 || error.status >= 500)
            ) {
              return { data: cached.data, fetchedAt: cached.fetchedAt, stale: true };
            }
            throw error;
          }
        })();
        pending.set(key, task);
      }
      try {
        return structuredClone(await task) as ResponseData<T>;
      } finally {
        if (pending.get(key) === task) {
          pending.delete(key);
        }
      }
    },
  };
}

function parseRetryAfter(header: string | null, now: number) {
  if (header === null) {
    return 0;
  }
  if (/^\d+$/.test(header)) {
    return Number(header) * 1_000;
  }
  return Math.max(0, Date.parse(header) - now) || 0;
}
