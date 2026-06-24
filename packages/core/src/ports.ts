// Ports: the interfaces the core depends on. Concrete adapters (transport, storage,
// AI) are supplied by each target (web relay / browser fetch, IndexedDB, direct
// Anthropic call) and injected into the core. The core itself stays I/O-agnostic.

import type { Snapshot } from "./types";
import type { MetaCache } from "./metaCache";

/** Minimal Response-like wrapper so callers can use r.ok / r.status / r.json() / r.text()
 *  regardless of the underlying transport (got-scraping, server relay, browser fetch). */
export interface MwResponse {
  ok: boolean;
  status: number;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
}

export interface FetchInit {
  /** Extra request headers (Cookie/Referer/UA are owned by the adapter, not the core). */
  headers?: Record<string, string>;
  /** Accept header; defaults to application/json in adapters. */
  accept?: string;
}

/** Transport port: how the core reaches MakerWorld. The cookie/credentials are
 *  captured by the adapter (a closure), so the core never threads them around. */
export type Fetcher = (url: string, init?: FetchInit) => Promise<MwResponse>;

export interface StoredSnapshotMeta {
  start: string;
  end: string;
  size: number;
  mtime: number;
}

/** Storage port: where snapshots and the metadata cache live (filesystem / IndexedDB). */
export interface Store {
  readSnapshot(start: string, end: string): Promise<Snapshot | null>;
  writeSnapshot(snap: Snapshot): Promise<void>;
  listSnapshots(): Promise<StoredSnapshotMeta[]>;
  readMetaCache(): Promise<MetaCache>;
  flushMetaCache(cache: MetaCache): Promise<void>;
}

export interface AiCallInput {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
}

/** AI port: streams Anthropic completions as text chunks. */
export interface AiClient {
  stream(opts: AiCallInput): Promise<ReadableStream<string>>;
}
