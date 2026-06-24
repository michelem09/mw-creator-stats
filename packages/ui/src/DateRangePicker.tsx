"use client";
import { useMemo } from "react";
import { daysAgo, today } from "@mw/core/format";

export interface DateRange {
  start: string;
  end: string;
}

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  { label: "Last 7 days", range: () => ({ start: daysAgo(7), end: today() }) },
  { label: "Last 30 days", range: () => ({ start: daysAgo(30), end: today() }) },
  { label: "Last 90 days", range: () => ({ start: daysAgo(90), end: today() }) },
  {
    label: "Year to date",
    range: () => ({
      start: `${new Date().getUTCFullYear()}-01-01`,
      end: today(),
    }),
  },
  { label: "Last 12 months", range: () => ({ start: daysAgo(365), end: today() }) },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const presetMatch = useMemo(
    () =>
      PRESETS.find((p) => {
        const r = p.range();
        return r.start === value.start && r.end === value.end;
      })?.label || "Custom",
    [value],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs text-ink focus:border-teal focus:outline-none"
        value={presetMatch}
        onChange={(e) => {
          const p = PRESETS.find((x) => x.label === e.target.value);
          if (p) onChange(p.range());
        }}
      >
        {PRESETS.map((p) => (
          <option key={p.label}>{p.label}</option>
        ))}
        <option value="Custom" disabled>
          Custom
        </option>
      </select>
      <input
        type="date"
        value={value.start}
        max={value.end}
        onChange={(e) => onChange({ ...value, start: e.target.value })}
        className="rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs text-ink focus:border-teal focus:outline-none"
      />
      <span className="text-ink3">→</span>
      <input
        type="date"
        value={value.end}
        min={value.start}
        max={today()}
        onChange={(e) => onChange({ ...value, end: e.target.value })}
        className="rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs text-ink focus:border-teal focus:outline-none"
      />
    </div>
  );
}
