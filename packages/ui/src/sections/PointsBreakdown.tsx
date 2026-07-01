"use client";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "@mw/core/format";
import { pointsDailySeries, BOOST_POINTS } from "@mw/core/aggregate";
import { CHART_TOOLTIP, POINTS_SOURCE_COLORS } from "@mw/core/chartTheme";
import type { PointsData } from "@mw/core/types";

const SERIES = [
  { key: "pointRegular", label: "Points · Regular", color: POINTS_SOURCE_COLORS.pointRegular },
  { key: "pointExclusive", label: "Points · Exclusive", color: POINTS_SOURCE_COLORS.pointExclusive },
  { key: "boostRegularPts", label: `Boost · Regular (×${BOOST_POINTS.regular})`, color: POINTS_SOURCE_COLORS.boostRegular },
  { key: "boostExclusivePts", label: `Boost · Exclusive (×${BOOST_POINTS.exclusive})`, color: POINTS_SOURCE_COLORS.boostExclusive },
] as const;

/** "2026-05-29" → "05-29" for compact axis ticks. */
const shortDate = (d: string) => (d.length >= 10 ? d.slice(5) : d);

export function PointsBreakdown({ points }: { points: PointsData }) {
  const data = useMemo(() => pointsDailySeries(points), [points]);

  if (!data.length) return null;

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Points & Boost over time</h2>
      <p className="mt-1 text-sm text-ink2">
        Daily reward points by source, with boosts converted to points (regular ×
        {BOOST_POINTS.regular}, exclusive ×{BOOST_POINTS.exclusive}). Stacked height is the
        day&apos;s total points-equivalent.
      </p>
      <div className="mt-4 rounded-xl border border-line bg-panel p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#332a1f" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fill: "#807461", fontSize: 10 }}
                minTickGap={24}
              />
              <YAxis tick={{ fill: "#807461", fontSize: 10 }} tickFormatter={(v: number) => fmt(v)} />
              <Tooltip
                contentStyle={CHART_TOOLTIP.contentStyle}
                labelStyle={CHART_TOOLTIP.labelStyle}
                itemStyle={CHART_TOOLTIP.itemStyle}
                cursor={CHART_TOOLTIP.cursor}
                content={({ active, payload, label }) =>
                  active && payload && payload.length ? (
                    <PointsTooltip
                      date={String(label)}
                      payload={payload as Array<{ dataKey?: string | number; value?: number | string; name?: string }>}
                    />
                  ) : null
                }
              />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stackId="pts"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.55}
                  name={s.label}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink2">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PointsTooltip({
  date,
  payload,
}: {
  date: string;
  payload: Array<{ dataKey?: string | number; value?: number | string; name?: string }>;
}) {
  const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-lg border border-line bg-panel p-2 text-xs text-ink shadow-lg">
      <div className="h-archivo mb-1 font-bold">{date}</div>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
        {SERIES.map((s) => {
          const v = Number(payload.find((p) => p.dataKey === s.key)?.value) || 0;
          return (
            <div key={s.key} className="contents">
              <span className="flex items-center gap-1.5 text-ink2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-right font-mono">{fmt(v)}</span>
            </div>
          );
        })}
        <span className="mt-0.5 border-t border-line pt-0.5 font-semibold">Total</span>
        <span className="mt-0.5 border-t border-line pt-0.5 text-right font-mono font-semibold">
          {fmt(total)}
        </span>
      </div>
    </div>
  );
}
