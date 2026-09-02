import { describe, it, expect } from "vitest";
import { fmt, fmt0, pct } from "./format";

describe("fmt", () => {
  it("formats plain numbers under 1000", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(42)).toBe("42");
    expect(fmt(999)).toBe("999");
  });
  it("uses k / M suffixes and trims trailing .0", () => {
    expect(fmt(1000)).toBe("1k");
    expect(fmt(1500)).toBe("1.5k");
    expect(fmt(12_345)).toBe("12.3k");
    expect(fmt(1_000_000)).toBe("1M");
    expect(fmt(2_500_000)).toBe("2.5M");
  });
  it("handles negatives and non-finite input", () => {
    expect(fmt(-1500)).toBe("-1.5k");
    expect(fmt(NaN)).toBe("0");
    expect(fmt(Infinity)).toBe("0");
  });
});

describe("fmt0", () => {
  it("rounds to an integer with grouping", () => {
    expect(fmt0(1234.6)).toBe("1,235");
    expect(fmt0(NaN)).toBe("0");
  });
});

describe("pct", () => {
  it("computes a percentage with the given precision", () => {
    expect(pct(50, 200)).toBe("25.0%");
    expect(pct(1, 3, 2)).toBe("33.33%");
  });
  it("returns 0% when the denominator is falsy", () => {
    expect(pct(5, 0)).toBe("0%");
  });
});
