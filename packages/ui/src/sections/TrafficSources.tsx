"use client";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmt } from "@mw/core/format";
import type { TrafficSource } from "@mw/core/types";
import type { ModelStat } from "@mw/core/types";
import { CHART_TOOLTIP } from "@mw/core/chartTheme";
import { DeltaBadge } from "../DeltaBadge";

const SRC_COLORS = ["#3fb9a6", "#e8902a", "#9b7dd6", "#5b9bd6", "#807461"];
const SRC_LABELS = ["Recommend", "Search", "Browse", "Direct", "Other"];

export function TrafficSources({
  catalog,
  models,
  prevCatalog,
  prevModels,
}: {
  catalog: TrafficSource;
  models: ModelStat[];
  prevCatalog?: TrafficSource;
  prevModels?: ModelStat[];
}) {
  const [sel, setSel] = useState(0);
  const pieData = SRC_LABELS.map((name, i) => ({ name, value: catalog[i] || 0 }));

  const prevById = new Map<number, ModelStat>();
  for (const m of prevModels ?? []) prevById.set(m.id, m);

  const leaderboard = [...models]
    .map((m) => {
      const share = (m.ts[sel] / 100) * m.view;
      const prev = prevById.get(m.id);
      const prevShare = prev ? (prev.ts[sel] / 100) * prev.view : undefined;
      return { ...m, share, prevShare };
    })
    .sort((a, b) => b.share - a.share)
    .slice(0, 8);

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Traffic sources</h2>
      <p className="mt-1 text-sm text-ink2">
        Where the eyeballs come from. Recommend = the MakerWorld algorithm.
        Search = SEO is doing its job. Browse = catalogue surfing.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="text-xs uppercase tracking-widest text-ink3">Catalogue mix (weighted by views)</div>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#1d1812"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={SRC_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP.contentStyle}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  itemStyle={CHART_TOOLTIP.itemStyle}
                  formatter={(v: number) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {SRC_LABELS.map((l, i) => (
              <span key={l} className="flex items-center gap-1 text-ink2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: SRC_COLORS[i] }} />
                {l} {catalog[i] || 0}%
                {prevCatalog !== undefined && (
                  <DeltaBadge
                    current={catalog[i] || 0}
                    prev={prevCatalog[i] || 0}
                    format="pp"
                    size="xs"
                    className="ml-0.5"
                  />
                )}
              </span>
            ))}
          </div>

          {prevCatalog && (
            <div className="mt-4 border-t border-line/60 pt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-ink3">
                <span>Prev period mix</span>
                <span className="font-mono text-ink3">comparison</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full">
                {prevCatalog.map((v, i) =>
                  v > 0 ? (
                    <div
                      key={i}
                      title={`${SRC_LABELS[i]} ${v}%`}
                      style={{ width: `${v}%`, background: SRC_COLORS[i], opacity: 0.55 }}
                    />
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-ink3">Top 8 models for source</div>
            <select
              value={sel}
              onChange={(e) => setSel(Number(e.target.value))}
              className="rounded-md border border-line bg-panel2 px-2 py-1 font-mono text-xs text-ink focus:border-teal focus:outline-none"
            >
              {SRC_LABELS.map((l, i) => (
                <option key={l} value={i}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <ol className="mt-3 space-y-2 text-sm">
            {leaderboard.map((m, i) => (
              <li key={m.id} className="flex items-center justify-between border-b border-line/60 pb-1 last:border-none">
                <span className="truncate pr-3 text-ink">
                  <span className="text-ink3">{i + 1}.</span> {m.title}
                </span>
                <span className="flex shrink-0 items-baseline gap-2 font-mono text-xs text-ink2">
                  <span>
                    {fmt(Math.round(m.share))}{" "}
                    <span className="text-ink3">· {m.ts[sel]}%</span>
                  </span>
                  {m.prevShare !== undefined && (
                    <DeltaBadge
                      current={m.share}
                      prev={m.prevShare}
                      format="number"
                      size="xs"
                    />
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
