import { byCategory, totals, trafficMixCatalog } from "../aggregate";
import { biggestMoversByViews } from "../compare";
import type { ModelStat, Snapshot } from "../types";

// Shape of the curated digest sent to the AI when mode = "fast".
// Keep it small (~5KB) and structured so the model can cite exact numbers.

interface ModelMini {
  id: number;
  title: string;
  category: string;
  views: number;
  downloads: number;
  prints: number;
  crv: number; // %
  crd: number; // %
  points: number;
  pub: string;
  ageDays: number | null;
  viewsPerDay: number | null;
  trafficMix: number[];
}

function mini(m: ModelStat): ModelMini {
  return {
    id: m.id,
    title: m.title,
    category: m.category || m.cat || "Uncategorized",
    views: m.view,
    downloads: m.dl,
    prints: m.print,
    crv: m.impr ? +((m.view / m.impr) * 100).toFixed(2) : 0,
    crd: m.view ? +((m.dl / m.view) * 100).toFixed(2) : 0,
    points: m.point,
    pub: m.pub,
    ageDays: m.ageDays,
    viewsPerDay: m.viewPerDay,
    trafficMix: m.ts,
  };
}

function ageBuckets(models: ModelStat[]) {
  const buckets = { fresh: 0, young: 0, mature: 0, established: 0, veteran: 0 };
  for (const m of models) {
    const a = m.ageDays;
    if (a == null) continue;
    if (a <= 30) buckets.fresh++;
    else if (a <= 90) buckets.young++;
    else if (a <= 180) buckets.mature++;
    else if (a <= 365) buckets.established++;
    else buckets.veteran++;
  }
  return buckets;
}

function topTags(models: ModelStat[], n = 15) {
  const counts = new Map<string, { count: number; totalViews: number }>();
  for (const m of models) {
    for (const tag of m.tags || []) {
      const t = tag.trim().toLowerCase();
      if (!t) continue;
      const e = counts.get(t) ?? { count: 0, totalViews: 0 };
      e.count++;
      e.totalViews += m.view;
      counts.set(t, e);
    }
  }
  return [...counts.entries()]
    .map(([tag, v]) => ({ tag, count: v.count, avgViews: Math.round(v.totalViews / v.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function periodDigest(snap: Snapshot) {
  const t = totals(snap.models);
  const cats = byCategory(snap.models, snap.meta.hasMetadata ? "category" : "cat").map((c) => ({
    name: c.name,
    count: c.count,
    views: c.view,
    downloads: c.dl,
    prints: c.print,
    crv: c.impr ? +((c.view / c.impr) * 100).toFixed(2) : 0,
    crd: c.view ? +((c.dl / c.view) * 100).toFixed(2) : 0,
    trafficMix: c.ts,
  }));
  const sorted = [...snap.models].sort((a, b) => b.view - a.view);
  const top = sorted.slice(0, 10).map(mini);
  const bottom = [...snap.models]
    .filter((m) => m.impr > 100) // only models with meaningful exposure
    .sort((a, b) => (a.impr ? a.view / a.impr : 0) - (b.impr ? b.view / b.impr : 0))
    .slice(0, 10)
    .map(mini);

  return {
    dateRange: snap.meta.dateRange,
    totals: {
      impressions: t.impr,
      views: t.view,
      downloads: t.dl,
      prints: t.print,
      collects: t.collect,
      likes: t.like,
      models: t.count,
      catalogCrv: t.impr ? +((t.view / t.impr) * 100).toFixed(2) : 0,
      catalogCrd: t.view ? +((t.dl / t.view) * 100).toFixed(2) : 0,
    },
    trafficMixCatalog: trafficMixCatalog(snap.models),
    categories: cats,
    topModelsByViews: top,
    worstConversionModels: bottom,
    topTags: topTags(snap.models, 15),
    ageBuckets: ageBuckets(snap.models),
  };
}

export interface FastDigest {
  trafficSourceLabels: string[];
  current: ReturnType<typeof periodDigest>;
  previous?: ReturnType<typeof periodDigest>;
  biggestMovers?: ReturnType<typeof biggestMoversByViews>;
}

export function buildFastDigest(snap: Snapshot, prev?: Snapshot | null): FastDigest {
  const out: FastDigest = {
    trafficSourceLabels: ["recommend", "search", "browse", "directUrl", "other"],
    current: periodDigest(snap),
  };
  if (prev) {
    out.previous = periodDigest(prev);
    out.biggestMovers = biggestMoversByViews(snap.models, prev.models, 10);
  }
  return out;
}

export function buildModelFocusDigest(
  snap: Snapshot,
  modelId: number,
  prev?: Snapshot | null,
) {
  const m = snap.models.find((x) => x.id === modelId);
  if (!m) return null;
  const p = prev?.models.find((x) => x.id === modelId) ?? null;
  const cats = byCategory(snap.models, snap.meta.hasMetadata ? "category" : "cat");
  const cat = cats.find((c) => c.name === (m.category || m.cat || "Uncategorized"));
  const t = totals(snap.models);
  return {
    trafficSourceLabels: ["recommend", "search", "browse", "directUrl", "other"],
    dateRange: snap.meta.dateRange,
    model: mini(m),
    modelFull: {
      tags: m.tags,
      license: m.license,
      instances: m.instances,
      cover: m.cover,
    },
    previous: p ? mini(p) : null,
    catalogReference: {
      totalModels: t.count,
      catalogCrv: t.impr ? +((t.view / t.impr) * 100).toFixed(2) : 0,
      catalogCrd: t.view ? +((t.dl / t.view) * 100).toFixed(2) : 0,
      avgViewsPerModel: t.count ? Math.round(t.view / t.count) : 0,
    },
    categoryReference: cat
      ? {
          name: cat.name,
          modelsInCategory: cat.count,
          categoryViews: cat.view,
          categoryCrv: cat.impr ? +((cat.view / cat.impr) * 100).toFixed(2) : 0,
          categoryCrd: cat.view ? +((cat.dl / cat.view) * 100).toFixed(2) : 0,
          trafficMix: cat.ts,
        }
      : null,
  };
}

/** Returns the full snapshot pair as-is (precise mode), minus a few noise fields. */
export function buildFullPayload(snap: Snapshot, prev?: Snapshot | null) {
  return {
    current: snap,
    previous: prev ?? null,
  };
}

/** Approximate JSON-stringified size in bytes for UI hints. */
export function payloadSizeBytes(obj: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return 0;
  }
}
