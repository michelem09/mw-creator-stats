"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { NavLink } from "./nav";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { CompareToggle } from "./CompareToggle";
import { DeltaBadge } from "./DeltaBadge";
import { AIDrawer } from "./AIDrawer";
import { useAI } from "./AIProvider";
import { fmt, fmt0, pct, daysAgo, today } from "@mw/core/format";
import { pickPrevRange } from "@mw/core/compare";
import type { CompareConfig, CompareMode, ModelStat, Snapshot } from "@mw/core/types";
import { CHART_TOOLTIP, ageColor } from "@mw/core/chartTheme";
import { suggestedPrompts } from "@mw/core/ai/prompts";
import { idbStore } from "@mw/core/adapters/store-idb";

const SRC_COLORS = ["#3fb9a6", "#e8902a", "#9b7dd6", "#5b9bd6", "#807461"];
const SRC_LABELS = ["Recommend", "Search", "Browse", "Direct", "Other"];

const COMPARE_MODE_KEY = "mw_compare_mode";

function loadCompareMode(): CompareMode {
  if (typeof window === "undefined") return "none";
  const v = window.localStorage.getItem(COMPARE_MODE_KEY) as CompareMode | null;
  if (v === "prevPeriod" || v === "prevYear" || v === "custom") return v;
  return "none";
}

