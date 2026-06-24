import { gotScraping } from "got-scraping";
import { AuthError, LIST_PAGE, normalizeCookie } from "@mw/core/scrape/session";
import type { Fetcher } from "@mw/core/ports";

/** Server-side transport adapter (current standalone behaviour). Closes over the
 *  user's cookie and lets got-scraping supply browser-like headers + HTTP/2. */
export function gotScrapingFetcher(cookie: string): Fetcher {
  return async (url, init = {}) => {
    const r = await gotScraping({
      url,
      headers: {
        Cookie: cookie,
        Accept: init.accept ?? "application/json",
        Referer: LIST_PAGE,
        ...(init.headers ?? {}),
      },
      throwHttpErrors: false,
      followRedirect: false,
      timeout: { request: 30_000 },
    });

    if (r.statusCode === 401 || r.statusCode === 403) throw new AuthError();

    const body = typeof r.body === "string" ? r.body : String(r.body);
    return {
      ok: r.statusCode >= 200 && r.statusCode < 300,
      status: r.statusCode,
      url: r.url,
      headers: r.headers as Record<string, string | string[] | undefined>,
      async text() {
        return body;
      },
      async json<T = unknown>(): Promise<T> {
        return JSON.parse(body) as T;
      },
    };
  };
}

/** UI cookie wins, else the MW_COOKIE env fallback (shared/Docker setups). */
export function resolveCookie(provided?: string | null): string | null {
  const fromBody = provided ? normalizeCookie(provided) : "";
  if (fromBody) return fromBody;
  const fromEnv = process.env.MW_COOKIE ? normalizeCookie(process.env.MW_COOKIE) : "";
  if (fromEnv) return fromEnv;
  return null;
}
