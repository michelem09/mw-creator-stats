import { NextRequest } from "next/server";
import { resolveCookie } from "@mw/core/scrape/session";
import { startJob } from "@mw/core/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SyncBody {
  start?: string;
  end?: string;
  cookie?: string;
  options?: { delayMs?: number; skipMetadata?: boolean };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  let body: SyncBody;
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { start, end, cookie: bodyCookie, options } = body;
  if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return Response.json(
      { error: "start and end are required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const cookie = resolveCookie(bodyCookie);
  if (!cookie) {
    return Response.json(
      { error: "No cookie. Provide one in the body or set MW_COOKIE." },
      { status: 401 },
    );
  }

  const job = startJob({
    range: { start, end },
    cookie,
    options: {
      delayMs: options?.delayMs,
      skipMetadata: options?.skipMetadata,
    },
  });

  return Response.json({ jobId: job.id, job });
}
