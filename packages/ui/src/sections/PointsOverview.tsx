import { fmt } from "@mw/core/format";
import { pointsBreakdown } from "@mw/core/aggregate";
import { POINTS_SOURCE_COLORS } from "@mw/core/chartTheme";
import type { PointsSummary } from "@mw/core/types";
import { DeltaBadge } from "../DeltaBadge";

function Split({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-ink2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-mono text-ink">{fmt(value)}</span>
    </div>
  );
}

/** Two headline reward cards: total points and total boost, each split into the
 *  regular and MakerWorld-exclusive components. */
export function PointsOverview({
  summary,
  prev,
}: {
  summary: PointsSummary;
  prev?: PointsSummary;
}) {
  const b = pointsBreakdown(summary);
  const p = prev ? pointsBreakdown(prev) : undefined;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] uppercase tracking-widest text-ink3">Total Points</div>
          {p && <DeltaBadge current={b.totalPoints} prev={p.totalPoints} format="number" size="xs" showPrev />}
        </div>
        <div className="h-archivo mt-2 text-3xl font-extrabold text-teal">{fmt(b.totalPoints)}</div>
        <div className="mt-3 space-y-1 text-xs">
          <Split color={POINTS_SOURCE_COLORS.pointRegular} label="Regular" value={b.pointRegular} />
          <Split color={POINTS_SOURCE_COLORS.pointExclusive} label="Exclusive" value={b.pointExclusive} />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] uppercase tracking-widest text-ink3">Total Boost</div>
          {p && <DeltaBadge current={b.totalBoost} prev={p.totalBoost} format="number" size="xs" showPrev />}
        </div>
        <div className="h-archivo mt-2 text-3xl font-extrabold text-violet">
          {fmt(b.totalBoost)}
          <span className="ml-2 text-sm font-semibold text-ink3">≈ {fmt(b.totalBoostPts)} pts</span>
        </div>
        <div className="mt-3 space-y-1 text-xs">
          <Split color={POINTS_SOURCE_COLORS.boostRegular} label="Regular" value={b.boostRegular} />
          <Split color={POINTS_SOURCE_COLORS.boostExclusive} label="Exclusive" value={b.boostExclusive} />
        </div>
      </div>
    </section>
  );
}
