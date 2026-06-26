"use client";
import { useEffect, useState } from "react";
import { testKey } from "@mw/core/ai/ask";
import { PROVIDER_LIST, providerMeta } from "@mw/core/ai/providers";
import type { AIProviderId } from "@mw/core/types";
import { useAI } from "./AIProvider";
import { loadKey } from "./aiKeys";

type TestState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok" }
  | { kind: "fail"; message: string };

export function AISetup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { provider, applyKey } = useAI();
  const [sel, setSel] = useState<AIProviderId>(provider);
  const [value, setValue] = useState("");
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  // On open, sync to the active provider and its stored key.
  useEffect(() => {
    if (open) {
      setSel(provider);
      setValue(loadKey(provider));
      setTest({ kind: "idle" });
    }
  }, [open, provider]);

  function pickProvider(p: AIProviderId) {
    setSel(p);
    setValue(loadKey(p));
    setTest({ kind: "idle" });
  }

  async function runTest() {
    const v = value.trim();
    if (!v) return;
    setTest({ kind: "running" });
    try {
      const j = await testKey(sel, v);
      if (j.ok) setTest({ kind: "ok" });
      else setTest({ kind: "fail", message: j.error || "Unknown error" });
    } catch (e) {
      setTest({ kind: "fail", message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (!open) return null;

  const meta = providerMeta(sel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-panel p-6">
        <h2 className="h-archivo text-xl font-bold text-ink">Connect an AI provider</h2>
        <p className="mt-2 text-sm text-ink2">
          Pick a provider and paste your own API key to enable the Insights drawer — a
          one-shot Q&amp;A about your stats. The key is stored only in your
          browser&apos;s <code>localStorage</code>.
        </p>

        {/* Provider selector */}
        <div className="mt-4 flex gap-2">
          {PROVIDER_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => pickProvider(p.id)}
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                sel === p.id
                  ? "border-teal bg-panel2 text-ink"
                  : "border-line text-ink2 hover:border-ink3"
              }`}
            >
              <div className="font-semibold">{p.label}</div>
              <div className="mt-0.5 text-[11px] text-ink3">
                {p.free ? "Free · no credit card" : "Paid · small credit needed"}
              </div>
            </button>
          ))}
        </div>

        <details className="mt-3 rounded-lg border border-line bg-panel2 p-3 text-xs text-ink2">
          <summary className="cursor-pointer text-ink">
            How to get a {meta.shortLabel} API key
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Visit{" "}
              <a
                href={meta.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline"
              >
                {meta.consoleLabel}
              </a>{" "}
              (sign in if needed).
            </li>
            <li>Create an API key.</li>
            {!meta.free && <li>Add a small amount of credit if your account has none (e.g. $5).</li>}
            <li>
              Copy the key (starts with{" "}
              <code className="text-amber">{meta.keyPrefix}…</code>) and paste it below.
            </li>
          </ol>
        </details>

        <textarea
          className="mt-4 h-24 w-full resize-none rounded-lg border border-line bg-panel2 p-3 font-mono text-xs text-ink focus:border-teal focus:outline-none"
          placeholder={meta.keyPlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        {test.kind === "ok" && (
          <p className="mt-2 text-[12px] text-teal">
            ✓ {meta.shortLabel} accepted this key. You can save and start chatting.
          </p>
        )}
        {test.kind === "fail" && <p className="mt-2 text-[12px] text-red">✗ {test.message}</p>}

        <p className="mt-3 text-[11px] text-ink3">
          {meta.privacyNote} Each question sends your current snapshot (or a curated digest)
          to <span className="font-mono">{meta.host}</span> directly from your browser; the
          key never leaves this browser&apos;s storage and never touches any backend.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink2 hover:text-ink">
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
              applyKey(sel, value);
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
