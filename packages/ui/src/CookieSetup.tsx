"use client";
import { useEffect, useState } from "react";

type TestState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; buildId: string }
  | { kind: "fail"; message: string; auth?: boolean };

const COOKIE_KEY = "mw_cookie";

export function loadCookie(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(COOKIE_KEY) || "";
}

export function normalizeCookie(raw: string): string {
  const v = raw.trim().replace(/^Cookie:\s*/i, "");
  if (!v) return "";
  // If the user pasted only the bare token value (no "=" anywhere),
  // assume it's the value of the "token" cookie and prefix it.
  if (!v.includes("=")) return `token=${v}`;
  return v;
}

export function saveCookie(value: string) {
  window.localStorage.setItem(COOKIE_KEY, normalizeCookie(value));
}

export function clearCookie() {
  window.localStorage.removeItem(COOKIE_KEY);
}

export function CookieSetup({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (cookie: string) => void;
}) {
  const [value, setValue] = useState("");
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  useEffect(() => {
    if (open) {
      setValue(loadCookie());
      setTest({ kind: "idle" });
    }
  }, [open]);

  async function runTest() {
    const v = normalizeCookie(value);
    if (!v) return;
    setTest({ kind: "running" });
    try {
      const r = await fetch("/api/test-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: v }),
      });
      const j = (await r.json()) as { ok: boolean; buildId?: string; error?: string; auth?: boolean };
      if (j.ok && j.buildId) setTest({ kind: "ok", buildId: j.buildId });
      else setTest({ kind: "fail", message: j.error || "Unknown error", auth: j.auth });
    } catch (e) {
      setTest({ kind: "fail", message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-panel p-6">
        <h2 className="h-archivo text-xl font-bold text-ink">
          Paste your MakerWorld cookie
        </h2>
        <p className="mt-2 text-sm text-ink2">
          Your cookie stays in your browser&apos;s localStorage. It is sent to
          the local API only to scrape your MakerWorld data on your behalf.
        </p>

        <div className="mt-4 space-y-3 text-sm text-ink2">
          <p>You can paste either form — the app normalises it for you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b className="text-ink">Full Cookie header</b> (most reliable) — a
              long string with many <code>name=value</code> pairs separated by{" "}
              <code>;</code>.
            </li>
            <li>
              <b className="text-ink">Just the &quot;token&quot; value</b> — the
              bare string starting with <code>AAD…</code>. The app will
              automatically prepend <code className="text-amber">token=</code>{" "}
              for you.
            </li>
          </ul>
        </div>

        <details className="mt-3 rounded-lg border border-line bg-panel2 p-3 text-xs text-ink2">
          <summary className="cursor-pointer text-ink">
            How to find your cookie (30s)
          </summary>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>
              Open{" "}
              <a
                className="text-teal underline"
                href="https://makerworld.com/en/my/data-overview/model"
                target="_blank"
                rel="noopener noreferrer"
              >
                makerworld.com/en/my/data-overview/model
              </a>{" "}
              while logged in.
            </li>
            <li>
              DevTools (<code className="text-amber">Cmd/Ctrl + Opt + I</code>) →{" "}
              <b>Application → Storage → Cookies → makerworld.com</b>. Copy the
              value of the cookie named <code className="text-amber">token</code>.
            </li>
            <li>
              Or: <b>Network</b> tab → reload → click a request →{" "}
              <b>Request Headers</b> → copy the full <code>Cookie:</code> value.
            </li>
          </ol>
        </details>

        <textarea
          className="mt-4 h-32 w-full resize-none rounded-lg border border-line bg-panel2 p-3 font-mono text-xs text-ink focus:border-teal focus:outline-none"
          placeholder="token=AAD…   — or paste the full Cookie header"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value.trim() && !value.includes("=") && (
          <p className="mt-1 text-[11px] text-amber">
            ↳ Will be saved as <code>token={value.trim().slice(0, 16)}…</code>
          </p>
        )}

        {test.kind === "ok" && (
          <p className="mt-2 text-[12px] text-teal">
            ✓ MakerWorld accepted this cookie (buildId resolved).
          </p>
        )}
        {test.kind === "fail" && (
          <p className="mt-2 text-[12px] text-red">
            ✗ {test.auth ? "Cookie missing or expired. Grab a fresh one from DevTools → Application." : test.message}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-ink2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            disabled={!value.trim() || test.kind === "running"}
            onClick={runTest}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:border-amber disabled:opacity-40"
          >
            {test.kind === "running" ? "Testing…" : "Test cookie"}
          </button>
          <button
            disabled={!value.trim()}
            onClick={() => {
              saveCookie(value);
              onSaved(normalizeCookie(value));
              onClose();
            }}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
          >
            Save cookie
          </button>
        </div>
      </div>
    </div>
  );
}
