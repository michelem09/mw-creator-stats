"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TOOLTIP } from "@mw/core/chartTheme";
import { biggestMoversByViews, type MoverEntry } from "@mw/core/compare";
import { fmt } from "@mw/core/format";
import type { ModelStat } from "@mw/core/types";

export function BiggestMovers({
  models,
  prevModels,
}: {
  models: ModelStat[];
  prevModels: ModelStat[];
}) {
  const router = useRouter();
  const movers = useMemo(() => biggestMoversByViews(models, prevModels, 12), [models, prevModels]);

  if (movers.length === 0) return null;

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Biggest movers</h2>
      <p className="mt-1 text-sm text-ink2">
        Top 12 models by absolute change in views vs. the comparison period.
        Green = up, red = down. Click a bar to drill into the model.
      </p>

      <div className="mt-4 rounded-xl border border-line bg-panel p-4">
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={movers}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              onClick={(state) => {
                const idx = state?.activeTooltipIndex;
                if (typeof idx === "number" && movers[idx]) {
                  router.push(`/models/${movers[idx].id}`);
                }
              }}
            >
              <CartesianGrid stroke="#332a1f" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#807461", fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="title"
                width={180}
                tick={{ fill: "#b9ad99", fontSize: 10 }}
                tickFormatter={(t: string) => (t.length > 26 ? t.slice(0, 24) + "…" : t)}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) =>
                  active && payload && payload.length ? (
                    <MoverTooltip entry={payload[0].payload as MoverEntry} />
                  ) : null
                }
              />
              <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                {movers.map((m) => (
                  <Cell key={m.id} fill={m.delta >= 0 ? "#3fb9a6" : "#d65a4a"} cursor="pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-ink3">
              <tr>
                <th className="px-2 py-1 text-left">Model</th>
                <th className="px-2 py-1 text-right">Prev views</th>
                <th className="px-2 py-1 text-right">Current views</th>
                <th className="px-2 py-1 text-right">Δ</th>
                <th className="px-2 py-1 text-right">Δ%</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((m) => (
                <tr key={m.id} className="border-t border-line/60">
                  <td className="px-2 py-1">
                    <Link href={`/models/${m.id}`} className="text-ink hover:text-teal">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(m.prev)}</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(m.current)}</td>
                  <td className={`px-2 py-1 text-right font-mono ${m.delta >= 0 ? "text-teal" : "text-red"}`}>
                    {m.delta >= 0 ? "+" : ""}{fmt(m.delta)}
                  </td>
                  <td className={`px-2 py-1 text-right font-mono ${m.deltaPct >= 0 ? "text-teal" : "text-red"}`}>
                    {m.deltaPct >= 0 ? "+" : ""}{m.deltaPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MoverTooltip({ entry }: { entry: MoverEntry }) {
  const positive = entry.delta >= 0;
  return (
    <div
      style={CHART_TOOLTIP.contentStyle}
      className="rounded-lg border border-line bg-panel p-2 text-xs shadow-lg"
    >
      <div className="h-archivo mb-1 font-bold">{entry.title}</div>
      <div className="text-ink3">{entry.category}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-ink3">Prev views</span>
        <span className="text-right font-mono">{fmt(entry.prev)}</span>
        <span className="text-ink3">Current views</span>
        <span className="text-right font-mono">{fmt(entry.current)}</span>
        <span className="text-ink3">Δ</span>
        <span className={`text-right font-mono ${positive ? "text-teal" : "text-red"}`}>
          {positive ? "+" : ""}{fmt(entry.delta)} ({positive ? "+" : ""}{entry.deltaPct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
