import { fmt, pct } from "@mw/core/format";
import type { CategoryAgg } from "@mw/core/aggregate";
import { DeltaBadge } from "../DeltaBadge";

const SRC_COLORS = ["#3fb9a6", "#e8902a", "#9b7dd6", "#5b9bd6", "#807461"];
const SRC_LABELS = ["Recommend", "Search", "Browse", "Direct", "Other"];

export function Categories({
  cats,
  prevCats,
}: {
  cats: CategoryAgg[];
  prevCats?: CategoryAgg[];
}) {
  const prevByName = new Map<string, CategoryAgg>();
  for (const c of prevCats ?? []) prevByName.set(c.name, c);

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Product lines</h2>
      <p className="mt-1 text-sm text-ink2">
        Each category behaves differently. Volume alone isn&apos;t the story — an EDC
        with few views but high conversion can outperform a viral model nobody
        downloads. The bottom strip shows the traffic-source mix per category.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => {
          const p = prevByName.get(c.name);
          const crV = c.impr ? (c.view / c.impr) * 100 : 0;
          const crD = c.view ? (c.dl / c.view) * 100 : 0;
          const prevCrV = p && p.impr ? (p.view / p.impr) * 100 : undefined;
          const prevCrD = p && p.view ? (p.dl / p.view) * 100 : undefined;
          return (
            <div key={c.name} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-baseline justify-between">
                <div className="h-archivo text-base font-bold text-ink">{c.name}</div>
                <div className="text-xs text-ink3">{c.count} model{c.count === 1 ? "" : "s"}</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Stat label="Views" value={fmt(c.view)} current={c.view} prev={p?.view} format="number" />
                <Stat label="Downloads" value={fmt(c.dl)} current={c.dl} prev={p?.dl} format="number" />
                <Stat label="Prints" value={fmt(c.print)} current={c.print} prev={p?.print} format="number" />
                <Stat label="CR-V" value={pct(c.view, c.impr)} current={crV} prev={prevCrV} format="pp" />
                <Stat label="CR-D" value={pct(c.dl, c.view)} current={crD} prev={prevCrD} format="pp" />
                <Stat label="Likes" value={fmt(c.like)} current={c.like} prev={p?.like} format="number" />
              </div>
              <div className="mt-4">
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                  {c.ts.map((v, i) =>
                    v > 0 ? (
                      <div
                        key={i}
                        title={`${SRC_LABELS[i]} ${v}%`}
                        style={{ width: `${v}%`, background: SRC_COLORS[i] }}
                      />
                    ) : null,
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink3">
                  {c.ts.map((v, i) =>
                    v > 0 ? (
                      <span key={i}>
                        <span
                          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ background: SRC_COLORS[i] }}
                        />
                        {SRC_LABELS[i]} {v}%
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  current,
  prev,
  format,
}: {
  label: string;
  value: string;
  current: number;
  prev?: number;
  format: "number" | "pp";
}) {
  return (
    <div className="rounded-md border border-line bg-panel2 p-2">
      <div className="text-[9px] uppercase tracking-widest text-ink3">{label}</div>
      <div className="h-archivo mt-1 text-sm font-bold text-ink">{value}</div>
      {prev !== undefined && (
        <DeltaBadge current={current} prev={prev} format={format} size="xs" className="mt-0.5 block" />
      )}
    </div>
  );
}
