import type { CompareMode, ModelStat } from "./types";

export interface DateRange {
  start: string;
  end: string;
}

const MS_DAY = 86_400_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_DAY);
}

/** Same length, immediately before the given range.
 *  e.g. 2026-05-23 → 2026-06-22 (31d) → 2026-04-22 → 2026-05-22. */
export function prevPeriodOf(r: DateRange): DateRange {
  if (!ISO_RE.test(r.start) || !ISO_RE.test(r.end)) {
    throw new Error(`Invalid range: ${r.start}..${r.end}`);
  }
  const s = parseDate(r.start);
  const e = parseDate(r.end);
  const lenDays = dayDiff(e, s); // inclusive length - 1
  const newEnd = new Date(s.getTime() - MS_DAY);
  const newStart = new Date(newEnd.getTime() - lenDays * MS_DAY);
  return { start: formatDate(newStart), end: formatDate(newEnd) };
}

/** Same range shifted back by exactly 365 days. */
export function prevYearOf(r: DateRange): DateRange {
  if (!ISO_RE.test(r.start) || !ISO_RE.test(r.end)) {
    throw new Error(`Invalid range: ${r.start}..${r.end}`);
  }
  const s = parseDate(r.start);
  const e = parseDate(r.end);
  return {
    start: formatDate(new Date(s.getTime() - 365 * MS_DAY)),
    end: formatDate(new Date(e.getTime() - 365 * MS_DAY)),
  };
}

/** Resolves the compare range to use given the current mode, main range, and custom override. */
export function pickPrevRange(
  mode: CompareMode,
  mainRange: DateRange,
  customRange: DateRange | null,
): DateRange | null {
  switch (mode) {
    case "none":
      return null;
    case "prevPeriod":
      return prevPeriodOf(mainRange);
    case "prevYear":
      return prevYearOf(mainRange);
    case "custom":
      return customRange;
  }
}

export interface DeltaResult {
  current: number;
  prev: number | undefined;
  deltaAbs: number | null;
  deltaPct: number | null;
  // Number of percentage points difference (when comparing two percentages).
  deltaPp: number | null;
}

/** Returns delta% from prev to current. Null when prev is undefined or 0 and current is also 0.
 *  When prev === 0 and current > 0, deltaPct returns +Infinity-like sentinel (`null`) — caller can show "new". */
export function diffNumber(current: number, prev: number | undefined): DeltaResult {
  if (prev === undefined) {
    return { current, prev, deltaAbs: null, deltaPct: null, deltaPp: null };
  }
  const deltaAbs = current - prev;
  const deltaPct = prev !== 0 ? (deltaAbs / prev) * 100 : null;
  const deltaPp = deltaAbs; // identity for percentage-point math
  return { current, prev, deltaAbs, deltaPct, deltaPp };
}

export interface ModelPair {
  current: ModelStat;
  prev: ModelStat | null;
}

/** Pairs models from current and prev periods by id. Models present only in current keep prev=null. */
export function pairModelsById(current: ModelStat[], prev: ModelStat[]): ModelPair[] {
  const prevById = new Map<number, ModelStat>();
  for (const m of prev) prevById.set(m.id, m);
  return current.map((m) => ({ current: m, prev: prevById.get(m.id) ?? null }));
}

export interface MoverEntry {
  id: number;
  title: string;
  category: string;
  current: number;
  prev: number;
  delta: number;
  deltaPct: number;
}

/** Top N models sorted by |Δviews|. Models present only in current count as new (+100%). */
export function biggestMoversByViews(
  current: ModelStat[],
  prev: ModelStat[],
  n = 12,
): MoverEntry[] {
  const pairs = pairModelsById(current, prev);
  // Include models that disappeared too (present in prev, absent now).
  const currentIds = new Set(current.map((m) => m.id));
  const dropped: ModelPair[] = prev
    .filter((m) => !currentIds.has(m.id))
    .map((m) => ({ current: { ...m, view: 0 }, prev: m }));

  const all = [...pairs, ...dropped];
  const entries: MoverEntry[] = all.map(({ current: c, prev: p }) => {
    const cv = c.view;
    const pv = p?.view ?? 0;
    const delta = cv - pv;
    const deltaPct = pv ? (delta / pv) * 100 : cv > 0 ? 100 : 0;
    return {
      id: c.id,
      title: c.title,
      category: c.category || c.cat || "Uncategorized",
      current: cv,
      prev: pv,
      delta,
      deltaPct,
    };
  });

  return entries
    .filter((e) => e.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, n);
}
