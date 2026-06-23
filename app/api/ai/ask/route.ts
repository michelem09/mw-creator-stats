import { NextRequest } from "next/server";
import { streamAnthropic } from "@/lib/ai/anthropic";
import {
  buildFastDigest,
  buildFullPayload,
  buildModelFocusDigest,
} from "@/lib/ai/digest";
import type { AIAskRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function systemPrompt(
  rangeLabel: string,
  prevRangeLabel: string | null,
  hasFocusModel: boolean,
  modelTitle: string | null,
): string {
  const focusLine = hasFocusModel && modelTitle
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

function sseLine(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: AIAskRequest;
  try {
    body = (await req.json()) as AIAskRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = (body.apiKey || process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key provided" }, { status: 401 });
  }
  if (!body.question?.trim()) {
    return Response.json({ error: "Empty question" }, { status: 400 });
  }
  if (!body.snapshot) {
    return Response.json({ error: "Missing snapshot" }, { status: 400 });
  }

  const mode = body.mode === "precise" ? "precise" : "fast";
  const focusId = body.focusModelId ?? null;

  let payload: unknown;
  let modelTitle: string | null = null;

  if (focusId != null) {
    const focus = buildModelFocusDigest(body.snapshot, focusId, body.prevSnapshot);
    if (!focus) {
      return Response.json(
        { error: `Model #${focusId} not in current snapshot` },
        { status: 400 },
      );
    }
    modelTitle = focus.model.title;
    // Even in "precise" mode for a single model we send the focus digest — the model's
    // full record + catalogue reference is already small enough to be useful and precise.
    payload = focus;
  } else if (mode === "precise") {
    payload = buildFullPayload(body.snapshot, body.prevSnapshot);
  } else {
    payload = buildFastDigest(body.snapshot, body.prevSnapshot);
  }

  const rangeLabel = `${body.snapshot.meta.dateRange.start} → ${body.snapshot.meta.dateRange.end}`;
  const prevRangeLabel = body.prevSnapshot
    ? `${body.prevSnapshot.meta.dateRange.start} → ${body.prevSnapshot.meta.dateRange.end}`
    : null;

  const system = systemPrompt(rangeLabel, prevRangeLabel, focusId != null, modelTitle);
  const user = `${body.question.trim()}\n\n---\nDATA:\n${JSON.stringify(payload)}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const upstream = await streamAnthropic({
          apiKey,
          system,
          user,
          maxTokens: 1500,
        });
        const reader = upstream.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(sseLine({ type: "text", content: value })));
        }
        controller.enqueue(encoder.encode(sseLine({ type: "done" })));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(sseLine({ type: "error", message: msg })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
