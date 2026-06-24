"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmt, fmt0 } from "@mw/core/format";
import type { ModelStat } from "@mw/core/types";
import { CHART_TOOLTIP } from "@mw/core/chartTheme";
import { DeltaBadge } from "../DeltaBadge";

const SRC_COLORS = ["#3fb9a6", "#e8902a", "#9b7dd6", "#5b9bd6", "#807461"];
const SRC_LABELS = ["Recommend", "Search", "Browse", "Direct", "Other"];

export function ModelXray({
  models,
  prevModels,
}: {
  models: ModelStat[];
  prevModels?: ModelStat[];
}) {
  const sorted = useMemo(() => [...models].sort((a, b) => b.view - a.view), [models]);
  const [id, setId] = useState<number>(sorted[0]?.id ?? 0);
  const d = sorted.find((m) => m.id === id) ?? sorted[0];
  const prev = useMemo(() => {
    if (!prevModels || !d) return null;
    return prevModels.find((m) => m.id === d.id) ?? null;
  }, [prevModels, d]);

  if (!d) return null;

  const stages: Array<[string, number, string]> = [
    ["Impressions", d.impr, "#3a2f22"],
    ["Views", d.view, "#3fb9a6"],
    ["Downloads", d.dl, "#e8902a"],
    ["Prints", d.print, "#d65a4a"],
  ];

  let prevStage = stages[0][1] || 1;

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Model X-ray</h2>
      <p className="mt-1 text-sm text-ink2">
        Pick a model: full conversion funnel and exact traffic-source split.
      </p>

      <select
        value={d.id}
        onChange={(e) => setId(Number(e.target.value))}
        className="mt-4 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs text-ink focus:border-teal focus:outline-none sm:w-auto"
      >
        {sorted.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title} · {fmt(m.view)} views
          </option>
        ))}
      </select>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="text-xs uppercase tracking-widest text-ink3">Conversion funnel</div>
          <div className="mt-3 space-y-1">
            {stages.map((s, i) => {
              const ratio = i === 0 ? 1 : prevStage ? s[1] / prevStage : 0;
              const w = i === 0 ? 100 : Math.max(ratio * 100, s[1] > 0 ? 4 : 0);
              const drop = i < stages.length - 1
                ? stages[i + 1][1] / (s[1] || 1) * 100
                : null;
              const node = (
                <div key={i}>
                  <div className="relative h-11 w-full overflow-hidden rounded-md">
                    <div className="absolute inset-0" style={{ background: s[2], opacity: 0.18 }} />
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${w}%`, background: s[2] }}
                    />
                    <div className="relative flex h-full items-center px-4 text-sm font-semibold text-ink">
                      <span className="h-archivo">{s[0]}</span>
                      <span className="h-archivo ml-auto">{fmt0(s[1])}</span>
                    </div>
                  </div>
                  {drop !== null && (
                    <div className="pl-4 pt-1 text-[10px] tracking-widest text-amber">
                      ↳ {drop.toFixed(drop < 1 ? 2 : 1)}% conversion
                    </div>
                  )}
                </div>
              );
              prevStage = s[1];
              return node;
            })}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            <Kv k="Collect" v={fmt0(d.collect)} current={d.collect} prev={prev?.collect} />
            <Kv k="Like" v={fmt0(d.like)} current={d.like} prev={prev?.like} />
            <Kv k="Points" v={fmt0(d.point)} current={d.point} prev={prev?.point} />
            <Kv k="Boost" v={fmt0(d.boost)} current={d.boost} prev={prev?.boost} />
            <Kv k="Category" v={d.category || d.cat} />
            <Kv k="Published" v={d.pub || "—"} />
          </div>

          {prev && (
            <div className="mt-4 rounded-md border border-amber/40 bg-panel2 px-3 py-2 text-[11px] text-ink2">
              <span className="text-[10px] uppercase tracking-widest text-amber">vs prev period</span>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span>
                  Views:{" "}
                  <DeltaBadge current={d.view} prev={prev.view} format="number" size="xs" showPrev />
                </span>
                <span>
                  Downloads:{" "}
                  <DeltaBadge current={d.dl} prev={prev.dl} format="number" size="xs" showPrev />
                </span>
                <span>
                  Prints:{" "}
                  <DeltaBadge current={d.print} prev={prev.print} format="number" size="xs" showPrev />
                </span>
                <span>
                  Impressions:{" "}
                  <DeltaBadge current={d.impr} prev={prev.impr} format="number" size="xs" showPrev />
                </span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Link
              href={`/models/${d.id}`}
              className="text-xs text-teal hover:underline"
            >
              Open full drill-down →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="text-xs uppercase tracking-widest text-ink3">Traffic source</div>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SRC_LABELS.map((name, i) => ({ name, value: d.ts[i] || 0 }))}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="#1d1812"
                >
                  {SRC_LABELS.map((_, i) => (
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
          <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px] text-ink2">
            {SRC_LABELS.map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: SRC_COLORS[i] }} />
                {l} {d.ts[i] || 0}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Kv({
  k,
  v,
  current,
  prev,
}: {
  k: string;
  v: string;
  current?: number;
  prev?: number;
}) {
  return (
    <div className="rounded-md border border-line bg-panel2 p-2">
      <div className="text-[9px] uppercase tracking-widest text-ink3">{k}</div>
      <div className="h-archivo mt-1 truncate text-sm font-bold text-ink">{v}</div>
      {current !== undefined && prev !== undefined && (
        <DeltaBadge current={current} prev={prev} format="number" size="xs" className="mt-0.5 block" />
      )}
    </div>
  );
}
