// Shared visual constants for all Recharts charts.

export const CHART_TOOLTIP = {
  contentStyle: {
    background: "#1d1812",
    border: "1px solid #332a1f",
    borderRadius: 8,
    color: "#e8dfd2",
    fontSize: 12,
  } as React.CSSProperties,
  labelStyle: { color: "#e8dfd2", fontWeight: 600 } as React.CSSProperties,
  itemStyle: { color: "#e8dfd2" } as React.CSSProperties,
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

// Palette used to colour bubbles/bars by category. Repeats after 16 categories.
const PALETTE = [
  "#3fb9a6", // teal
  "#e8902a", // amber
  "#9b7dd6", // violet
  "#5b9bd6", // blue
  "#d65a4a", // red
  "#e8c54a", // yellow
  "#7dd6a4", // green
  "#d67dbd", // pink
  "#7da4d6", // sky
  "#d6a47d", // sand
  "#a4d67d", // lime
  "#7dd6d6", // cyan
  "#d67d7d", // coral
  "#a47dd6", // purple
  "#d6c97d", // gold
  "#7d9bd6", // indigo
];

/** Deterministic colour for a category label — same input → same colour, regardless of order. */
export function categoryColor(name: string | undefined | null): string {
  if (!name) return "#807461";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Map a model age in days to a colour + short label. 5 discrete buckets,
 *  from "fresh" (just published) to "veteran" (>1 year old). */
export function ageColor(days: number | null | undefined): {
  color: string;
  label: string;
} {
  if (days == null) return { color: "#807461", label: "—" };
  if (days <= 30) return { color: "#3fb9a6", label: "fresh" };
  if (days <= 90) return { color: "#7dd6a4", label: "young" };
  if (days <= 180) return { color: "#e8c54a", label: "mature" };
  if (days <= 365) return { color: "#e8902a", label: "established" };
  return { color: "#d65a4a", label: "veteran" };
}

export const TRAFFIC_SOURCE_COLORS = [
  "#3fb9a6", // recommend
  "#e8902a", // search
  "#9b7dd6", // browse
  "#5b9bd6", // direct
  "#807461", // other
] as const;

// Colours for the 4 reward-point sources (regular/exclusive points + boosts).
export const POINTS_SOURCE_COLORS = {
  pointRegular: "#7dd6a4", // green
  pointExclusive: "#3fb9a6", // teal
  boostRegular: "#e8c54a", // gold
  boostExclusive: "#9b7dd6", // violet
} as const;
