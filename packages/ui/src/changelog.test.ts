import { describe, it, expect } from "vitest";
import { compareVersions, notesSince, CHANGELOG } from "./changelog";

describe("compareVersions", () => {
  it("orders dotted versions numerically (not lexicographically)", () => {
    expect(compareVersions("0.1.4", "0.1.2")).toBeGreaterThan(0);
    expect(compareVersions("0.1.2", "0.1.10")).toBeLessThan(0);
    expect(compareVersions("0.1.4", "0.1.4")).toBe(0);
  });
});

describe("notesSince", () => {
  it("returns only entries newer than the seen version", () => {
    expect(notesSince("0.1.1").map((e) => e.version)).toEqual(["0.1.4", "0.1.2"]);
  });
  it("returns nothing when already on the latest", () => {
    expect(notesSince(CHANGELOG[0].version)).toEqual([]);
  });
});
