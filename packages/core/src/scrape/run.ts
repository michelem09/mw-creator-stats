import type { ModelStat, ModelMetadata, Snapshot, SyncProgress, TrafficSource } from "../types";
import { classify } from "./classify";
import { getPageContext } from "./buildId";
import { getModelList, type RawModel } from "./modelList";
import { getModelDetail, type ModelDetail } from "./modelDetail";
import { fetchModelMetadata } from "./metadata";
import { sleep } from "./session";
import type { Fetcher, Store } from "../ports";
import { getCachedOrFetch, type MetaCache } from "../metaCache";

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toInt = (v: unknown): number => Math.round(toNum(v));

export interface RunOptions {
  start: string;
  end: string;
  /** Sleep between concurrent batches (ms). */
  delayMs?: number;
  /** How many models to process in parallel. Default 10. */
  concurrency?: number;
  skipMetadata?: boolean;
}

const EMPTY_META: ModelMetadata = {
  category: "",
  tags: [],
  publishTime: "",
  createTime: "",
  license: "",
  instanceCount: 0,
};

interface Processed {
  designId: number;
  title: string;
  detail: ModelDetail | null;
  meta: ModelMetadata;
  metaError: boolean;
  metaFromCache: boolean;
}

async function processOne(
  fetcher: Fetcher,
  buildId: string,
  range: { start: string; end: string },
  raw: RawModel,
  preferredTemplate: { value: string },
  metaCache: MetaCache,
  skipMetadata: boolean,
): Promise<Processed> {
  let detail: ModelDetail | null = null;
  try {
    detail = await getModelDetail(fetcher, buildId, raw.designId, range.start, range.end);
  } catch {
    detail = null;
  }

  if (skipMetadata) {
    return {
      designId: raw.designId,
      title: raw.title,
      detail,
      meta: EMPTY_META,
      metaError: false,
      metaFromCache: false,
    };
  }

  const hit = await getCachedOrFetch(
    raw.designId,
    () => fetchModelMetadata(fetcher, raw.designId, preferredTemplate),
    metaCache,
  );
  const metaError = "_error" in hit.meta && !!hit.meta._error;
  return {
    designId: raw.designId,
    title: raw.title,
    detail,
    meta: hit.meta,
    metaError,
    metaFromCache: hit.fromCache,
  };
}

function buildModelStat(p: Processed, today: Date): ModelStat | null {
  if (!p.detail) return null;
  const sm = p.detail.summary;
  const tsObj = p.detail.trafficSource;
  const pub = (p.meta.publishTime || p.detail.designInfo.publishTime || "").slice(0, 10);

  let ageDays: number | null = null;
  let viewPerDay: number | null = null;
  let dlPerDay: number | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(pub)) {
    const d = new Date(pub + "T00:00:00Z");
    const ms = today.getTime() - d.getTime();
    ageDays = Math.max(Math.floor(ms / 86_400_000), 1);
    const v = toInt(sm.view);
    const dl = toInt(sm.download);
    viewPerDay = Math.round((v / ageDays) * 10) / 10;
    dlPerDay = Math.round((dl / ageDays) * 100) / 100;
  }

  const ts: TrafficSource = [
    toNum(tsObj.recommend),
    toNum(tsObj.search),
    toNum(tsObj.browse),
    toNum(tsObj.directUrl),
    toNum(tsObj.others),
  ];

  return {
    id: p.designId,
    cat: classify(p.title),
    category: p.meta.category,
    tags: p.meta.tags,
    title: p.title,
    impr: toInt(sm.impression),
    view: toInt(sm.view),
    dl: toInt(sm.download),
    print: toInt(sm.print),
    collect: toInt(sm.collect),
    like: toInt(sm.like),
    boost: toInt(sm.boost),
    point: Math.round(toNum(sm.point)),
    ts,
    pub,
    license: p.meta.license,
    instances: p.meta.instanceCount,
    ageDays,
    viewPerDay,
    dlPerDay,
    cover: p.meta.cover,
    ...(p.detail.points ? { points: p.detail.points } : {}),
  };
}

export async function* runScrape(
  fetcher: Fetcher,
  store: Store,
  opts: RunOptions,
): AsyncGenerator<SyncProgress, Snapshot, void> {
  const { start, end, delayMs = 80, concurrency = 10, skipMetadata = false } = opts;

  yield { stage: "buildId", message: "Resolving buildId" };
  const { buildId, html } = await getPageContext(fetcher);

  yield { stage: "list", message: "Fetching model list" };
  const { list: raw, points } = await getModelList(fetcher, buildId, start, end, html);

  const total = raw.length;
  const today = new Date();
  const models: ModelStat[] = [];
  const preferredTemplate = { value: "" };
  let errors = 0;
  let metaErrors = 0;
  let cachedMetaCount = 0;
  let fetchedMetaCount = 0;
  const metaCache: MetaCache = skipMetadata ? {} : await store.readMetaCache();

  let processedCount = 0;
  for (let i = 0; i < raw.length; i += concurrency) {
    const batch = raw.slice(i, i + concurrency);

    // Announce the start of this batch so the UI gets a live "in flight" tick.
    yield {
      stage: "stats",
      current: processedCount,
      total,
      title: batch[0]?.title ?? "",
      message: `Processing ${i + 1}-${Math.min(i + concurrency, total)}/${total}`,
      cachedMetaCount,
      fetchedMetaCount,
    };

    const results = await Promise.all(
      batch.map((r) =>
        processOne(fetcher, buildId, { start, end }, r, preferredTemplate, metaCache, skipMetadata),
      ),
    );

    for (const p of results) {
      if (!p.detail) {
        errors++;
        processedCount++;
        continue;
      }
      const stat = buildModelStat(p, today);
      if (stat) models.push(stat);
      if (p.metaError) metaErrors++;
      if (!skipMetadata) {
        if (p.metaFromCache) cachedMetaCount++;
        else fetchedMetaCount++;
      }
      processedCount++;
    }

    yield {
      stage: "stats",
      current: processedCount,
      total,
      title: results[results.length - 1]?.title ?? "",
      message: `${processedCount}/${total}`,
      cachedMetaCount,
      fetchedMetaCount,
    };

    // Tiny gap between batches so we don't smash the upstream all at once.
    if (i + concurrency < raw.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const snapshot: Snapshot = {
    meta: {
      dateRange: { start, end },
      collectedAt: new Date().toISOString(),
      buildId,
      modelCount: models.length,
      errors,
      metaErrors,
      hasMetadata: !skipMetadata && metaErrors < raw.length,
    },
    models,
    ...(points ? { points } : {}),
  };

  if (!skipMetadata) {
    try {
      await store.flushMetaCache(metaCache);
    } catch {
      /* non-fatal */
    }
  }

  yield {
    stage: "done",
    message: "Done",
    snapshot,
    cachedMetaCount,
    fetchedMetaCount,
  };
  return snapshot;
}
