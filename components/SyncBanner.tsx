"use client";
import { useEffect, useState } from "react";
import { useSync } from "./SyncProvider";
import type { JobState } from "@/lib/types";

const STAGE_LABEL: Record<JobState["stage"], string> = {
  pending: "Queued",
  buildId: "Resolving session",
  list: "Fetching model list",
  stats: "Stats",
  metadata: "Metadata",
  writing: "Writing snapshot",
  done: "Done",
  error: "Error",
};

export function SyncBanner() {
  const { activeJobs, jobs } = useSync();
  const [keepFinished, setKeepFinished] = useState<JobState[]>([]);

  // When all active jobs disappear, briefly retain the most recent finished ones so
  // the user sees the final "done" state for ~3.5s before the banner collapses.
  useEffect(() => {
    if (activeJobs.length > 0) {
      setKeepFinished([]);
      return;
    }
    const recentlyFinished = jobs
      .filter((j) => j.finishedAt != null && Date.now() - j.finishedAt < 4_000)
      .slice(0, 3);
    if (recentlyFinished.length === 0) return;
    setKeepFinished(recentlyFinished);
    const t = setTimeout(() => setKeepFinished([]), 3500);
    return () => clearTimeout(t);
  }, [activeJobs.length, jobs]);

  const showJobs = activeJobs.length > 0 ? activeJobs : keepFinished;
  if (showJobs.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-line bg-panel2/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2">
        {showJobs.map((j) => (
          <JobRow key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}

function JobRow({ job }: { job: JobState }) {
  const isError = job.stage === "error";
  const isDone = job.stage === "done";
  const fraction =
    job.total > 0 ? Math.min(job.current / job.total, 1) : isDone ? 1 : 0;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          isError ? "bg-red" : isDone ? "bg-teal" : "animate-pulse bg-amber"
        }`}
      />
      <span className="font-mono text-ink2">
        {job.range.start} → {job.range.end}
      </span>
      <span
        className={`font-semibold ${isError ? "text-red" : isDone ? "text-teal" : "text-amber"}`}
      >
        {STAGE_LABEL[job.stage]}
      </span>
      {job.total > 0 && (
        <span className="font-mono text-ink2">
          {job.current}/{job.total}
        </span>
      )}
      {job.title && !isDone && !isError && (
        <span className="hidden truncate text-ink3 sm:inline">
          · {job.title.slice(0, 48)}
        </span>
      )}
      {(job.cachedMetaCount > 0 || job.fetchedMetaCount > 0) && (
        <span className="ml-2 hidden font-mono text-[10px] text-ink3 md:inline">
          meta cached {job.cachedMetaCount} · fetched {job.fetchedMetaCount}
        </span>
      )}
      <div className="ml-auto h-1 w-32 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full transition-all ${
            isError ? "bg-red" : isDone ? "bg-teal" : "bg-amber"
          }`}
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
    </div>
  );
}
