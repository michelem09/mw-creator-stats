import type { CachedMeta, ModelMetadata } from "./types";

const DEFAULT_TTL_DAYS = 30;

export type MetaCache = Record<string, CachedMeta>;

function isFresh(entry: CachedMeta, ttlDays: number, now: number): boolean {
  if (!entry.fetchedAt) return false;
  const ms = Date.parse(entry.fetchedAt);
  if (!Number.isFinite(ms)) return false;
  return now - ms < ttlDays * 86_400_000;
}

export interface CacheHit {
  meta: ModelMetadata;
  fromCache: boolean;
}

export async function getCachedOrFetch(
  designId: number,
  fetcher: () => Promise<ModelMetadata>,
  cache: MetaCache,
  ttlDays: number = DEFAULT_TTL_DAYS,
): Promise<CacheHit> {
  const key = String(designId);
  const now = Date.now();
  const existing = cache[key];
  if (existing && isFresh(existing, ttlDays, now)) {
    // strip cache-internal fields when returning as ModelMetadata
    const { fetchedAt: _fetchedAt, ...meta } = existing;
    void _fetchedAt;
    return { meta, fromCache: true };
  }
  const fresh = await fetcher();
  // Only persist if it looks usable; otherwise leave the cache unchanged so we retry next run.
  if (fresh.category || fresh.tags.length) {
    cache[key] = { ...fresh, fetchedAt: new Date(now).toISOString() };
  }
  return { meta: fresh, fromCache: false };
}
