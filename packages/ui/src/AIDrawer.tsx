"use client";
import { useEffect, useRef, useState } from "react";
import { AISetup } from "./AISetup";
import { useAI } from "./AIProvider";
import { MiniMarkdown } from "./MiniMarkdown";
import type { AIChatEntry, AIMode, Snapshot } from "@mw/core/types";

interface Props {
  snapshot: Snapshot | null;
  prevSnapshot?: Snapshot | null;
  focusModelId?: number | null;
  suggestedPrompts: string[];
}

export function AIDrawer({ snapshot, prevSnapshot, focusModelId, suggestedPrompts }: Props) {
  const { isOpen, close, hasKey, key, setKey, mode, setMode } = useAI();
  const [showSetup, setShowSetup] = useState(false);
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<AIChatEntry[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll log to bottom on entries change.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries]);

  // If the user closes the drawer mid-stream, cancel the in-flight request.
  useEffect(() => {
    if (!isOpen && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [isOpen]);

  async function ask(rawQuestion: string) {
    const q = rawQuestion.trim();
    if (!q || running) return;
    if (!hasKey) {
      setShowSetup(true);
      return;
    }
    if (!snapshot) return;

    const id = crypto.randomUUID();
    const initial: AIChatEntry = {
      id,
      question: q,
      answer: "",
      mode,
      askedAt: Date.now(),
      finishedAt: null,
      error: null,
    };
    setEntries((e) => [...e, initial]);
    setQuestion("");
    setRunning(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          mode,
          question: q,
          snapshot,
          prevSnapshot: prevSnapshot ?? null,
          focusModelId: focusModelId ?? null,
        }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let evt: { type: string; content?: string; message?: string };
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (evt.type === "text" && evt.content) {
            setEntries((arr) =>
              arr.map((e) => (e.id === id ? { ...e, answer: e.answer + evt.content } : e)),
            );
          } else if (evt.type === "error") {
            setEntries((arr) =>
              arr.map((e) =>
                e.id === id ? { ...e, error: evt.message || "Error", finishedAt: Date.now() } : e,
              ),
            );
          } else if (evt.type === "done") {
            setEntries((arr) =>
              arr.map((e) => (e.id === id ? { ...e, finishedAt: Date.now() } : e)),
            );
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "AbortError") {
        setEntries((arr) =>
          arr.map((it) => (it.id === id ? { ...it, error: msg, finishedAt: Date.now() } : it)),
        );
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function clearLog() {
    setEntries([]);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-panel shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="h-archivo text-lg font-bold text-ink">✨ Insights</h2>
          <button
            onClick={close}
            className="text-2xl leading-none text-ink3 hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <ModeToggle mode={mode} setMode={setMode} />

        <div className="border-b border-line/60 px-4 py-2 text-[11px] text-ink3">
          One-shot Q&amp;A — each question is independent. <b>No memory between turns.</b>{" "}
          {hasKey ? (
            <button
              onClick={() => setShowSetup(true)}
              className="ml-1 underline hover:text-ink"
            >
              update key
            </button>
          ) : (
            <button
              onClick={() => setShowSetup(true)}
              className="ml-1 font-semibold text-amber underline hover:text-ink"
            >
              set Anthropic key
            </button>
          )}
        </div>

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {entries.length === 0 ? (
            <div className="space-y-3 text-center">
              <div className="text-sm text-ink2">Ask anything about your stats.</div>
              <div className="text-[11px] text-ink3">Try one of these →</div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((e) => (
                <Entry key={e.id} entry={e} />
              ))}
              {entries.length > 0 && (
                <button
                  onClick={clearLog}
                  className="mx-auto block text-[10px] text-ink3 hover:text-red"
                >
                  Clear log
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => setQuestion(p)}
                className="rounded-full border border-line bg-panel2 px-2.5 py-1 text-[11px] text-ink2 hover:border-amber hover:text-ink"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                hasKey
                  ? "Ask anything about your stats… (⌘+Enter to send)"
                  : "Set your Anthropic key first"
              }
              className="h-16 flex-1 resize-none rounded-lg border border-line bg-panel2 p-2 font-mono text-xs text-ink focus:border-teal focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  ask(question);
                }
              }}
            />
            <button
              onClick={() => ask(question)}
              disabled={running || !question.trim() || !snapshot || !hasKey}
              className="rounded-lg bg-teal px-4 text-sm font-semibold text-bg disabled:opacity-40"
            >
              {running ? "…" : "Ask"}
            </button>
          </div>
        </div>
      </aside>

      <AISetup
        open={showSetup}
        onClose={() => setShowSetup(false)}
        onSaved={(k) => setKey(k)}
      />
    </>
  );
}

function ModeToggle({ mode, setMode }: { mode: AIMode; setMode: (m: AIMode) => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-2">
      <span className="text-[10px] uppercase tracking-widest text-ink3">Mode</span>
      <div className="flex items-center gap-1">
        {(["fast", "precise"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-2 py-1 text-[11px] ${
              mode === m
                ? "bg-amber font-semibold text-bg"
                : "text-ink2 hover:text-ink"
            }`}
          >
            {m === "fast" ? "Fast" : "Precise"}
          </button>
        ))}
      </div>
      <span className="ml-auto font-mono text-[10px] text-ink3">
        {mode === "fast" ? "~5KB · curated digest" : "~60KB · full snapshot"}
      </span>
    </div>
  );
}

function Entry({ entry }: { entry: AIChatEntry }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-amber/30 bg-panel2 px-3 py-2">
        <div className="text-[10px] uppercase tracking-widest text-amber">You</div>
        <div className="mt-1 whitespace-pre-wrap text-sm text-ink">{entry.question}</div>
      </div>
      <div className="rounded-lg border border-teal/30 bg-bg px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-teal">Claude</div>
          <div className="text-[10px] uppercase tracking-widest text-ink3">{entry.mode}</div>
        </div>
        {entry.error ? (
          <div className="mt-1 text-sm text-red">{entry.error}</div>
        ) : entry.answer ? (
          <div className="mt-1 text-ink">
            <MiniMarkdown text={entry.answer} />
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2 text-sm text-ink3">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber" />
            thinking…
          </div>
        )}
      </div>
    </div>
  );
}
