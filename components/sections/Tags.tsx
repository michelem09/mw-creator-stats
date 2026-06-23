"use client";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/format";
import type { ModelStat } from "@/lib/types";
import { CHART_TOOLTIP } from "@/lib/chartTheme";

export function Tags({ models }: { models: ModelStat[] }) {
  const { topUsed, bestAvg } = useMemo(() => {
    const counter = new Map<string, { count: number; totalView: number }>();
    for (const m of models) {
      for (const tag of m.tags || []) {
        const t = tag.trim().toLowerCase();
        if (!t) continue;
        const e = counter.get(t) || { count: 0, totalView: 0 };
        e.count++;
        e.totalView += m.view;
        counter.set(t, e);
      }
    }
    const arr = [...counter.entries()].map(([tag, v]) => ({
      tag,
      count: v.count,
      avgView: Math.round(v.totalView / v.count),
    }));
    return {
      topUsed: [...arr].sort((a, b) => b.count - a.count).slice(0, 12),
      bestAvg: arr.filter((x) => x.count >= 3).sort((a, b) => b.avgView - a.avgView).slice(0, 12),
    };
  }, [models]);

  if (!topUsed.length) return null;

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Tags</h2>
      <p className="mt-1 text-sm text-ink2">
        Which tags you use the most vs. which tags actually pull traffic.
        (Best-avg needs ≥3 models on the tag to count.)
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Most used" data={topUsed} dataKey="count" color="#9b7dd6" />
        <Panel title="Best avg views per model" data={bestAvg} dataKey="avgView" color="#3fb9a6" />
      </div>
    </section>
  );
}

function Panel<T extends { tag: string }>({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: T[];
  dataKey: keyof T;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 text-xs uppercase tracking-widest text-ink3">{title}</div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#332a1f" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#807461", fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="tag"
              width={100}
              tick={{ fill: "#b9ad99", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP.contentStyle}
              labelStyle={CHART_TOOLTIP.labelStyle}
              itemStyle={CHART_TOOLTIP.itemStyle}
              formatter={(v: number) => fmt(v)}
            />
            <Bar dataKey={dataKey as string} fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
