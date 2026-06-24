"use client";
import { useEffect, useState } from "react";
import { testAnthropicKey } from "@mw/core/ai/ask";

const KEY_STORAGE = "mw_anthropic_key";

type TestState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok" }
  | { kind: "fail"; message: string };

export function loadAnthropicKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_STORAGE) || "";
}

export function saveAnthropicKey(value: string) {
  window.localStorage.setItem(KEY_STORAGE, value.trim());
}

export function clearAnthropicKey() {
  window.localStorage.removeItem(KEY_STORAGE);
}

export function AISetup({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}) {
  const [value, setValue] = useState("");
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  useEffect(() => {
    if (open) {
      setValue(loadAnthropicKey());
      setTest({ kind: "idle" });
    }
  }, [open]);

  async function runTest() {
    const v = value.trim();
    if (!v) return;
    setTest({ kind: "running" });
    try {
      const j = await testAnthropicKey(v);
      if (j.ok) setTest({ kind: "ok" });
      else setTest({ kind: "fail", message: j.error || "Unknown error" });
    } catch (e) {
      setTest({ kind: "fail", message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-panel p-6">
        <h2 className="h-archivo text-xl font-bold text-ink">
          Connect Anthropic Claude
        </h2>
        <p className="mt-2 text-sm text-ink2">
          Paste your own Anthropic API key to enable the Insights drawer — a
          one-shot Q&amp;A about your stats. The key is stored only in your
          browser&apos;s <code>localStorage</code>.
        </p>

        <details className="mt-3 rounded-lg border border-line bg-panel2 p-3 text-xs text-ink2">
          <summary className="cursor-pointer text-ink">
            How to get an Anthropic API key
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Visit{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline"
              >
                console.anthropic.com/settings/keys
              </a>{" "}
              (sign up if needed).
            </li>
            <li>Click <b>Create key</b>, give it a name like &quot;mw-stats&quot;.</li>
            <li>Add a small amount of credit if your account has none (e.g. $5).</li>
            <li>Copy the key (starts with <code className="text-amber">sk-ant-…</code>) and paste it below.</li>
          </ol>
        </details>

        <textarea
          className="mt-4 h-24 w-full resize-none rounded-lg border border-line bg-panel2 p-3 font-mono text-xs text-ink focus:border-teal focus:outline-none"
          placeholder="sk-ant-api03-…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        {test.kind === "ok" && (
          <p className="mt-2 text-[12px] text-teal">
            ✓ Anthropic accepted this key. You can save and start chatting.
          </p>
        )}
        {test.kind === "fail" && (
          <p className="mt-2 text-[12px] text-red">✗ {test.message}</p>
        )}

        <p className="mt-3 text-[11px] text-ink3">
          Privacy: each question you ask sends your current snapshot (or a
          curated digest of it, depending on the mode) to{" "}
          <span className="font-mono">api.anthropic.com</span> directly from your
          browser. Your key never leaves this browser&apos;s storage and never
          touches any backend.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
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
            {test.kind === "running" ? "Testing…" : "Test key"}
          </button>
          <button
            disabled={!value.trim()}
            onClick={() => {
              saveAnthropicKey(value);
              onSaved(value.trim());
              onClose();
            }}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
