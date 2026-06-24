"use client";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { fmt } from "@mw/core/format";
import { CHART_TOOLTIP, categoryColor } from "@mw/core/chartTheme";
import type { ModelStat } from "@mw/core/types";

export function Recency({ models }: { models: ModelStat[] }) {
  const items = useMemo(
    () => models.filter((m) => m.ageDays != null && m.viewPerDay != null),
    [models],
  );

  if (!items.length) return null;

  const top = [...items]
    .sort((a, b) => (b.viewPerDay ?? 0) - (a.viewPerDay ?? 0))
    .slice(0, 10)
    .map((m) => ({
      name: m.title.slice(0, 30),
      v: m.viewPerDay ?? 0,
      category: m.category || m.cat || "Uncategorized",
    }));

  const scatter = items.map((m) => ({
    age: m.ageDays,
    viewsPerDay: m.viewPerDay,
    totalViews: m.view,
    title: m.title,
    category: m.category || m.cat || "Uncategorized",
  }));

  // Legend entries: unique categories present in the scatter data.
  const legend = useMemo(() => {
    const seen = new Map<string, number>();
    for (const s of scatter) seen.set(s.category, (seen.get(s.category) ?? 0) + 1);
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, color: categoryColor(name) }));
  }, [scatter]);

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Recency</h2>
      <p className="mt-1 text-sm text-ink2">
        Recency-normalised performance. Views/day strips out the head-start old
        models get from sheer time on the platform.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-ink3">
            Top 10 views/day
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid stroke="#332a1f" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#807461", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fill: "#b9ad99", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP.contentStyle}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  itemStyle={CHART_TOOLTIP.itemStyle}
                  cursor={CHART_TOOLTIP.cursor}
                  formatter={(v: number) => [`${fmt(v)} / day`, "Views/day"]}
                />
                <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                  {top.map((t, i) => (
                    <Cell key={i} fill={categoryColor(t.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-ink3">
            Age vs views/day (bubble = total views)
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#332a1f" />
                <XAxis
                  type="number"
                  dataKey="age"
                  name="Age"
                  tick={{ fill: "#807461", fontSize: 10 }}
                  unit="d"
                />
                <YAxis
                  type="number"
                  dataKey="viewsPerDay"
                  name="Views/day"
                  tick={{ fill: "#807461", fontSize: 10 }}
                />
                <ZAxis dataKey="totalViews" name="Total views" range={[40, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={CHART_TOOLTIP.contentStyle}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  itemStyle={CHART_TOOLTIP.itemStyle}
                  formatter={(value, name) => {
                    if (name === "Views/day") return [`${fmt(value as number)} / day`, name];
                    if (name === "Total views") return [fmt(value as number), name];
                    return [value as number, name];
                  }}
                  labelFormatter={() => ""}
                  content={({ active, payload }) =>
                    active && payload && payload.length ? (
                      <ScatterTooltip payload={payload as Array<{ payload: typeof scatter[number] }>} />
                    ) : null
                  }
                />
                <Scatter data={scatter} fillOpacity={0.85}>
                  {scatter.map((p, i) => (
                    <Cell key={i} fill={categoryColor(p.category)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {legend.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink2">
              {legend.slice(0, 12).map((l) => (
                <span key={l.name} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.name} ({l.count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScatterTooltip({
  payload,
}: {
  payload: Array<{ payload: { age: number | null; viewsPerDay: number | null; totalViews: number; title: string; category: string } }>;
}) {
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-line bg-panel p-2 text-xs text-ink shadow-lg">
      <div className="h-archivo mb-1 font-bold">{d.title}</div>
      <div className="text-ink3">{d.category}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-ink3">Age</span>
        <span className="text-right font-mono">{d.age}d</span>
        <span className="text-ink3">Views/day</span>
        <span className="text-right font-mono">{fmt(d.viewsPerDay ?? 0)}</span>
        <span className="text-ink3">Total views</span>
        <span className="text-right font-mono">{fmt(d.totalViews)}</span>
      </div>
    </div>
  );
}
