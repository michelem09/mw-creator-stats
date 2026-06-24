"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fmt, pct } from "@mw/core/format";
import type { ModelStat } from "@mw/core/types";

type SortKey =
  | "title"
  | "view"
  | "dl"
  | "print"
  | "collect"
  | "crv"
  | "crd"
  | "point"
  | "dview"
  | "ddl";
type SortDir = "asc" | "desc";

const BASE_HEADERS: Array<{ key: SortKey; label: string; align?: "left" | "right" }> = [
  { key: "title", label: "Model", align: "left" },
  { key: "view", label: "Views", align: "right" },
  { key: "dl", label: "Downloads", align: "right" },
  { key: "print", label: "Prints", align: "right" },
  { key: "collect", label: "Collect", align: "right" },
  { key: "crv", label: "CR-V", align: "right" },
  { key: "crd", label: "CR-D", align: "right" },
  { key: "point", label: "Points", align: "right" },
];

const COMPARE_HEADERS: Array<{ key: SortKey; label: string }> = [
  { key: "dview", label: "ΔViews%" },
  { key: "ddl", label: "ΔDL%" },
];

interface Row {
  m: ModelStat;
  prev: ModelStat | null;
  dViewPct: number | null;
  dDlPct: number | null;
}

const SENTINEL = Number.POSITIVE_INFINITY;

const getCell = (r: Row, k: SortKey): number | string => {
  const m = r.m;
  switch (k) {
    case "title":
      return m.title;
    case "view":
      return m.view;
    case "dl":
      return m.dl;
    case "print":
      return m.print;
    case "collect":
      return m.collect;
    case "crv":
      return m.impr ? m.view / m.impr : 0;
    case "crd":
      return m.view ? m.dl / m.view : 0;
    case "point":
      return m.point;
    case "dview":
      return r.dViewPct ?? SENTINEL;
    case "ddl":
      return r.dDlPct ?? SENTINEL;
  }
};

export function Catalog({
  models,
  prevModels,
}: {
  models: ModelStat[];
  prevModels?: ModelStat[];
}) {
  const hasCompare = !!prevModels;
  const HEADERS = hasCompare ? [...BASE_HEADERS, ...COMPARE_HEADERS.map((h) => ({ ...h, align: "right" as const }))] : BASE_HEADERS;

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "view", dir: "desc" });
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState("");

  const categories = useMemo(
    () => [...new Set(models.map((m) => m.category || "Uncategorized"))].sort(),
    [models],
  );

  const rows = useMemo<Row[]>(() => {
    const prevById = new Map<number, ModelStat>();
    for (const m of prevModels ?? []) prevById.set(m.id, m);
    return models.map((m) => {
      const prev = prevById.get(m.id) ?? null;
      const dViewPct =
        prev && prev.view !== 0
          ? ((m.view - prev.view) / prev.view) * 100
          : prev
            ? m.view > 0
              ? 100
              : 0
            : null;
      const dDlPct =
        prev && prev.dl !== 0
          ? ((m.dl - prev.dl) / prev.dl) * 100
          : prev
            ? m.dl > 0
              ? 100
              : 0
            : null;
      return { m, prev, dViewPct, dDlPct };
    });
  }, [models, prevModels]);

  const filteredRows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return rows
      .filter((r) => (cat ? (r.m.category || "Uncategorized") === cat : true))
      .filter((r) => (f ? r.m.title.toLowerCase().includes(f) : true))
      .sort((a, b) => {
        const av = getCell(a, sort.key);
        const bv = getCell(b, sort.key);
        if (typeof av === "number" && typeof bv === "number") {
          return sort.dir === "asc" ? av - bv : bv - av;
        }
        return sort.dir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
  }, [rows, filter, cat, sort]);

  function click(k: SortKey) {
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" }));
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="h-archivo text-lg font-bold text-ink">Full catalogue</h2>
        <div className="flex items-center gap-2">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-md border border-line bg-panel2 px-2 py-1 font-mono text-xs text-ink focus:border-teal focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter…"
            className="rounded-md border border-line bg-panel2 px-2 py-1 font-mono text-xs text-ink focus:border-teal focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="min-w-full text-sm">
          <thead className="bg-panel2 text-xs uppercase tracking-widest text-ink3">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  onClick={() => click(h.key)}
                  className={`cursor-pointer select-none px-3 py-2 ${h.align === "right" ? "text-right" : "text-left"}`}
                >
                  {h.label}
                  {sort.key === h.key && (
                    <span className="ml-1 text-amber">{sort.dir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.m.id} className="border-t border-line/60 hover:bg-panel2/60">
                <td className="px-3 py-2">
                  <Link href={`/models/${r.m.id}`} className="text-ink hover:text-teal">
                    {r.m.title}
                  </Link>
                  <div className="text-[10px] text-ink3">{r.m.category || "Uncategorized"}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.m.view)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.m.dl)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.m.print)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.m.collect)}</td>
                <td className="px-3 py-2 text-right font-mono text-teal">{pct(r.m.view, r.m.impr)}</td>
                <td className="px-3 py-2 text-right font-mono text-amber">{pct(r.m.dl, r.m.view)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(r.m.point)}</td>
                {hasCompare && (
                  <>
                    <td className={`px-3 py-2 text-right font-mono ${deltaClass(r.dViewPct)}`}>
                      {formatDeltaPct(r.dViewPct)}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono ${deltaClass(r.dDlPct)}`}>
                      {formatDeltaPct(r.dDlPct)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDeltaPct(v: number | null): string {
  if (v === null) return "—";
  if (!Number.isFinite(v)) return "new";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function deltaClass(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "text-ink3";
  return v >= 0 ? "text-teal" : "text-red";
}
