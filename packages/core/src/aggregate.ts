import type { ModelStat, TrafficSource, PointsData, PointsSummary } from "./types";

export interface Totals {
  impr: number;
  view: number;
  dl: number;
  print: number;
  collect: number;
  like: number;
  count: number;
}

export function totals(models: ModelStat[]): Totals {
  const t: Totals = { impr: 0, view: 0, dl: 0, print: 0, collect: 0, like: 0, count: models.length };
  for (const m of models) {
    t.impr += m.impr;
    t.view += m.view;
    t.dl += m.dl;
    t.print += m.print;
    t.collect += m.collect;
    t.like += m.like;
  }
  return t;
}

export interface CategoryAgg {
  name: string;
  count: number;
  view: number;
  impr: number;
  dl: number;
  print: number;
  like: number;
  collect: number;
  ts: TrafficSource;
}

export function byCategory(
  models: ModelStat[],
  field: "category" | "cat" = "category",
): CategoryAgg[] {
  const map = new Map<string, CategoryAgg>();
  for (const m of models) {
    const k = m[field] || "Uncategorized";
    let a = map.get(k);
    if (!a) {
      a = {
        name: k,
        count: 0,
        view: 0,
        impr: 0,
        dl: 0,
        print: 0,
        like: 0,
        collect: 0,
        ts: [0, 0, 0, 0, 0],
      };
      map.set(k, a);
    }
    a.count++;
    a.view += m.view;
    a.impr += m.impr;
    a.dl += m.dl;
    a.print += m.print;
    a.like += m.like;
    a.collect += m.collect;
    for (let i = 0; i < 5; i++) a.ts[i] += m.ts[i] * m.view;
  }
  return [...map.values()]
    .map((a) => {
      const totalViewWeight = a.view || 1;
      const ts = a.ts.map((v) => Math.round((v / totalViewWeight) * 10) / 10) as TrafficSource;
      return { ...a, ts };
    })
    .sort((a, b) => b.view - a.view);
}

// ---------- Reward points / boost ----------

// How many reward points a single boost is worth, by model status. MakerWorld
// keeps boosts as a separate count and converts them to points; these rates can
// change over time, so they live here as the single source of truth.
export const BOOST_POINTS = { regular: 12, exclusive: 15 } as const;

export interface PointsBreakdown {
  pointRegular: number;
  pointExclusive: number;
  /** Raw boost counts. */
  boostRegular: number;
  boostExclusive: number;
  /** Boost counts converted to points via BOOST_POINTS. */
  boostRegularPts: number;
  boostExclusivePts: number;
  /** Native points only (regular + exclusive), matching MakerWorld's headline. */
  totalPoints: number;
  /** Raw boost count (regular + exclusive). */
  totalBoost: number;
  /** Boost expressed in points (regular + exclusive). */
  totalBoostPts: number;
  /** Everything in points: native points + boost-as-points. */
  grandTotalPoints: number;
}

export function pointsBreakdown(summary: PointsSummary): PointsBreakdown {
  const boostRegularPts = summary.boostRegular * BOOST_POINTS.regular;
  const boostExclusivePts = summary.boostExclusive * BOOST_POINTS.exclusive;
  const totalPoints = summary.pointRegular + summary.pointExclusive;
  const totalBoostPts = boostRegularPts + boostExclusivePts;
  return {
    pointRegular: summary.pointRegular,
    pointExclusive: summary.pointExclusive,
    boostRegular: summary.boostRegular,
    boostExclusive: summary.boostExclusive,
    boostRegularPts,
    boostExclusivePts,
    totalPoints,
    totalBoost: summary.boostRegular + summary.boostExclusive,
    totalBoostPts,
    grandTotalPoints: totalPoints + totalBoostPts,
  };
}

export interface PointsDailyPoint {
  date: string;
  pointRegular: number;
  pointExclusive: number;
  boostRegularPts: number;
  boostExclusivePts: number;
  total: number;
}

/** Daily series for the stacked chart: the 4 point sources (boosts already converted
 *  to points) plus their per-day total. */
export function pointsDailySeries(data: PointsData): PointsDailyPoint[] {
  return data.daily.map((d) => {
    const boostRegularPts = d.boostRegular * BOOST_POINTS.regular;
    const boostExclusivePts = d.boostExclusive * BOOST_POINTS.exclusive;
    return {
      date: d.date,
      pointRegular: d.pointRegular,
      pointExclusive: d.pointExclusive,
      boostRegularPts,
      boostExclusivePts,
      total: d.pointRegular + d.pointExclusive + boostRegularPts + boostExclusivePts,
    };
  });
}

export function trafficMixCatalog(models: ModelStat[]): TrafficSource {
  const acc: TrafficSource = [0, 0, 0, 0, 0];
  let w = 0;
  for (const m of models) {
    for (let i = 0; i < 5; i++) acc[i] += m.ts[i] * m.view;
    w += m.view;
  }
  if (!w) return acc;
  return acc.map((v) => Math.round((v / w) * 10) / 10) as TrafficSource;
}