export function ModelDetail({ id }: { id: number }) {
  const [range, setRange] = useState<DateRange>({ start: daysAgo(30), end: today() });
  const [compare, setCompare] = useState<CompareConfig>({ mode: "none", range: null });
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [prevSnap, setPrevSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const mode = loadCompareMode();
    if (mode !== "none") {
      const startRange = { start: daysAgo(30), end: today() };
      setCompare({ mode, range: pickPrevRange(mode, startRange, null) });
    }
  }, []);

  useEffect(() => {
    setCompare((c) => {
      if (c.mode === "none" || c.mode === "custom") return c;
      return { ...c, range: pickPrevRange(c.mode, range, null) };
    });
  }, [range]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (compare.mode === "none") window.localStorage.removeItem(COMPARE_MODE_KEY);
    else window.localStorage.setItem(COMPARE_MODE_KEY, compare.mode);
  }, [compare.mode]);

  const loadCurrent = useCallback(async (r: DateRange) => {
    setLoading(true);
    setNotFound(false);
    try {
      const s = await idbStore.readSnapshot(r.start, r.end);
      setSnap(s);
      setNotFound(s == null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrev = useCallback(async (r: DateRange) => {
    setPrevSnap(await idbStore.readSnapshot(r.start, r.end));
  }, []);

  useEffect(() => {
    loadCurrent(range);
  }, [range, loadCurrent]);

  useEffect(() => {
    if (!compare.range) {
      setPrevSnap(null);
      return;
    }
    loadPrev(compare.range);
  }, [compare.range, loadPrev]);

  const model: ModelStat | undefined = useMemo(
    () => snap?.models.find((m) => m.id === id),
    [snap, id],
  );

  const prevModel: ModelStat | null = useMemo(
    () => prevSnap?.models.find((m) => m.id === id) ?? null,
    [prevSnap, id],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <NavLink href="/" className="text-xs text-ink3 hover:text-ink">
            ← back to dashboard
          </NavLink>
          <h1 className="h-archivo mt-1 text-2xl font-extrabold text-ink">
            {model?.title || `Model #${id}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <CompareToggle mainRange={range} compare={compare} onChange={setCompare} />
          <InsightsButton />
        </div>
      </header>

      {loading && (
        <div className="rounded-xl border border-line bg-panel p-10 text-center text-ink3">
          Loading…
        </div>
      )}
      {!loading && notFound && (
        <div className="rounded-xl border border-line bg-panel p-10 text-center">
          <p className="text-ink2">
            No snapshot for the selected range. Sync it from the{" "}
            <NavLink href="/" className="text-teal underline">
              main dashboard
            </NavLink>
            .
          </p>
        </div>
      )}
      {!loading && snap && !model && (
        <div className="rounded-xl border border-line bg-panel p-10 text-center text-ink2">
          Model #{id} isn&apos;t in this snapshot.
        </div>
      )}

      {model && compare.range && !prevSnap && (
        <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-ink2">
          Compare period <span className="font-mono">{compare.range.start} → {compare.range.end}</span>{" "}
          has no snapshot yet — run a sync from the dashboard to enable deltas.
        </div>
      )}
      {model && compare.range && prevSnap && !prevModel && (
        <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-ink2">
          This model has no data in the comparison period{" "}
          <span className="font-mono">{compare.range.start} → {compare.range.end}</span>
          {" "}— it was likely published more recently. Deltas can&apos;t be shown.
        </div>
      )}
      {model && <Detail m={model} prev={prevModel} />}

      <AIDrawer
        snapshot={snap}
        prevSnapshot={prevSnap}
        focusModelId={id}
        suggestedPrompts={suggestedPrompts({
          hasCompare: !!prevSnap,
          hasFocusModel: true,
          focusModelTitle: model?.title ?? null,
        })}
      />
    </main>
  );
}

function InsightsButton() {
  const { open, hasKey } = useAI();
  return (
    <button
      onClick={open}
      className="rounded-lg border border-violet/40 bg-panel2 px-3 py-1.5 text-xs font-semibold text-violet hover:border-violet hover:bg-violet/10"
      title={hasKey ? "Ask AI about this model" : "Set an API key (Claude or free Gemini) and ask"}
    >
      ✨ Insights
    </button>
  );
}

function Detail({ m, prev }: { m: ModelStat; prev: ModelStat | null }) {
  const stages: Array<{ label: string; current: number; prev?: number; color: string }> = [
    { label: "Impressions", current: m.impr, prev: prev?.impr, color: "#3a2f22" },
    { label: "Views", current: m.view, prev: prev?.view, color: "#3fb9a6" },
    { label: "Downloads", current: m.dl, prev: prev?.dl, color: "#e8902a" },
    { label: "Prints", current: m.print, prev: prev?.print, color: "#d65a4a" },
  ];
  let prevStage = stages[0].current || 1;
  const crV = m.impr ? (m.view / m.impr) * 100 : 0;
  const crD = m.view ? (m.dl / m.view) * 100 : 0;
  const prevCrV = prev && prev.impr ? (prev.view / prev.impr) * 100 : undefined;
  const prevCrD = prev && prev.view ? (prev.dl / prev.view) * 100 : undefined;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Views" value={fmt(m.view)} color="text-teal" current={m.view} prev={prev?.view} />
        <Kpi label="Downloads" value={fmt(m.dl)} color="text-amber" current={m.dl} prev={prev?.dl} />
        <Kpi label="Prints" value={fmt(m.print)} color="text-red" current={m.print} prev={prev?.print} />
        <Kpi label="Points" value={fmt(m.point)} color="text-violet" current={m.point} prev={prev?.point} />
        <AgeKpi ageDays={m.ageDays} pub={m.pub} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs uppercase tracking-widest text-ink3">Conversion funnel</div>
          <div className="mt-3 space-y-1">
            {stages.map((s, i) => {
              const ratio = i === 0 ? 1 : prevStage ? s.current / prevStage : 0;
              const w = i === 0 ? 100 : Math.max(ratio * 100, s.current > 0 ? 4 : 0);
              const drop =
                i < stages.length - 1
                  ? (stages[i + 1].current / (s.current || 1)) * 100
                  : null;
              const node = (
                <div key={i}>
                  <div className="relative h-11 w-full overflow-hidden rounded-md">
                    <div className="absolute inset-0" style={{ background: s.color, opacity: 0.18 }} />
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${w}%`, background: s.color }}
                    />
                    <div className="relative flex h-full items-center px-4 text-sm font-semibold text-ink">
                      <span className="h-archivo">{s.label}</span>
                      <span className="h-archivo ml-auto flex items-baseline gap-2">
                        {fmt0(s.current)}
                        {s.prev !== undefined && (
                          <DeltaBadge current={s.current} prev={s.prev} format="number" size="xs" />
                        )}
                      </span>
                    </div>
                  </div>
                  {drop !== null && (
                    <div className="pl-4 pt-1 text-[10px] tracking-widest text-amber">
                      ↳ {drop.toFixed(drop < 1 ? 2 : 1)}% conversion
                    </div>
                  )}
                </div>
              );
              prevStage = s.current;
              return node;
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Kv k="CR-V" v={pct(m.view, m.impr, 2)} current={crV} prev={prevCrV} format="pp" />
            <Kv k="CR-D" v={pct(m.dl, m.view, 2)} current={crD} prev={prevCrD} format="pp" />
            <Kv k="Collect" v={fmt0(m.collect)} current={m.collect} prev={prev?.collect} />
            <Kv k="Like" v={fmt0(m.like)} current={m.like} prev={prev?.like} />
            <Kv k="Boost" v={fmt0(m.boost)} current={m.boost} prev={prev?.boost} />
            <Kv k="Instances" v={fmt0(m.instances)} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs uppercase tracking-widest text-ink3">Traffic source</div>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SRC_LABELS.map((name, i) => ({ name, value: m.ts[i] || 0 }))}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={95}
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
          <div className="flex flex-wrap justify-center gap-3 text-[11px] text-ink2">
            {SRC_LABELS.map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: SRC_COLORS[i] }} />
                {l} {m.ts[i] || 0}%
                {prev && (
                  <DeltaBadge
                    current={m.ts[i] || 0}
                    prev={prev.ts[i] || 0}
                    format="pp"
                    size="xs"
                    className="ml-0.5"
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs uppercase tracking-widest text-ink3">Metadata</div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row k="Category" v={m.category || m.cat || "—"} />
            <Row k="Published" v={m.pub || "—"} />
            <Row k="License" v={m.license || "—"} />
            <Row k="Instances" v={fmt0(m.instances)} />
            <Row k="Views / day" v={m.viewPerDay != null ? fmt(m.viewPerDay) : "—"} />
            <Row k="DL / day" v={m.dlPerDay != null ? fmt(m.dlPerDay) : "—"} />
          </dl>
        </div>
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs uppercase tracking-widest text-ink3">Tags</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(m.tags || []).length === 0 && <span className="text-ink3 text-sm">No tags.</span>}
            {(m.tags || []).map((t) => (
              <span key={t} className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs text-ink2">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center">
        <a
          href={`https://makerworld.com/en/models/${m.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal hover:underline"
        >
          Open on MakerWorld ↗
        </a>
      </div>
    </div>
  );
}

function AgeKpi({ ageDays, pub }: { ageDays: number | null; pub: string }) {
  const { color, label } = ageColor(ageDays);
  const valueText = ageDays == null ? "—" : ageDays < 365 ? `${ageDays}d` : `${(ageDays / 365).toFixed(1)}y`;
  return (
    <div className="rounded-xl border bg-panel p-4 transition-colors" style={{ borderColor: `${color}66` }}>
      <div className="text-[10px] uppercase tracking-widest text-ink3">Age</div>
      <div className="h-archivo mt-1 text-2xl font-extrabold" style={{ color }}>
        {valueText}
      </div>
      <div className="mt-1 flex items-baseline gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        {pub && <span className="text-ink3 font-mono">{pub}</span>}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  current,
  prev,
}: {
  label: string;
  value: string;
  color: string;
  current: number;
  prev?: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="text-[10px] uppercase tracking-widest text-ink3">{label}</div>
      <div className={`h-archivo mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
      {prev !== undefined && (
        <DeltaBadge current={current} prev={prev} format="number" size="xs" showPrev className="mt-1 block" />
      )}
    </div>
  );
}

function Kv({
  k,
  v,
  current,
  prev,
  format = "number",
}: {
  k: string;
  v: string;
  current?: number;
  prev?: number;
  format?: "number" | "pp";
}) {
  return (
    <div className="rounded-md border border-line bg-panel2 p-2">
      <div className="text-[9px] uppercase tracking-widest text-ink3">{k}</div>
      <div className="h-archivo mt-1 truncate text-sm font-bold text-ink">{v}</div>
      {current !== undefined && prev !== undefined && (
        <DeltaBadge current={current} prev={prev} format={format} size="xs" className="mt-0.5 block" />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-ink3">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </>
  );
}
