import { listJobs, subscribe } from "@mw/core/jobs";
import type { JobState } from "@mw/core/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sse(jobs: JobState[]): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ jobs })}\n\n`);
}

export async function GET() {
  let unsubscribe: (() => void) | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot.
      controller.enqueue(sse(listJobs()));
      unsubscribe = subscribe((jobs) => {
        try {
          controller.enqueue(sse(jobs));
        } catch {
          /* connection closed mid-write */
        }
      });
      // Keep-alive comment every 15s so proxies don't close the stream during idle.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* ignore */
        }
      }, 15_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
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
