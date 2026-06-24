import { ageColor } from "@mw/core/chartTheme";
import type { ModelStat } from "@mw/core/types";

const BUCKETS: Array<{ key: "fresh" | "young" | "mature" | "established" | "veteran"; label: string; max: number; color: string }> = [
  { key: "fresh", label: "Fresh", max: 30, color: "#3fb9a6" },
  { key: "young", label: "Young", max: 90, color: "#7dd6a4" },
  { key: "mature", label: "Mature", max: 180, color: "#e8c54a" },
  { key: "established", label: "Established", max: 365, color: "#e8902a" },
  { key: "veteran", label: "Veteran", max: Infinity, color: "#d65a4a" },
];

function bucketIndex(days: number): number {
  for (let i = 0; i < BUCKETS.length; i++) if (days <= BUCKETS[i].max) return i;
  return BUCKETS.length - 1;
}

function fmtAge(d: number): string {
  if (d < 365) return `${d}d`;
  const years = d / 365;
  return years < 10 ? `${years.toFixed(1)}y` : `${Math.round(years)}y`;
}

export function PortfolioAge({ models }: { models: ModelStat[] }) {
  const ages = models
    .map((m) => m.ageDays)
    .filter((d): d is number => d != null && d > 0);

  if (ages.length === 0) return null;

  const sorted = [...ages].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const avg = Math.round(ages.reduce((s, a) => s + a, 0) / ages.length);
  const youngest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  const counts = [0, 0, 0, 0, 0];
  for (const a of ages) counts[bucketIndex(a)]++;
  const total = ages.length;

  const { color: medianColor, label: medianLabel } = ageColor(median);

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="h-archivo text-lg font-bold text-ink">Portfolio age</h2>
        <span className="text-[11px] text-ink3">
          {total} model{total === 1 ? "" : "s"} with publish date · youngest {fmtAge(youngest)} · oldest {fmtAge(oldest)}
        </span>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
        <div className="flex items-baseline gap-6 sm:flex-col sm:items-start sm:gap-1">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink3">Median</div>
            <div className="h-archivo text-4xl font-extrabold leading-none" style={{ color: medianColor }}>
              {fmtAge(median)}
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: medianColor }}
            >
              {medianLabel}
            </div>
          </div>
          <div className="text-[11px] text-ink3 sm:mt-2">
            Mean: <span className="font-mono text-ink2">{fmtAge(avg)}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] uppercase tracking-widest text-ink3">Distribution</div>
          <div className="flex h-5 w-full overflow-hidden rounded-full">
            {BUCKETS.map((b, i) =>
              counts[i] > 0 ? (
                <div
                  key={b.key}
                  className="transition-all"
                  style={{ background: b.color, width: `${(counts[i] / total) * 100}%` }}
                  title={`${b.label}: ${counts[i]} (${Math.round((counts[i] / total) * 100)}%)`}
                />
              ) : null,
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink2">
            {BUCKETS.map((b, i) => (
              <span key={b.key} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: b.color }} />
                <span>{b.label}</span>
                <span className="font-mono text-ink3">
                  {counts[i]}
                  {counts[i] > 0 && ` · ${Math.round((counts[i] / total) * 100)}%`}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
