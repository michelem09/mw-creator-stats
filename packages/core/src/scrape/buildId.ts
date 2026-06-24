import { AuthError, LIST_PAGE, sleep } from "./session";
import type { Fetcher } from "../ports";

export interface PageContext {
  buildId: string;
  html: string;
}

/** Resolve the buildId from the data-overview page. This is the first request of a
 *  sync and a single transient Cloudflare 403 here would abort the whole run, so we
 *  retry a few times with backoff before giving up. A genuinely expired cookie still
 *  surfaces as AuthError after the attempts are exhausted. */
export async function getPageContext(
  fetcher: Fetcher,
  attempts = 3,
): Promise<PageContext> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await getPageContextOnce(fetcher);
    } catch (e) {
      lastErr = e;
      if (attempt < attempts - 1) await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Could not load the data-overview page");
}

async function getPageContextOnce(fetcher: Fetcher): Promise<PageContext> {
  const r = await fetcher(LIST_PAGE, { accept: "text/html" });
  if (r.status >= 300 && r.status < 400) {
    const rawLoc = r.headers["location"];
    const loc = Array.isArray(rawLoc) ? rawLoc[0] : rawLoc || "";
    if (/sign|login/i.test(loc)) throw new AuthError("Redirected to login");
  }
  if (!r.ok) throw new Error(`List page returned HTTP ${r.status}`);
  const html = await r.text();
  if (/\/sign|\/login/i.test(r.url)) throw new AuthError("Redirected to login");
  const m = html.match(/"buildId":"([^"]+)"/);
  if (!m) {
    throw new Error(
      "Could not find buildId in page. MakerWorld layout may have changed.",
    );
  }
  return { buildId: m[1], html };
}

export function extractNextData<T = unknown>(html: string): T | null {
  const m = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as T;
  } catch {
    return null;
  }
}
