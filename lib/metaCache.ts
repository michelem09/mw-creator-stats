import { promises as fs } from "node:fs";
import path from "node:path";
import type { CachedMeta, ModelMetadata } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_PATH = path.join(DATA_DIR, "metadata-cache.json");
const DEFAULT_TTL_DAYS = 30;

export type MetaCache = Record<string, CachedMeta>;

export async function readMetaCache(): Promise<MetaCache> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as MetaCache;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    return {};
  }
}

export async function flushMetaCache(cache: MetaCache): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = CACHE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(cache, null, 2), "utf-8");
  await fs.rename(tmp, CACHE_PATH);
}

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
