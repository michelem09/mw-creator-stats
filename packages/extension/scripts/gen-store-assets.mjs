// Render promo graphics for the Chrome Web Store. Run: node scripts/gen-store-assets.mjs
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../store-assets");
mkdirSync(outDir, { recursive: true });

const FONT = "DejaVu Sans, sans-serif";

// Reusable bar-chart logo mark, scalable via translate/scale.
// Bars form an "M": two tall outer bars, a lower middle one.
function logo(x, y, s) {
  return `
    <g transform="translate(${x},${y}) scale(${s})">
      <rect x="0" y="0" width="128" height="128" rx="28" fill="#1d1812" stroke="#332a1f" stroke-width="3"/>
      <rect x="24" y="26" width="20" height="76" rx="5" fill="#3fb9a6"/>
      <rect x="50" y="54" width="20" height="48" rx="5" fill="#e8902a"/>
      <rect x="76" y="26" width="20" height="76" rx="5" fill="#e8dfd2"/>
    </g>`;
}

// 4-pointed star path centered at (cx, cy).
function starPath(cx, cy, ro, ri) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? ro : ri;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

// "AI Insights" pill badge, top-left corner at (x, y).
function badge(x, y, w, h, fontSize) {
  const r = h / 2;
  const cy = y + h / 2;
  const starX = x + r + 1;
  const star = starPath(starX, cy, r * 0.48, r * 0.2);
  const textX = starX + r * 0.48 + 6;
  const textY = cy + Math.round(fontSize * 0.37);
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#4f46e5"/>
    <path d="${star}" fill="white"/>
    <text x="${textX}" y="${textY}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="white">AI Insights</text>`;
}

function marquee() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#14110d"/>
        <stop offset="1" stop-color="#1d1812"/>
      </linearGradient>
    </defs>
    <rect width="1400" height="560" fill="url(#bg)"/>
    ${logo(120, 176, 1.6)}
    <text x="420" y="232" font-family="${FONT}" font-size="34" font-weight="600" fill="#e8902a" letter-spacing="2">MAKERWORLD</text>
    <text x="418" y="316" font-family="${FONT}" font-size="92" font-weight="800" fill="#e8dfd2">Creator Stats</text>
    <text x="422" y="372" font-family="${FONT}" font-size="30" fill="#b9ad99">Private, full-page analytics for your MakerWorld models.</text>
    <text x="422" y="412" font-family="${FONT}" font-size="30" fill="#b9ad99">Date ranges, comparisons, drill-down — all in your browser.</text>
    <text x="422" y="476" font-family="${FONT}" font-size="22" fill="#807461">by @michelem · unofficial</text>
    ${badge(1400 - 200 - 40, 40, 200, 38, 16)}
  </svg>`;
}

function tile() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
    <rect width="440" height="280" fill="#14110d"/>
    <rect x="0" y="0" width="440" height="280" fill="none" stroke="#332a1f" stroke-width="2"/>
    ${logo(40, 40, 0.62)}
    <text x="130" y="74" font-family="${FONT}" font-size="16" font-weight="600" fill="#e8902a" letter-spacing="1.5">MAKERWORLD</text>
    <text x="128" y="116" font-family="${FONT}" font-size="40" font-weight="800" fill="#e8dfd2">Creator Stats</text>
    <text x="40" y="196" font-family="${FONT}" font-size="20" fill="#b9ad99">Private analytics dashboard for</text>
    <text x="40" y="226" font-family="${FONT}" font-size="20" fill="#b9ad99">your MakerWorld models.</text>
    <text x="40" y="262" font-family="${FONT}" font-size="15" fill="#807461">by @michelem · runs in your browser</text>
    ${badge(440 - 152 - 24, 24, 152, 30, 13)}
  </svg>`;
}

// Store requires 24-bit PNG with no alpha channel.
await sharp(Buffer.from(marquee())).removeAlpha().png().toFile(resolve(outDir, "promo-1400x560.png"));
await sharp(Buffer.from(tile())).removeAlpha().png().toFile(resolve(outDir, "promo-440x280.png"));
console.log("generated: promo-1400x560.png, promo-440x280.png");
