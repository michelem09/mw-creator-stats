"use client";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import type { CompareConfig, CompareMode } from "@mw/core/types";
import { pickPrevRange } from "@mw/core/compare";

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

  const effectiveRange =
    compare.mode === "custom"
      ? compare.range
      : active
        ? pickPrevRange(compare.mode, mainRange, null)
        : null;

  function selectMode(mode: CompareMode) {
    if (mode === "none") {
      onChange({ mode: "none", range: null });
    } else if (mode === "custom") {
      // Seed the custom range from prevPeriod so the user has something sensible to tweak.
      const seed = compare.range ?? pickPrevRange("prevPeriod", mainRange, null);
      onChange({ mode: "custom", range: seed });
    } else {
      onChange({ mode, range: pickPrevRange(mode, mainRange, null) });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={compare.mode}
        onChange={(e) => selectMode(e.target.value as CompareMode)}
        title="Compare against a previous period"
        className={`rounded-lg border bg-panel2 px-3 py-2 font-mono text-xs focus:outline-none ${
          active
            ? "border-amber/60 text-ink"
            : "border-line text-ink2 hover:border-amber hover:text-ink"
        }`}
      >
        <option value="none">+ Compare</option>
        <option value="prevPeriod">vs Prev period</option>
        <option value="prevYear">vs Prev year</option>
        <option value="custom">vs Custom range</option>
      </select>

      {compare.mode === "custom" && compare.range && (
        <DateRangePicker
          value={compare.range}
          onChange={(r) => onChange({ mode: "custom", range: r })}
        />
      )}

      {active && compare.mode !== "custom" && effectiveRange && (
        <span className="font-mono text-[11px] text-ink3">
          {effectiveRange.start} → {effectiveRange.end}
        </span>
      )}
    </div>
  );
}
