import { NextRequest } from "next/server";
import { AuthError } from "@mw/core/scrape/session";
import { gotScrapingFetcher, resolveCookie } from "@/lib/adapters/fetchGotScraping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stateless relay: the client runs the scrape orchestration in-page, but a browser
// page can't reach makerworld.com cross-origin (CORS). Each transport call is proxied
// here, executed server-side with the user's cookie, and the response is handed back.
// Nothing is persisted; snapshots live in the browser's IndexedDB.

interface ProxyBody {
  url?: string;
  init?: { headers?: Record<string, string>; accept?: string };
  cookie?: string;
}

export async function POST(req: NextRequest) {
  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.url || !/^https:\/\/makerworld\.com\//.test(body.url)) {
    return Response.json({ error: "Only makerworld.com URLs are allowed" }, { status: 400 });
  }

  const cookie = resolveCookie(body.cookie);
  if (!cookie) {
    return Response.json({ auth: true, error: "No cookie provided and MW_COOKIE not set." });
  }

  try {
    const r = await gotScrapingFetcher(cookie)(body.url, body.init);
    return Response.json({
      ok: r.ok,
      status: r.status,
      url: r.url,
      headers: r.headers,
      body: await r.text(),
    });
  } catch (e) {
    if (e instanceof AuthError) return Response.json({ auth: true });
    return Response.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
