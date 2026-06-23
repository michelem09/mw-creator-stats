import { fmt } from "@/lib/format";
import type { Totals } from "@/lib/aggregate";
import { DeltaBadge } from "../DeltaBadge";

export function Overview({ t, prev }: { t: Totals; prev?: Totals }) {
  const items: Array<[string, keyof Totals, string]> = [
    ["Impressions", "impr", "text-ink2"],
    ["Views", "view", "text-teal"],
    ["Downloads", "dl", "text-amber"],
    ["Prints", "print", "text-red"],
    ["Models", "count", "text-violet"],
  ];
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map(([label, key, color]) => {
        const value = t[key];
        const prevValue = prev?.[key];
        return (
          <div key={label} className="rounded-xl border border-line bg-panel p-5">
            <div className="text-[10px] uppercase tracking-widest text-ink3">{label}</div>
            <div className={`h-archivo mt-2 text-3xl font-extrabold ${color}`}>
              {fmt(value)}
            </div>
            {prev !== undefined && (
              <div className="mt-1">
                <DeltaBadge
                  current={value}
                  prev={prevValue}
                  format="number"
                  size="xs"
                  showPrev
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
