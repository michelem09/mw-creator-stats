const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export const DEFAULT_MODEL = "claude-sonnet-4-6";

interface AnthropicDelta {
  type?: string;
  delta?: { type?: string; text?: string };
  message?: { stop_reason?: string };
}

export interface AnthropicCallInput {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
}

/** Calls Anthropic /v1/messages with stream:true and returns a ReadableStream<string>
 *  of text chunks (the text_delta payloads concatenated). The last chunk is followed
 *  by stream close; errors throw before the stream starts or surface as a thrown error
 *  on the underlying upstream socket. */
export async function streamAnthropic(opts: AnthropicCallInput): Promise<ReadableStream<string>> {
  const { apiKey, model = DEFAULT_MODEL, system, user, maxTokens = 1024 } = opts;

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    let detail = `HTTP ${upstream.status}`;
    try {
      const j = (await upstream.json()) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`Anthropic call failed: ${detail}`);
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
        // SSE events end with a blank line; split on \n\n.
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          // Each part may have "event: foo\ndata: {...}" — we only care about data lines.
          for (const line of part.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as AnthropicDelta;
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                const text = parsed.delta.text ?? "";
                if (text) controller.enqueue(text);
              }
              if (parsed.type === "message_stop") {
                controller.close();
                return;
              }
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
