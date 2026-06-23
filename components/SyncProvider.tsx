"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { JobState, Snapshot } from "@/lib/types";

interface SyncContextValue {
  jobs: JobState[];
  activeJobs: JobState[];
  jobForRange: (start: string, end: string) => JobState | undefined;
  recentDoneSnapshotKey: string | null;
  acknowledgeRange: (start: string, end: string) => void;
}

const Ctx = createContext<SyncContextValue | null>(null);

function rangeKey(j: { range: { start: string; end: string } }) {
  return `${j.range.start}_${j.range.end}`;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobState[]>([]);
  const [recentDoneSnapshotKey, setRecentDoneSnapshotKey] = useState<string | null>(null);
  const acknowledgedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const es = new EventSource("/api/jobs/stream");
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as { jobs: JobState[] };
        setJobs(parsed.jobs);
        for (const j of parsed.jobs) {
          if (j.stage === "done" && j.snapshotKey && !acknowledgedRef.current.has(j.id)) {
            acknowledgedRef.current.add(j.id);
            setRecentDoneSnapshotKey(j.snapshotKey);
          }
        }
      } catch {
        /* ignore malformed event */
      }
    };
    es.onerror = () => {
      /* EventSource auto-reconnects */
    };
    return () => es.close();
  }, []);

  const activeJobs = useMemo(() => jobs.filter((j) => j.finishedAt == null), [jobs]);

  const jobForRange = useCallback(
    (start: string, end: string) =>
      jobs.find((j) => j.range.start === start && j.range.end === end && j.finishedAt == null),
    [jobs],
  );

  const acknowledgeRange = useCallback((start: string, end: string) => {
    setRecentDoneSnapshotKey((cur) => (cur === `${start}_${end}` ? null : cur));
  }, []);

  const value: SyncContextValue = useMemo(
    () => ({ jobs, activeJobs, jobForRange, recentDoneSnapshotKey, acknowledgeRange }),
    [jobs, activeJobs, jobForRange, recentDoneSnapshotKey, acknowledgeRange],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync(): SyncContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSync must be used inside SyncProvider");
  return v;
}

/** Helper: fetch a fresh snapshot by range, used by pages right after they hear "done". */
export async function fetchSnapshot(start: string, end: string): Promise<Snapshot | null> {
  const r = await fetch(`/api/snapshot?start=${start}&end=${end}`);
  if (!r.ok) return null;
  return (await r.json()) as Snapshot;
}
