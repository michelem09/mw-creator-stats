import type { Fetcher } from "@mw/core/ports";
import { AuthError } from "@mw/core/scrape/session";

// Extension transport: fetch MakerWorld directly from the extension page. host_permissions
// bypass CORS and the browser attaches the user's live session cookies (incl. cf_clearance),
// so the cookie argument is unused here — there's nothing to paste.
export function directFetcher(_cookie: string): Fetcher {
  return async (url, init = {}) => {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: init.accept ?? "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401 || res.status === 403) throw new AuthError();
    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return {
      ok: res.ok,
      status: res.status,
      url: res.url,
      headers,
      async text() {
        return body;
      },
      async json<T = unknown>(): Promise<T> {
        return JSON.parse(body) as T;
      },
    };
  };
}
