import { randomUUID } from "node:crypto";
import { runScrape, type RunOptions } from "./scrape/run";
import { writeSnapshot } from "./storage";
import type { JobState } from "./types";
import type { Fetcher } from "./ports";

const HISTORY_TTL_MS = 10 * 60_000;

type Listener = (jobs: JobState[]) => void;

// Persist the registry on globalThis to survive Next.js dev HMR and route-handler module isolation.
interface Globals {
  __mwJobsRegistry?: Map<string, JobState>;
  __mwJobsListeners?: Set<Listener>;
}
const G = globalThis as unknown as Globals;
const REGISTRY: Map<string, JobState> = (G.__mwJobsRegistry ??= new Map());
const LISTENERS: Set<Listener> = (G.__mwJobsListeners ??= new Set());

function notify() {
  const list = listJobs();
  for (const l of LISTENERS) {
    try {
      l(list);
    } catch {
      /* ignore listener crashes */
    }
  }
}

function rangeKey(r: { start: string; end: string }) {
  return `${r.start}_${r.end}`;
}

function isActive(j: JobState) {
  return j.finishedAt == null;
}

function purgeStale() {
  const now = Date.now();
  for (const [id, j] of REGISTRY) {
    if (j.finishedAt != null && now - j.finishedAt > HISTORY_TTL_MS) {
      REGISTRY.delete(id);
    }
  }
}

export function listJobs(): JobState[] {
  return [...REGISTRY.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function getJob(id: string): JobState | null {
  return REGISTRY.get(id) ?? null;
}

export function subscribe(l: Listener): () => void {
  LISTENERS.add(l);
  // Push current state immediately.
  try {
    l(listJobs());
  } catch {
    /* ignore */
  }
  return () => LISTENERS.delete(l);
}

export interface StartJobInput {
  range: { start: string; end: string };
  fetcher: Fetcher;
  options?: Partial<Pick<RunOptions, "delayMs" | "skipMetadata" | "concurrency">>;
}

export function startJob(input: StartJobInput): JobState {
  purgeStale();

  const key = rangeKey(input.range);
  for (const j of REGISTRY.values()) {
    if (isActive(j) && rangeKey(j.range) === key) return j;
  }

  const state: JobState = {
    id: randomUUID(),
    range: { ...input.range },
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
  REGISTRY.set(state.id, state);
  notify();

  void runJob(state, input);
  return state;
}

async function runJob(state: JobState, input: StartJobInput): Promise<void> {
  try {
    const gen = runScrape(input.fetcher, {
      start: input.range.start,
      end: input.range.end,
      delayMs: input.options?.delayMs,
      concurrency: input.options?.concurrency,
      skipMetadata: input.options?.skipMetadata ?? false,
    });

    for await (const evt of gen) {
      if (evt.stage) state.stage = evt.stage;
      if (typeof evt.current === "number") state.current = evt.current;
      if (typeof evt.total === "number") state.total = evt.total;
      if (typeof evt.title === "string") state.title = evt.title;
      if (typeof evt.message === "string") state.message = evt.message;
      if (typeof evt.cachedMetaCount === "number") state.cachedMetaCount = evt.cachedMetaCount;
      if (typeof evt.fetchedMetaCount === "number") state.fetchedMetaCount = evt.fetchedMetaCount;

      if (evt.stage === "done" && evt.snapshot) {
        state.stage = "writing";
        state.message = "Writing snapshot";
        notify();
        try {
          await writeSnapshot(evt.snapshot);
          state.snapshotKey = rangeKey(input.range);
        } catch (e) {
          state.error = `Snapshot write failed: ${e instanceof Error ? e.message : String(e)}`;
        }
        state.stage = state.error ? "error" : "done";
        state.message = state.error ?? "Done";
      }
      notify();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    state.stage = "error";
    state.error = msg;
    state.message = msg;
    notify();
  } finally {
    state.finishedAt = Date.now();
    notify();
  }
}
