import { NextRequest } from "next/server";
import { listSnapshots, readSnapshot } from "@mw/core/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    const snaps = await listSnapshots();
    return Response.json({ snapshots: snaps });
  }

  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(start) || !re.test(end)) {
    return Response.json(
      { error: "start and end must be YYYY-MM-DD" },
      { status: 400 },
    );
  }
  const snap = await readSnapshot(start, end);
  if (!snap) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(snap);
}
