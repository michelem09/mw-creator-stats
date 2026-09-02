export interface PreviewRect {
  left: number;
  right: number;
  top: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** Where to place the fixed cover-preview image: just to the right of the thumb,
 *  flipped to the left if it would overflow the viewport, and clamped vertically
 *  so it never spills off the top or bottom. */
export function coverPreviewPos(
  rect: PreviewRect,
  vp: Viewport,
  size: number,
  gap = 8,
): { x: number; y: number } {
  let x = rect.right + gap;
  if (x + size > vp.width) x = rect.left - size - gap;
  const centered = rect.top + rect.height / 2 - size / 2;
  const y = Math.max(gap, Math.min(centered, vp.height - size - gap));
  return { x, y };
}
