import { describe, it, expect, afterEach, vi } from "vitest";
import { streamGemini, GEMINI_DEFAULT_MODEL } from "./gemini";

const enc = new TextEncoder();

/** A ReadableStream of UTF-8 bytes for the given SSE event payloads. */
function sseBody(events: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(c) {
      for (const e of events) c.enqueue(enc.encode(`data: ${e}\n\n`));
      c.close();
    },
  });
}

function textEvent(text: string): string {
  return JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] });
}

/** Drain the string stream returned by streamGemini. */
async function collect(stream: ReadableStream<string>): Promise<{ out: string; err: Error | null }> {
  const reader = stream.getReader();
  let out = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      out += value;
    }
    return { out, err: null };
  } catch (e) {
    return { out, err: e as Error };
  }
}

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("gemini model", () => {
  it("defaults to the lite '-latest' alias (available, non-thinking, doesn't hang)", () => {
    expect(GEMINI_DEFAULT_MODEL).toBe("gemini-flash-lite-latest");
  });
});

describe("streamGemini request", () => {
  it("targets the default model and does NOT send thinkingConfig (lite rejects it)", async () => {
    let captured: { url: string; body: string } | null = null;
    globalThis.fetch = vi.fn(async (url: string, opts: RequestInit) => {
      captured = { url: String(url), body: String(opts.body) };
      return { ok: true, status: 200, body: sseBody([textEvent("hi")]) } as unknown as Response;
    }) as unknown as typeof fetch;

    await collect(await streamGemini({ apiKey: "k", system: "s", user: "u" }));

    expect(captured!.url).toContain(GEMINI_DEFAULT_MODEL);
    const body = JSON.parse(captured!.body);
    expect(body.generationConfig).toBeDefined();
    expect(body.generationConfig.maxOutputTokens).toBeGreaterThan(0);
    expect(body.generationConfig.thinkingConfig).toBeUndefined();
  });
});

describe("streamGemini streaming", () => {
  it("concatenates text across SSE chunks", async () => {
    globalThis.fetch = vi.fn(async () =>
      ({ ok: true, status: 200, body: sseBody([textEvent("Hello"), textEvent(" world")]) }) as unknown as Response,
    ) as unknown as typeof fetch;

    const { out, err } = await collect(await streamGemini({ apiKey: "k", system: "s", user: "u" }));
    expect(err).toBeNull();
    expect(out).toBe("Hello world");
  });

  it("errors (never silently ends) when the stream yields no text", async () => {
    const noText = JSON.stringify({ candidates: [{ finishReason: "MAX_TOKENS" }] });
    globalThis.fetch = vi.fn(async () =>
      ({ ok: true, status: 200, body: sseBody([noText]) }) as unknown as Response,
    ) as unknown as typeof fetch;

    const { out, err } = await collect(await streamGemini({ apiKey: "k", system: "s", user: "u" }));
    expect(out).toBe("");
    expect(err).toBeInstanceOf(Error);
    expect(err!.message).toMatch(/no answer text/i);
    expect(err!.message).toMatch(/MAX_TOKENS/);
  });
});

describe("streamGemini errors", () => {
  it("throws a clear message on a non-ok response", async () => {
    globalThis.fetch = vi.fn(async () =>
      ({ ok: false, status: 400, json: async () => ({ error: { message: "API key not valid" } }) }) as unknown as Response,
    ) as unknown as typeof fetch;

    await expect(streamGemini({ apiKey: "bad", system: "s", user: "u" })).rejects.toThrow(
      /Gemini call failed: API key not valid/,
    );
  });
});
