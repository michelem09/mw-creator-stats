export interface ChangelogEntry {
  version: string;
  notes: string[];
}

// User-facing release notes, newest first. Mirrors CHANGELOG.md (internal-only
// versions are omitted). Shown by the in-app "What's new" panel.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.4",
    notes: [
      "AI Insights (Gemini) now responds reliably — no more endless “thinking…”.",
      "Clear error messages and a Retry button when an AI answer fails or times out.",
      "The ✨ Insights button stays available while you scroll.",
      "Your selected date range is remembered across reloads.",
      "Model cover thumbnails in the catalogue (enlarge on hover) and on the model page.",
    ],
  },
  {
    version: "0.1.2",
    notes: [
      "New Points & Boost view: daily reward points by source, with boosts converted to points, split regular vs exclusive.",
      "Paginated catalogue table (10 / 25 / 50 / 100 per page).",
      "App logo in the header and a favicon for the web version.",
      "Compact, single-row Compare control.",
    ],
  },
  {
    version: "0.1.1",
    notes: ["Housekeeping: removed an unused permission from the extension."],
  },
  {
    version: "0.1.0",
    notes: [
      "First release: private MakerWorld Creator Center analytics — date ranges, period comparison, per-model drill-down, traffic sources, and optional AI Insights.",
    ],
  },
];

/** Compare dotted versions numerically. >0 if a is newer than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Changelog entries newer than the given (last-seen) version. */
export function notesSince(seen: string): ChangelogEntry[] {
  return CHANGELOG.filter((e) => compareVersions(e.version, seen) > 0);
}
