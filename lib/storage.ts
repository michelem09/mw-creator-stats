import { promises as fs } from "node:fs";
import path from "node:path";
import type { Snapshot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function safeRange(start: string, end: string): string {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(start) || !re.test(end)) {
    throw new Error("Invalid date range. Expected YYYY-MM-DD.");
  }
  return `${start}_${end}`;
}

function snapshotPath(start: string, end: string): string {
  return path.join(DATA_DIR, `snapshot-${safeRange(start, end)}.json`);
}

export async function readSnapshot(
  start: string,
  end: string,
): Promise<Snapshot | null> {
  try {
    const raw = await fs.readFile(snapshotPath(start, end), "utf-8");
    return JSON.parse(raw) as Snapshot;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export async function writeSnapshot(snap: Snapshot): Promise<string> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const p = snapshotPath(snap.meta.dateRange.start, snap.meta.dateRange.end);
  await fs.writeFile(p, JSON.stringify(snap), "utf-8");
  return p;
}

export async function listSnapshots(): Promise<
  Array<{ start: string; end: string; size: number; mtime: number }>
> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const out: Array<{ start: string; end: string; size: number; mtime: number }> = [];
    for (const f of files) {
      const m = f.match(/^snapshot-(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.json$/);
      if (!m) continue;
      const st = await fs.stat(path.join(DATA_DIR, f));
      out.push({ start: m[1], end: m[2], size: st.size, mtime: st.mtimeMs });
    }
    return out.sort((a, b) => b.mtime - a.mtime);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
