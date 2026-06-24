export const BASE = "https://makerworld.com";
export const LIST_PAGE = `${BASE}/en/my/data-overview/model`;
// Browser-like UA. Adapters that don't run in a real browser (server relay) should
// forward this so it matches the cf_clearance the user obtained in their browser.
export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export function normalizeCookie(raw: string): string {
  const v = raw.trim().replace(/^Cookie:\s*/i, "");
  if (!v) return "";
  if (!v.includes("=")) return `token=${v}`;
  return v;
}

export class AuthError extends Error {
  constructor(msg = "Cookie missing or expired") {
    super(msg);
    this.name = "AuthError";
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
