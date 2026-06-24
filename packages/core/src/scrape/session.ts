import { gotScraping } from "got-scraping";

export const BASE = "https://makerworld.com";
export const LIST_PAGE = `${BASE}/en/my/data-overview/model`;
// kept for backward-compat with anything importing UA; got-scraping picks its own
export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function normalize(raw: string): string {
  const v = raw.trim().replace(/^Cookie:\s*/i, "");
  if (!v) return "";
  if (!v.includes("=")) return `token=${v}`;
  return v;
}

export function resolveCookie(provided?: string | null): string | null {
  const fromBody = provided ? normalize(provided) : "";
  if (fromBody) return fromBody;
  const fromEnv = process.env.MW_COOKIE ? normalize(process.env.MW_COOKIE) : "";
  if (fromEnv) return fromEnv;
  return null;
}

export class AuthError extends Error {
  constructor(msg = "Cookie missing or expired") {
    super(msg);
    this.name = "AuthError";
  }
}

/** Minimal Response-like wrapper so callers can keep using r.ok / r.status / r.json() / r.text(). */
export interface MwResponse {
  ok: boolean;
  status: number;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
}

export async function mwFetch(
  url: string,
  cookie: string,
  init: { headers?: Record<string, string> } = {},
  accept = "application/json",
): Promise<MwResponse> {
  const extra = init.headers || {};
  // gotScraping handles UA, sec-* and Accept-Language for us; we just inject Cookie + Accept + any caller header.
  const r = await gotScraping({
    url,
    headers: {
      Cookie: cookie,
      Accept: accept,
      Referer: LIST_PAGE,
      ...extra,
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
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
