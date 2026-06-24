import type { ModelStat, TrafficSource } from "./types";

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
