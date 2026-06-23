import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  let body: { apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = (body.apiKey || process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return Response.json({ ok: false, error: "No API key provided" });
  }
  if (!apiKey.startsWith("sk-ant-")) {
    return Response.json({
      ok: false,
      error: "Key does not look like an Anthropic key (must start with sk-ant-).",
    });
  }

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (r.ok) {
      return Response.json({ ok: true });
    }

    let errMsg = `HTTP ${r.status}`;
    try {
      const j = (await r.json()) as { error?: { message?: string } };
      if (j.error?.message) errMsg = j.error.message;
    } catch {
      /* ignore parse failure */
    }
    return Response.json({ ok: false, error: errMsg });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
