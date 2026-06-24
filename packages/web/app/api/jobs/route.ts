import { listJobs } from "@mw/core/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ jobs: listJobs() });
}
