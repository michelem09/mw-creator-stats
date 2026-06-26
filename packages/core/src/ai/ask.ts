import { streamAnthropic } from "./anthropic";
import { streamGemini, testGeminiKey } from "./gemini";
import {
  buildFastDigest,
  buildFullPayload,
  buildModelFocusDigest,
} from "./digest";
import { providerMeta } from "./providers";
import type { AIAskRequest, AIProviderId } from "../types";

const TEST_MODEL = "claude-haiku-4-5-20251001";

function systemPrompt(
  rangeLabel: string,
  prevRangeLabel: string | null,
  hasFocusModel: boolean,
  modelTitle: string | null,
): string {
  const focusLine =
    hasFocusModel && modelTitle
      ? `The user is currently looking at the model "${modelTitle}" — center the answer on that model.`
      : "";

  return [
    "You are an analyst helping a 3D-print model creator on MakerWorld understand their Creator Center stats.",
    "The user will ask ONE question. You have one shot — no memory of past turns.",
    "Cite specific numbers from the JSON below. Be concise. Use markdown lists for multi-point answers.",
    "Suggest concrete actions when possible.",
    `The data covers the period ${rangeLabel}${prevRangeLabel ? ` compared with ${prevRangeLabel}` : ""}.`,
    focusLine,
    "",
    "DATA:",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Build the digest + prompt and stream Claude's answer as text chunks. Runs directly
 *  from the browser in both targets (the key stays in localStorage). Throws on bad input. */
export async function askInsights(
  req: AIAskRequest,
  signal?: AbortSignal,
): Promise<ReadableStream<string>> {
  const provider: AIProviderId = req.provider === "gemini" ? "gemini" : "anthropic";
  const apiKey = (req.apiKey || "").trim();
  if (!apiKey) throw new Error(`No ${providerMeta(provider).shortLabel} API key provided`);
  if (!req.question?.trim()) throw new Error("Empty question");
  if (!req.snapshot) throw new Error("Missing snapshot");

  const mode = req.mode === "precise" ? "precise" : "fast";
  const focusId = req.focusModelId ?? null;

  let payload: unknown;
  let modelTitle: string | null = null;

  if (focusId != null) {
    const focus = buildModelFocusDigest(req.snapshot, focusId, req.prevSnapshot);
    if (!focus) throw new Error(`Model #${focusId} not in current snapshot`);
    modelTitle = focus.model.title;
    payload = focus;
  } else if (mode === "precise") {
    payload = buildFullPayload(req.snapshot, req.prevSnapshot);
  } else {
    payload = buildFastDigest(req.snapshot, req.prevSnapshot);
  }

  const rangeLabel = `${req.snapshot.meta.dateRange.start} → ${req.snapshot.meta.dateRange.end}`;
  const prevRangeLabel = req.prevSnapshot
    ? `${req.prevSnapshot.meta.dateRange.start} → ${req.prevSnapshot.meta.dateRange.end}`
    : null;

  const system = systemPrompt(rangeLabel, prevRangeLabel, focusId != null, modelTitle);
  const user = `${req.question.trim()}\n\n---\nDATA:\n${JSON.stringify(payload)}`;

  if (provider === "gemini") {
    return streamGemini({ apiKey, system, user, maxTokens: 1500, signal });
  }
  return streamAnthropic({ apiKey, system, user, maxTokens: 1500, signal });
}

/** Validate a key for the given provider. */
export function testKey(
  provider: AIProviderId,
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  return provider === "gemini" ? testGeminiKey(apiKey) : testAnthropicKey(apiKey);
}

/** Validate an Anthropic key with a tiny direct call. */
export async function testAnthropicKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const key = (apiKey || "").trim();
  if (!key) return { ok: false, error: "No API key provided" };
  if (!key.startsWith("sk-ant-")) {
    return { ok: false, error: "Key does not look like an Anthropic key (must start with sk-ant-)." };
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: TEST_MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
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
