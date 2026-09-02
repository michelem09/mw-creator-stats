import { describe, it, expect } from "vitest";
import { parsePointsData } from "./points";

describe("parsePointsData", () => {
  it("parses the summary split and daily series (model + instance points combined)", () => {
    const sd = {
      summary: { pointRegular: 42, pointExclusive: 6807.78, boostRegular: 0, boostExclusive: 152 },
      dateList: [
        {
          intervalVal: "2026/05/29",
          pointFromModelRegular: 0,
          pointFromModelExclusive: 205.14,
          pointFromInstRegular: 0,
          pointFromInstExclusive: 42.5,
          boostRegular: 0,
          boostExclusive: 1,
        },
      ],
    };
    const p = parsePointsData(sd)!;
    expect(p.summary).toEqual({ pointRegular: 42, pointExclusive: 6807.78, boostRegular: 0, boostExclusive: 152 });
    expect(p.daily).toHaveLength(1);
    expect(p.daily[0].date).toBe("2026-05-29"); // slashes normalised to dashes
    expect(p.daily[0].pointRegular).toBe(0);
    expect(p.daily[0].pointExclusive).toBeCloseTo(247.64, 2); // 205.14 + 42.5
    expect(p.daily[0].boostExclusive).toBe(1);
  });

  it("coerces string-valued numbers", () => {
    const p = parsePointsData({ summary: { pointRegular: "42", pointExclusive: "0", boostRegular: "0", boostExclusive: "3" } })!;
    expect(p.summary.pointRegular).toBe(42);
    expect(p.summary.boostExclusive).toBe(3);
  });

  it("returns null when there is no usable signal", () => {
    expect(parsePointsData(null)).toBeNull();
    expect(parsePointsData({})).toBeNull();
    expect(parsePointsData({ summary: { pointRegular: 0, pointExclusive: 0, boostRegular: 0, boostExclusive: 0 } })).toBeNull();
  });
});
