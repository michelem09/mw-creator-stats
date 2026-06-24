"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryAgg } from "@mw/core/aggregate";
import { CHART_TOOLTIP } from "@mw/core/chartTheme";

export function Conversions({ cats }: { cats: CategoryAgg[] }) {
  const data = cats.map((c) => ({
    name: c.name,
    crView: c.impr ? +((c.view / c.impr) * 100).toFixed(2) : 0,
    crDl: c.view ? +((c.dl / c.view) * 100).toFixed(2) : 0,
  }));

  return (
    <section>
      <h2 className="h-archivo text-lg font-bold text-ink">Conversions</h2>
      <p className="mt-1 text-sm text-ink2">
        <b className="text-teal">Impression → View</b> tells you how good your
        cover and title are in the feed.{" "}
        <b className="text-amber">View → Download</b> tells you how well the
        page sells the model.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Impression → View (%)" data={data} dataKey="crView" color="#3fb9a6" />
        <Panel title="View → Download (%)" data={data} dataKey="crDl" color="#e8902a" />
      </div>
    </section>
  );
}

function Panel({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<{ name: string; crView: number; crDl: number }>;
  dataKey: "crView" | "crDl";
  color: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 text-xs uppercase tracking-widest text-ink3">{title}</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="#332a1f" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#807461", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fill: "#807461", fontSize: 10 }} unit="%" />
            <Tooltip
              contentStyle={CHART_TOOLTIP.contentStyle}
              labelStyle={CHART_TOOLTIP.labelStyle}
              itemStyle={CHART_TOOLTIP.itemStyle}
              cursor={CHART_TOOLTIP.cursor}
              formatter={(v: number) => `${v}%`}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
