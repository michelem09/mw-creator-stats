"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { JobState } from "@mw/core/types";
import type { Fetcher } from "@mw/core/ports";
import { runScrape } from "@mw/core/scrape/run";
import { idbStore } from "@mw/core/adapters/store-idb";
import { AuthError } from "@mw/core/scrape/session";

interface Range {
  start: string;
  end: string;
}

interface SyncContextValue {
  jobs: JobState[];
  activeJobs: JobState[];
  jobForRange: (start: string, end: string) => JobState | undefined;
  recentDoneSnapshotKey: string | null;
  acknowledgeRange: (start: string, end: string) => void;
  /** Run a sync entirely in this tab. Rejects (with a "[auth] "-prefixed message on
   *  auth failure) so callers can surface a dialog. */
  startSync: (range: Range, cookie: string) => Promise<void>;
}

const Ctx = createContext<SyncContextValue | null>(null);

function rangeKey(r: Range) {
  return `${r.start}_${r.end}`;
}

function newJob(range: Range): JobState {
  return {
    id: crypto.randomUUID(),
    range: { ...range },
    stage: "pending",
    current: 0,
    total: 0,
    title: "",
    message: "Queued",
    startedAt: Date.now(),
    finishedAt: null,
    error: null,
    snapshotKey: null,
    cachedMetaCount: 0,
    fetchedMetaCount: 0,
  };
}

export function SyncProvider({
  children,
  makeFetcher,
}: {
  children: React.ReactNode;
  /** Target-specific transport: web supplies a relay fetcher, the extension a direct one. */
  makeFetcher: (cookie: string) => Fetcher;
}) {
  const [jobs, setJobs] = useState<JobState[]>([]);
  const [recentDoneSnapshotKey, setRecentDoneSnapshotKey] = useState<string | null>(null);
  const acknowledgedRef = useRef<Set<string>>(new Set());

  const patchJob = useCallback((id: string, patch: Partial<JobState>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const startSync = useCallback(
    async (range: Range, cookie: string): Promise<void> => {
      const key = rangeKey(range);
      // De-dupe: ignore if a sync for this range is already running.
      const active = jobs.find((j) => rangeKey(j.range) === key && j.finishedAt == null);
      if (active) return;

      const job = newJob(range);
      setJobs((prev) => [job, ...prev].slice(0, 12));

      try {
        const gen = runScrape(makeFetcher(cookie), idbStore, {
          start: range.start,
          end: range.end,
        });
        for await (const evt of gen) {
          const patch: Partial<JobState> = {};
          if (evt.stage) patch.stage = evt.stage;
          if (typeof evt.current === "number") patch.current = evt.current;
          if (typeof evt.total === "number") patch.total = evt.total;
          if (typeof evt.title === "string") patch.title = evt.title;
          if (typeof evt.message === "string") patch.message = evt.message;
          if (typeof evt.cachedMetaCount === "number") patch.cachedMetaCount = evt.cachedMetaCount;
          if (typeof evt.fetchedMetaCount === "number") patch.fetchedMetaCount = evt.fetchedMetaCount;

          if (evt.stage === "done" && evt.snapshot) {
            patchJob(job.id, { stage: "writing", message: "Writing snapshot" });
            await idbStore.writeSnapshot(evt.snapshot);
            patch.stage = "done";
            patch.message = "Done";
            patch.snapshotKey = key;
          }
          patchJob(job.id, patch);
        }

        if (!acknowledgedRef.current.has(job.id)) {
          acknowledgedRef.current.add(job.id);
          setRecentDoneSnapshotKey(key);
        }
        patchJob(job.id, { finishedAt: Date.now() });
      } catch (e) {
        const isAuth = e instanceof AuthError;
        const msg = e instanceof Error ? e.message : String(e);
        patchJob(job.id, {
          stage: "error",
          error: msg,
          message: msg,
          finishedAt: Date.now(),
        });
        throw new Error(`${isAuth ? "[auth] " : ""}${msg} (${range.start}→${range.end})`);
      }
    },
    [jobs, makeFetcher, patchJob],
  );

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
    () => ({
      jobs,
      activeJobs,
      jobForRange,
      recentDoneSnapshotKey,
      acknowledgeRange,
      startSync,
    }),
    [jobs, activeJobs, jobForRange, recentDoneSnapshotKey, acknowledgeRange, startSync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync(): SyncContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSync must be used inside SyncProvider");
  return v;
}

/** Read a snapshot from the browser store (used by pages right after they hear "done"). */
export async function fetchSnapshot(start: string, end: string) {
  return idbStore.readSnapshot(start, end);
}
