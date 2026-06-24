"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CookieSetup, loadCookie } from "@mw/ui/CookieSetup";
import { DateRangePicker, type DateRange } from "@mw/ui/DateRangePicker";
import { SyncButton } from "@mw/ui/SyncButton";
import { CompareToggle } from "@mw/ui/CompareToggle";
import { useSync } from "@mw/ui/SyncProvider";
import { Overview } from "@mw/ui/sections/Overview";
import { Categories } from "@mw/ui/sections/Categories";
import { Conversions } from "@mw/ui/sections/Conversions";
import { TrafficSources } from "@mw/ui/sections/TrafficSources";
import { Catalog } from "@mw/ui/sections/Catalog";
import { ModelXray } from "@mw/ui/sections/ModelXray";
import { Tags } from "@mw/ui/sections/Tags";
import { Recency } from "@mw/ui/sections/Recency";
import { BiggestMovers } from "@mw/ui/sections/BiggestMovers";
import { PortfolioAge } from "@mw/ui/sections/PortfolioAge";
import { AIDrawer } from "@mw/ui/AIDrawer";
import { useAI } from "@mw/ui/AIProvider";
import { suggestedPrompts } from "@mw/core/ai/prompts";
import { byCategory, totals, trafficMixCatalog } from "@mw/core/aggregate";
import { pickPrevRange } from "@mw/core/compare";
import { daysAgo, today } from "@mw/core/format";
import type { CompareConfig, CompareMode, Snapshot } from "@mw/core/types";

const COMPARE_MODE_KEY = "mw_compare_mode";

function loadCompareMode(): CompareMode {
  if (typeof window === "undefined") return "none";
  const v = window.localStorage.getItem(COMPARE_MODE_KEY) as CompareMode | null;
  if (v === "prevPeriod" || v === "prevYear" || v === "custom") return v;
  return "none";
}

