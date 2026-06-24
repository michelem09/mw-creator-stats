import type { Fetcher } from "@mw/core/ports";
import { AuthError } from "@mw/core/scrape/session";

interface ProxyResult {
  ok?: boolean;
  status?: number;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: string;
  auth?: boolean;
  error?: string;
}

/** Web (standalone) transport: the browser runs the scrape, but each MakerWorld
 *  request goes through the same-origin /api/mw-proxy relay to dodge CORS. */
export function relayFetcher(cookie: string): Fetcher {
  return async (url, init = {}) => {
    const res = await fetch("/api/mw-proxy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, init, cookie }),
    });
    const j = (await res.json().catch(() => ({}))) as ProxyResult;
    if (j.auth) throw new AuthError();
    if (j.error && j.status == null) throw new Error(j.error);
    const bodyText = j.body ?? "";
    return {
      ok: !!j.ok,
      status: j.status ?? res.status,
      url: j.url ?? url,
      headers: j.headers ?? {},
      async text() {
        return bodyText;
      },
      async json<T = unknown>(): Promise<T> {
        return JSON.parse(bodyText) as T;
      },
    };
  };
}
