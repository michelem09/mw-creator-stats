import { describe, it, expect } from "vitest";
import { totals, pointsBreakdown, pointsDailySeries, BOOST_POINTS } from "./aggregate";
import type { ModelStat, PointsData } from "./types";

function mk(p: Partial<ModelStat>): ModelStat {
  return {
    id: 1,
    cat: "Other",
    category: "Other",
    tags: [],
    title: "m",
    impr: 0,
    view: 0,
    dl: 0,
    print: 0,
    collect: 0,
    like: 0,
    boost: 0,
    point: 0,
    ts: [0, 0, 0, 0, 0],
    pub: "2026-01-01",
    license: "",
    instances: 0,
    ageDays: null,
    viewPerDay: null,
    dlPerDay: null,
    ...p,
  };
}

describe("totals", () => {
  it("sums the traffic metrics and counts models", () => {
    const t = totals([
      mk({ impr: 100, view: 10, dl: 5, print: 2, collect: 3, like: 4 }),
      mk({ impr: 200, view: 20, dl: 5, print: 0, collect: 1, like: 6 }),
    ]);
    expect(t).toMatchObject({ impr: 300, view: 30, dl: 10, print: 2, collect: 4, like: 10, count: 2 });
  });
});

describe("boost→points conversion", () => {
  it("uses 12 (regular) / 15 (exclusive) per boost", () => {
    expect(BOOST_POINTS).toEqual({ regular: 12, exclusive: 15 });
  });
});

describe("pointsBreakdown", () => {
  it("splits points, converts boosts, and totals correctly", () => {
    const b = pointsBreakdown({
      pointRegular: 42,
      pointExclusive: 6807.78,
      boostRegular: 0,
      boostExclusive: 152,
    });
    expect(b.boostRegularPts).toBe(0);
    expect(b.boostExclusivePts).toBe(152 * 15); // 2280
    expect(b.totalPoints).toBeCloseTo(6849.78, 2);
    expect(b.totalBoost).toBe(152);
    expect(b.totalBoostPts).toBe(2280);
    expect(b.grandTotalPoints).toBeCloseTo(9129.78, 2);
  });
});

describe("pointsDailySeries", () => {
  it("converts each day's boosts to points and totals the four sources", () => {
    const data: PointsData = {
      summary: { pointRegular: 10, pointExclusive: 252.64, boostRegular: 2, boostExclusive: 4 },
      daily: [
        { date: "2026-05-29", pointRegular: 0, pointExclusive: 247.64, boostRegular: 0, boostExclusive: 1 },
        { date: "2026-05-30", pointRegular: 10, pointExclusive: 5, boostRegular: 2, boostExclusive: 3 },
      ],
    };
    const s = pointsDailySeries(data);
    expect(s[0]).toMatchObject({ boostRegularPts: 0, boostExclusivePts: 15 });
    expect(s[0].total).toBeCloseTo(262.64, 2); // 0 + 247.64 + 0 + 15
    expect(s[1]).toMatchObject({ boostRegularPts: 24, boostExclusivePts: 45 });
    expect(s[1].total).toBe(84); // 10 + 5 + 24 + 45
  });
});
