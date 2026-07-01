export type TrafficSource = [number, number, number, number, number];

export const TRAFFIC_SOURCE_LABELS = [
  "Recommend",
  "Search",
  "Browse",
  "Direct",
  "Other",
] as const;

export interface ModelStat {
  id: number;
  cat: string;
  category: string;
  tags: string[];
  title: string;
  impr: number;
  view: number;
  dl: number;
  print: number;
  collect: number;
  like: number;
  boost: number;
  point: number;
  ts: TrafficSource;
  pub: string;
  license: string;
  instances: number;
  ageDays: number | null;
  viewPerDay: number | null;
  dlPerDay: number | null;
  cover?: string;
  /** This model's daily points/boost series. Optional: absent on pre-feature snapshots. */
  points?: PointsData;
}

export interface SnapshotMeta {
  dateRange: { start: string; end: string };
  collectedAt: string;
  buildId: string;
  modelCount: number;
  errors: number;
  metaErrors: number;
  hasMetadata: boolean;
}

/** Reward points/boost split by model status (regular vs MakerWorld-exclusive),
 *  taken straight from MakerWorld's data-overview `statisticalData.summary`.
 *  `boost*` are raw boost counts (not yet converted to points). */
export interface PointsSummary {
  pointRegular: number;
  pointExclusive: number;
  boostRegular: number;
  boostExclusive: number;
}

/** One day of the reward time-series (`statisticalData.dateList`). Points already
 *  combine the model-download and print-instance components; boosts are raw counts. */
export interface PointsDailyEntry {
  date: string; // YYYY-MM-DD
  pointRegular: number;
  pointExclusive: number;
  boostRegular: number;
  boostExclusive: number;
}

export interface PointsData {
  summary: PointsSummary;
  daily: PointsDailyEntry[];
}

export interface Snapshot {
  meta: SnapshotMeta;
  models: ModelStat[];
  /** Reward points/boost breakdown + daily series. Optional: snapshots taken before
   *  this feature shipped won't have it (re-sync to populate). */
  points?: PointsData;
}

export interface ModelMetadata {
  category: string;
  tags: string[];
  publishTime: string;
  createTime: string;
  license: string;
  instanceCount: number;
  cover?: string;
  _error?: string;
}

export type SyncStage =
  | "pending"
  | "buildId"
  | "list"
  | "stats"
  | "metadata"
  | "writing"
  | "done"
  | "error";

export interface SyncProgress {
  stage: SyncStage;
  current?: number;
  total?: number;
  title?: string;
  message?: string;
  cachedMetaCount?: number;
  fetchedMetaCount?: number;
  snapshot?: Snapshot;
}

export interface CachedMeta extends ModelMetadata {
  fetchedAt: string;
}

export type CompareMode = "none" | "prevPeriod" | "prevYear" | "custom";

export interface CompareConfig {
  mode: CompareMode;
  // Populated when mode !== "none". For "custom" it is the user-edited range;
  // for "prevPeriod"/"prevYear" it is derived from the main range.
  range: { start: string; end: string } | null;
}

// ---------- AI Insights ----------

export type AIMode = "fast" | "precise";

/** Which LLM backend answers the Insights questions. */
export type AIProviderId = "anthropic" | "gemini";

export interface AIAskRequest {
  provider: AIProviderId;
  apiKey: string;
  mode: AIMode;
  question: string;
  snapshot: Snapshot;
  prevSnapshot?: Snapshot | null;
  /** When set, the question is about a single model — narrows the digest accordingly. */
  focusModelId?: number | null;
}

export interface AIChatEntry {
  id: string;
  question: string;
  answer: string;
  mode: AIMode;
  provider?: AIProviderId;
  askedAt: number;
  finishedAt: number | null;
  error: string | null;
}

export interface JobState {
  id: string;
  range: { start: string; end: string };
  stage: SyncStage;
  current: number;
  total: number;
  title: string;
  message: string;
  startedAt: number;
  finishedAt: number | null;
  error: string | null;
  snapshotKey: string | null;
  cachedMetaCount: number;
  fetchedMetaCount: number;
}