export default function HomePage() {
  const [range, setRange] = useState<DateRange>({ start: daysAgo(30), end: today() });
  const [compare, setCompareState] = useState<CompareConfig>({ mode: "none", range: null });
  const [cookie, setCookie] = useState("");
  const [showCookie, setShowCookie] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [prevSnap, setPrevSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);

  // Rehydrate compare mode on mount.
  useEffect(() => {
    setCookie(loadCookie());
    const mode = loadCompareMode();
    if (mode !== "none") {
      const startRange = { start: daysAgo(30), end: today() };
      setCompareState({ mode, range: pickPrevRange(mode, startRange, null) });
    }
  }, []);

  // When the main range changes, recompute prev range for preset modes (custom stays as-is).
  useEffect(() => {
    setCompareState((c) => {
      if (c.mode === "none") return c;
      if (c.mode === "custom") return c;
      return { ...c, range: pickPrevRange(c.mode, range, null) };
    });
  }, [range]);

  // Persist compare mode (not the derived range — that follows main range).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (compare.mode === "none") window.localStorage.removeItem(COMPARE_MODE_KEY);
    else window.localStorage.setItem(COMPARE_MODE_KEY, compare.mode);
  }, [compare.mode]);

  const setCompare = useCallback((next: CompareConfig) => {
    setCompareState(next);
  }, []);

  const loadSnapshot = useCallback(
    async (r: DateRange, target: "current" | "prev"): Promise<void> => {
      const res = await fetch(`/api/snapshot?start=${r.start}&end=${r.end}`);
      const setter = target === "current" ? setSnap : setPrevSnap;
      setter(res.ok ? ((await res.json()) as Snapshot) : null);
    },
    [],
  );

  // Load the current-range snapshot whenever range changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSnap(null);
    (async () => {
      await loadSnapshot(range, "current");
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [range, loadSnapshot]);

  // Load the prev-range snapshot whenever the compare range changes.
  useEffect(() => {
    if (!compare.range) {
      setPrevSnap(null);
      return;
    }
    loadSnapshot(compare.range, "prev");
  }, [compare.range, loadSnapshot]);

  // When a sync just completed, refresh whichever snapshot matches the finished range.
  const { recentDoneSnapshotKey, acknowledgeRange } = useSync();
  useEffect(() => {
    if (!recentDoneSnapshotKey) return;
    const cur = `${range.start}_${range.end}`;
    const prev = compare.range ? `${compare.range.start}_${compare.range.end}` : null;
    if (recentDoneSnapshotKey === cur) {
      loadSnapshot(range, "current");
      acknowledgeRange(range.start, range.end);
    } else if (prev && recentDoneSnapshotKey === prev && compare.range) {
      loadSnapshot(compare.range, "prev");
      acknowledgeRange(compare.range.start, compare.range.end);
    }
  }, [recentDoneSnapshotKey, range, compare.range, loadSnapshot, acknowledgeRange]);

  const agg = useMemo(() => {
    if (!snap) return null;
    return {
      totals: totals(snap.models),
      categories: byCategory(snap.models, snap.meta.hasMetadata ? "category" : "cat"),
      trafficMix: trafficMixCatalog(snap.models),
    };
  }, [snap]);

  const prevAgg = useMemo(() => {
    if (!prevSnap) return null;
    return {
      totals: totals(prevSnap.models),
      categories: byCategory(prevSnap.models, prevSnap.meta.hasMetadata ? "category" : "cat"),
      trafficMix: trafficMixCatalog(prevSnap.models),
    };
  }, [prevSnap]);

  const collectedAt = snap?.meta.collectedAt
    ? new Date(snap.meta.collectedAt).toLocaleString()
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="h-archivo text-2xl font-extrabold tracking-tight text-ink">
            MakerWorld Creator Stats
          </h1>
          <p className="text-xs text-ink2">
            Interactive dashboard for your Creator Center data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InsightsButton />
          <button
            onClick={() => setShowCookie(true)}
            className="text-xs text-ink3 hover:text-ink"
          >
            {cookie ? "Cookie ✓ (update)" : "Set cookie"}
          </button>
        </div>
      </header>

      <div className="sticky top-0 z-30 -mx-4 mb-6 space-y-2 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker value={range} onChange={setRange} />
          <CompareToggle mainRange={range} compare={compare} onChange={setCompare} />
          <SyncButton
            start={range.start}
            end={range.end}
            cookie={cookie}
            compareRange={compare.range}
          />
          {collectedAt && (
            <span className="ml-auto font-mono text-[10px] text-ink3">
              snapshot: {collectedAt}
              {prevSnap && (
                <span className="ml-2 text-amber">
                  · compare loaded ({prevSnap.meta.dateRange.start}→{prevSnap.meta.dateRange.end})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {!snap && !loading && (
        <EmptyState
          onSetCookie={() => setShowCookie(true)}
          hasCookie={!!cookie}
        />
      )}

      {loading && (
        <div className="rounded-xl border border-line bg-panel p-10 text-center text-ink3">
          Loading snapshot…
        </div>
      )}

      {snap && agg && (
        <div className="space-y-10">
          <Overview t={agg.totals} prev={prevAgg?.totals} />
          <PortfolioAge models={snap.models} />
          <Categories cats={agg.categories} prevCats={prevAgg?.categories} />
          {prevSnap && (
            <BiggestMovers models={snap.models} prevModels={prevSnap.models} />
          )}
          <Conversions cats={agg.categories} />
          <TrafficSources
            catalog={agg.trafficMix}
            models={snap.models}
            prevCatalog={prevAgg?.trafficMix}
            prevModels={prevSnap?.models}
          />
          <ModelXray models={snap.models} prevModels={prevSnap?.models} />
          <Tags models={snap.models} />
          <Recency models={snap.models} />
          <Catalog models={snap.models} prevModels={prevSnap?.models} />
        </div>
      )}

      <CookieSetup
        open={showCookie}
        onClose={() => setShowCookie(false)}
        onSaved={(c) => setCookie(c)}
      />

      <AIDrawer
        snapshot={snap}
        prevSnapshot={prevSnap}
        suggestedPrompts={suggestedPrompts({
          hasCompare: !!prevSnap,
          hasFocusModel: false,
        })}
      />

      <footer className="mt-12 border-t border-line pt-4 text-center text-[10px] text-ink3">
        Conversion rates from impression/view/download. Traffic source weighted
        by views. Snapshots stored locally in <code>./data</code>.
      </footer>
    </main>
  );
}

function InsightsButton() {
  const { open, hasKey } = useAI();
  return (
    <button
      onClick={open}
      className="rounded-lg border border-violet/40 bg-panel2 px-3 py-1.5 text-xs font-semibold text-violet hover:border-violet hover:bg-violet/10"
      title={hasKey ? "Ask Claude about your stats" : "Set your Anthropic key and ask Claude"}
    >
      ✨ Insights
    </button>
  );
}

function EmptyState({
  onSetCookie,
  hasCookie,
}: {
  onSetCookie: () => void;
  hasCookie: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-10 text-center">
      <div className="h-archivo text-lg font-bold text-ink">
        No snapshot for this range yet
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink2">
        {hasCookie
          ? "Press Sync above to fetch your MakerWorld data for the selected period."
          : "Set your MakerWorld cookie first, then press Sync to fetch your data."}
      </p>
      {!hasCookie && (
        <button
          onClick={onSetCookie}
          className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg"
        >
          Set cookie
        </button>
      )}
    </div>
  );
}
