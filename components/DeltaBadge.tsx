import { fmt } from "@/lib/format";
import { diffNumber } from "@/lib/compare";

export type DeltaFormat = "number" | "percent" | "pp";

interface Props {
  current: number;
  prev: number | undefined;
  /** "number" → ▲ +12.4% (delta% of value); "percent" → same but value is already a %; "pp" → ±N.Npp. */
  format?: DeltaFormat;
  /** Smaller variant for in-card use. */
  size?: "sm" | "xs";
  /** When true, show absolute prev value next to the badge (e.g. "prev: 12k"). */
  showPrev?: boolean;
  className?: string;
}

export function DeltaBadge({
  current,
  prev,
  format = "number",
  size = "sm",
  showPrev = false,
  className = "",
}: Props) {
  if (prev === undefined) return null;

  const d = diffNumber(current, prev);

  // No prev value → "new" sentinel (current > 0) or nothing (both zero)
  if (d.deltaPct === null && d.deltaAbs !== null) {
    if (d.deltaAbs === 0) {
      return (
        <span className={`text-ink3 ${sizeClass(size)} ${className}`}>—</span>
      );
    }
    if (current > 0 && (prev ?? 0) === 0) {
      return (
        <span className={`text-teal ${sizeClass(size)} ${className}`}>new</span>
      );
    }
  }

  const positive = (d.deltaAbs ?? 0) >= 0;
  const arrow = positive ? "▲" : "▼";
  const tone = positive ? "text-teal" : "text-red";

  let valueText: string;
  if (format === "pp") {
    valueText = `${positive ? "+" : ""}${(d.deltaAbs ?? 0).toFixed(1)}pp`;
  } else if (format === "percent") {
    // current/prev are already percentages (e.g. CR-V%). Show delta in pp.
    valueText = `${positive ? "+" : ""}${(d.deltaAbs ?? 0).toFixed(1)}pp`;
  } else {
    valueText = d.deltaPct == null
      ? "—"
      : `${positive ? "+" : ""}${d.deltaPct.toFixed(1)}%`;
  }

  return (
    <span className={`inline-flex items-baseline gap-1 ${sizeClass(size)} ${className}`}>
      <span className={`font-mono ${tone}`}>
        {arrow} {valueText}
      </span>
      {showPrev && (
        <span className="text-ink3">· prev {fmt(prev)}</span>
      )}
    </span>
  );
}

function sizeClass(size: "sm" | "xs"): string {
  return size === "xs" ? "text-[10px]" : "text-xs";
}
