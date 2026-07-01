// Parse the reward points/boost block from MakerWorld's data-overview payload.
// This lives in `pageProps.statisticalData` of the model-list response we already
// fetch, so no extra network request is needed — we just stopped discarding it.
import type { PointsData } from "../types";

const num = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/** "2026/05/29" → "2026-05-29". Leaves already-dashed dates untouched. */
function normalizeDate(v: unknown): string {
  const s = typeof v === "string" ? v.trim().slice(0, 10) : "";
  return s.replace(/\//g, "-");
}

interface StatSummary {
  pointRegular?: number | string;
  pointExclusive?: number | string;
  boostRegular?: number | string;
  boostExclusive?: number | string;
}

interface StatDaily {
  intervalVal?: string;
  pointFromModelRegular?: number | string;
  pointFromModelExclusive?: number | string;
  pointFromInstRegular?: number | string;
  pointFromInstExclusive?: number | string;
  boostRegular?: number | string;
  boostExclusive?: number | string;
}

interface StatisticalData {
  summary?: StatSummary;
  dateList?: StatDaily[];
}

/** Build a PointsData from the raw `statisticalData`. Returns null when the block
 *  is missing or carries no usable signal (so callers can leave Snapshot.points unset). */
export function parsePointsData(statisticalData: unknown): PointsData | null {
  if (!statisticalData || typeof statisticalData !== "object") return null;
  const sd = statisticalData as StatisticalData;
  const s = sd.summary ?? {};

  const summary = {
    pointRegular: num(s.pointRegular),
    pointExclusive: num(s.pointExclusive),
    boostRegular: num(s.boostRegular),
    boostExclusive: num(s.boostExclusive),
  };

  const daily = (Array.isArray(sd.dateList) ? sd.dateList : []).map((d) => ({
    date: normalizeDate(d.intervalVal),
    // A model's points come from two streams (model downloads + print instances);
    // sum both to get the per-day regular/exclusive points.
    pointRegular: num(d.pointFromModelRegular) + num(d.pointFromInstRegular),
    pointExclusive: num(d.pointFromModelExclusive) + num(d.pointFromInstExclusive),
    boostRegular: num(d.boostRegular),
    boostExclusive: num(d.boostExclusive),
  }));

  const hasSignal =
    summary.pointRegular ||
    summary.pointExclusive ||
    summary.boostRegular ||
    summary.boostExclusive ||
    daily.length > 0;
  if (!hasSignal) return null;

  return { summary, daily };
}
