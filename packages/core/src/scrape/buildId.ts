import { AuthError, LIST_PAGE, mwFetch } from "./session";

export interface PageContext {
  buildId: string;
  html: string;
}

export async function getPageContext(cookie: string): Promise<PageContext> {
  const r = await mwFetch(LIST_PAGE, cookie, {}, "text/html");
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
