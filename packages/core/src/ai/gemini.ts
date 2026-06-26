const BASE = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

export interface GeminiCallInput {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

interface GeminiStreamChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
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

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    signal,
  });

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

  return new ReadableStream<string>({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as GeminiStreamChunk;
              const text = parsed.candidates?.[0]?.content?.parts
                ?.map((p) => p.text ?? "")
                .join("");
              if (text) controller.enqueue(text);
            } catch {
              /* skip malformed event */
            }
          }
        }
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
  if (!key.startsWith("AIza")) {
    return { ok: false, error: "Key does not look like a Google API key (usually starts with AIza)." };
  }
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
