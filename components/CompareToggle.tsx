"use client";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import type { CompareConfig, CompareMode } from "@/lib/types";
import { pickPrevRange } from "@/lib/compare";

const PRESETS: Array<{ key: Exclude<CompareMode, "none">; label: string }> = [
  { key: "prevPeriod", label: "Prev period" },
  { key: "prevYear", label: "Prev year" },
  { key: "custom", label: "Custom" },
];

export function CompareToggle({
  mainRange,
  compare,
  onChange,
}: {
  mainRange: DateRange;
  compare: CompareConfig;
  onChange: (next: CompareConfig) => void;
}) {
  const active = compare.mode !== "none";

  if (!active) {
    return (
      <button
        onClick={() => {
          const range = pickPrevRange("prevPeriod", mainRange, null);
          onChange({ mode: "prevPeriod", range });
        }}
        className="rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs text-ink2 hover:border-amber hover:text-ink"
      >
        + Compare
      </button>
    );
  }

  const effectiveRange =
    compare.mode === "custom"
      ? compare.range
      : pickPrevRange(compare.mode, mainRange, null);

  function selectMode(mode: Exclude<CompareMode, "none">) {
    if (mode === "custom") {
      // Seed the custom range from prevPeriod so the user has something sensible to tweak.
      const seed = compare.range ?? pickPrevRange("prevPeriod", mainRange, null);
      onChange({ mode: "custom", range: seed });
    } else {
      onChange({ mode, range: pickPrevRange(mode, mainRange, null) });
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-amber/40 bg-panel2 px-3 py-2">
      <span className="text-[10px] uppercase tracking-widest text-amber">Compare</span>
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => selectMode(p.key)}
            className={`rounded px-2 py-1 font-mono text-[11px] ${
              compare.mode === p.key
                ? "bg-amber text-bg font-semibold"
                : "text-ink2 hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {compare.mode === "custom" && compare.range && (
        <DateRangePicker
          value={compare.range}
          onChange={(r) => onChange({ mode: "custom", range: r })}
        />
      )}
      {compare.mode !== "custom" && effectiveRange && (
        <span className="font-mono text-[11px] text-ink3">
          {effectiveRange.start} → {effectiveRange.end}
        </span>
      )}
      <button
        onClick={() => onChange({ mode: "none", range: null })}
        className="ml-auto rounded px-2 py-1 text-xs text-ink3 hover:text-red"
        aria-label="Turn off compare"
        title="Turn off compare"
      >
        ×
      </button>
    </div>
  );
}
