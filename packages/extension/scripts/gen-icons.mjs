// Rasterise icon.svg into the PNG sizes Chrome needs. Run: node scripts/gen-icons.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(resolve(here, "../icon.svg"));
const outDir = resolve(here, "../public/icons");
mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 128];
await Promise.all(
  sizes.map((s) =>
    sharp(svg, { density: 384 })
      .resize(s, s)
      .png()
      .toFile(resolve(outDir, `icon-${s}.png`)),
  ),
);
console.log("generated icons:", sizes.map((s) => `icon-${s}.png`).join(", "));
