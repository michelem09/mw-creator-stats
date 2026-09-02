import { describe, it, expect } from "vitest";
import { prevPeriodOf, prevYearOf, pickPrevRange, diffNumber } from "./compare";

describe("prevPeriodOf", () => {
  it("returns the same-length window immediately before the range", () => {
    expect(prevPeriodOf({ start: "2026-06-01", end: "2026-06-30" })).toEqual({
      start: "2026-05-02",
      end: "2026-05-31",
    });
  });
  it("throws on a malformed range", () => {
    expect(() => prevPeriodOf({ start: "nope", end: "2026-06-30" })).toThrow();
  });
});

describe("prevYearOf", () => {
  it("shifts the range back by 365 days", () => {
    expect(prevYearOf({ start: "2026-06-01", end: "2026-06-30" })).toEqual({
      start: "2025-06-01",
      end: "2025-06-30",
    });
  });
});

describe("pickPrevRange", () => {
  const range = { start: "2026-06-01", end: "2026-06-30" };
  it("returns null for 'none'", () => {
    expect(pickPrevRange("none", range, null)).toBeNull();
  });
  it("derives prevPeriod / prevYear from the main range", () => {
    expect(pickPrevRange("prevPeriod", range, null)).toEqual(prevPeriodOf(range));
    expect(pickPrevRange("prevYear", range, null)).toEqual(prevYearOf(range));
  });
  it("passes the custom range through for 'custom'", () => {
    const custom = { start: "2020-01-01", end: "2020-01-31" };
    expect(pickPrevRange("custom", range, custom)).toBe(custom);
  });
});

describe("diffNumber", () => {
  it("computes absolute and percentage deltas", () => {
    expect(diffNumber(120, 100)).toMatchObject({ deltaAbs: 20, deltaPct: 20 });
  });
  it("returns null deltaPct when prev is 0", () => {
    expect(diffNumber(5, 0)).toMatchObject({ deltaAbs: 5, deltaPct: null });
  });
  it("returns all-null when prev is undefined", () => {
    expect(diffNumber(10, undefined)).toMatchObject({ deltaAbs: null, deltaPct: null });
  });
});
