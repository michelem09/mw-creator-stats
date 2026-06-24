// Browser storage adapter (IndexedDB via idb-keyval). Shared by both targets:
// the web page and the extension page both run in a browser, so snapshots and the
// metadata cache live client-side per browser instead of on a server filesystem.
import { get, set, keys, createStore, type UseStore } from "idb-keyval";
import type { Snapshot } from "../types";
import type { MetaCache } from "../metaCache";
import type { Store, StoredSnapshotMeta } from "../ports";

// Lazy: createStore() touches indexedDB, which doesn't exist during SSR of a client
// component. Defer it until the first (always client-side) call.
let _kv: UseStore | undefined;
function kv(): UseStore {
  if (!_kv) _kv = createStore("mw-stats", "kv");
  return _kv;
}
const META_KEY = "metadata-cache";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function snapKey(start: string, end: string): string {
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    throw new Error("Invalid date range. Expected YYYY-MM-DD.");
  }
  return `snapshot:${start}_${end}`;
}

export const idbStore: Store = {
  async readSnapshot(start, end) {
    const v = await get<Snapshot>(snapKey(start, end), kv());
    return v ?? null;
  },

  async writeSnapshot(snap) {
    const { start, end } = snap.meta.dateRange;
    await set(snapKey(start, end), snap, kv());
  },

  async listSnapshots() {
    const ks = (await keys(kv())) as string[];
    const out: StoredSnapshotMeta[] = [];
    for (const k of ks) {
      const m = /^snapshot:(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(String(k));
      if (!m) continue;
      const snap = await get<Snapshot>(k, kv());
      const mtime = snap ? Date.parse(snap.meta.collectedAt) || 0 : 0;
      const size = snap ? JSON.stringify(snap).length : 0;
      out.push({ start: m[1], end: m[2], size, mtime });
    }
    return out.sort((a, b) => b.mtime - a.mtime);
  },

  async readMetaCache() {
    return (await get<MetaCache>(META_KEY, kv())) ?? {};
  },

  async flushMetaCache(cache) {
    await set(META_KEY, cache, kv());
  },
};
