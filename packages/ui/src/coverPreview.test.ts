import { describe, it, expect } from "vitest";
import { coverPreviewPos } from "./coverPreview";

const VP = { width: 1000, height: 800 };
const SIZE = 176;

describe("coverPreviewPos", () => {
  it("places the preview to the right, vertically centered, when there is room", () => {
    const r = { left: 100, right: 140, top: 300, height: 36 };
    expect(coverPreviewPos(r, VP, SIZE)).toEqual({ x: 148, y: 230 });
  });

  it("flips to the left of the thumb when it would overflow the right edge", () => {
    const r = { left: 900, right: 940, top: 300, height: 36 };
    expect(coverPreviewPos(r, VP, SIZE).x).toBe(900 - SIZE - 8); // 716
  });

  it("clamps to the top edge", () => {
    const r = { left: 100, right: 140, top: 0, height: 36 };
    expect(coverPreviewPos(r, VP, SIZE).y).toBe(8);
  });

  it("clamps to the bottom edge", () => {
    const r = { left: 100, right: 140, top: 790, height: 36 };
    expect(coverPreviewPos(r, VP, SIZE).y).toBe(VP.height - SIZE - 8); // 616
  });
});
