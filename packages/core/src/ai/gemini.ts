const BASE = "https://generativelanguage.googleapis.com/v1beta";

// Model choice is fiddly with the Gemini API:
//  - Pinned versions get retired for new keys (e.g. gemini-2.5-flash → 404
//    "no longer available to new users"), silently breaking new users.
//  - The newer "thinking" Flash models (gemini-flash-latest and the 3.x flashes)
//    can hang for 20s+ or return no text at all for a simple prompt.
// The lite "-latest" alias is broadly available, non-"thinking", fast (~4s first
// token) and returns text reliably — the best fit for this snappy one-shot Q&A.
// (It is NOT a thinking model, so it must NOT be sent a `thinkingConfig`.)
export const GEMINI_DEFAULT_MODEL = "gemini-flash-lite-latest";

export interface GeminiCallInput {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/** Calls Gemini :streamGenerateContent (alt=sse) and returns a ReadableStream<string>
 *  of text chunks. The key goes in the query string (no custom header) to keep the
 *  preflight CORS-simple, so this runs directly from a browser. */
export async function streamGemini(opts: GeminiCallInput): Promise<ReadableStream<string>> {
  const { apiKey, model = GEMINI_DEFAULT_MODEL, system, user, maxTokens = 1500, signal } = opts;

  const url =
    `${BASE}/models/${encodeURIComponent(model)}:streamGenerateContent` +
    `?alt=sse&key=${encodeURIComponent(apiKey)}`;

  // Guard against a model that never responds: abort if the server hasn't returned
  // headers within a generous window, so the UI surfaces an error instead of
  // spinning on "thinking…" forever. Also forward the caller's abort (drawer close).
  const ac = new AbortController();
  if (signal) {
    if (signal.aborted) ac.abort();
    else signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  const timer = setTimeout(() => ac.abort(), 20_000);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (signal?.aborted) throw e; // caller cancelled (e.g. drawer closed)
    throw new Error(
      "Gemini request timed out with no response. Please try again, or switch to Precise mode.",
    );
  }
  clearTimeout(timer);

  if (!upstream.ok || !upstream.body) {
    let detail = `HTTP ${upstream.status}`;
    try {
      const j = (await upstream.json()) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`Gemini call failed: ${detail}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  // Track whether we produced any answer text and why the model stopped, so we can
  // surface a clear error instead of hanging when Gemini returns no text at all
  // (e.g. finishReason MAX_TOKENS / SAFETY, or a blocked prompt).
  let emittedText = false;
  let stopReason = "";

  // Gemini's SSE uses CRLF line endings, so events are separated by \r\n\r\n and
  // lines by \r\n. Be tolerant of both, and flush any trailing event when the
  // stream ends without a final blank line.
  const emitEvent = (controller: ReadableStreamDefaultController<string>, event: string) => {
    for (const line of event.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as GeminiStreamChunk;
        const cand = parsed.candidates?.[0];
        const text = cand?.content?.parts?.map((p) => p.text ?? "").join("");
        if (text) {
          emittedText = true;
          controller.enqueue(text);
        }
        if (cand?.finishReason && cand.finishReason !== "STOP") stopReason = cand.finishReason;
        if (parsed.promptFeedback?.blockReason) stopReason = `blocked: ${parsed.promptFeedback.blockReason}`;
      } catch {
        /* skip malformed event */
      }
    }
  };

  return new ReadableStream<string>({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer.trim()) emitEvent(controller, buffer);
          if (!emittedText) {
            controller.error(
              new Error(
                `Gemini returned no answer text${stopReason ? ` (reason: ${stopReason})` : ""}. ` +
                  `Please try again, or switch to Precise mode.`,
              ),
            );
            return;
          }
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? "";
        for (const part of parts) emitEvent(controller, part);
      }
    },
    async cancel() {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    },
  });
}

/** Validate a Gemini key with a cheap GET (no preflight, no token cost). */
export async function testGeminiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const key = (apiKey || "").trim();
  if (!key) return { ok: false, error: "No API key provided" };
  // No prefix check: Google AI Studio keys come in multiple formats (AIza…, AQ.…),
  // so let the API be the source of truth.
  try {
    const r = await fetch(`${BASE}/models?key=${encodeURIComponent(key)}`);
    if (r.ok) return { ok: true };
    let errMsg = `HTTP ${r.status}`;
    try {
      const j = (await r.json()) as { error?: { message?: string } };
      if (j.error?.message) errMsg = j.error.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: errMsg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
