import { describe, it, expect } from "vitest";
import { runScrape } from "./run";
import { LIST_PAGE } from "./session";
import type { Fetcher, MwResponse, Store } from "../ports";
import type { Snapshot } from "../types";
import type { MetaCache } from "../metaCache";

const BUILD_ID = "testbuild";

// Creator-level points block returned alongside the model list.
const LIST_STAT_DATA = {
  summary: { pointRegular: 42, pointExclusive: 100.5, boostRegular: 1, boostExclusive: 5 },
  dateList: [
    { intervalVal: "2026/05/29", pointFromModelRegular: 10, pointFromModelExclusive: 50, pointFromInstRegular: 5, pointFromInstExclusive: 25, boostRegular: 0, boostExclusive: 1 },
    { intervalVal: "2026/05/30", pointFromModelRegular: 0, pointFromModelExclusive: 20, pointFromInstRegular: 2, pointFromInstExclusive: 10, boostRegular: 1, boostExclusive: 2 },
  ],
};

const MODELS = [
  { designId: 100, title: "Alpha Box" },
  { designId: 200, title: "Beta Planter" },
];

const DETAIL: Record<number, unknown> = {
  100: {
    summary: { impression: 1000, view: 200, download: 50, print: 10, collect: 5, like: 8, point: 120, boost: 3 },
    trafficSource: { recommend: 40, search: 30, browse: 10, directUrl: 15, others: 5 },
    designInfo: { publishTime: "2026-01-01T00:00:00Z" },
    dateList: [
      { intervalVal: "2026/05/29", pointFromModelRegular: 0, pointFromModelExclusive: 60, pointFromInstRegular: 0, pointFromInstExclusive: 40, boostRegular: 0, boostExclusive: 1 },
    ],
  },
  200: {
    summary: { impression: 500, view: 80, download: 12, print: 1, collect: 2, like: 3, point: 30, boost: 0 },
    trafficSource: { recommend: 10, search: 60, browse: 5, directUrl: 20, others: 5 },
    designInfo: { publishTime: "2026-02-01T00:00:00Z" },
    dateList: [],
  },
};

const META: Record<number, unknown> = {
  100: { categories: [{ name: "Gadgets" }], tags: ["useful", "edc"], createTime: "2026-01-01", instances: [{}, {}], license: "CC BY" },
  200: { categories: [{ name: "Home" }], tags: ["planter"], createTime: "2026-02-01", instances: [{}], license: "CC BY-NC" },
};

function jsonResponse(url: string, data: unknown): MwResponse {
  return {
    ok: true,
    status: 200,
    url,
    headers: {},
    text: async () => JSON.stringify(data),
    json: async <T = unknown>() => data as T,
  };
}

const fetcher: Fetcher = async (url) => {
  if (url === LIST_PAGE) {
    const html = `<script id="__NEXT_DATA__" type="application/json">{"buildId":"${BUILD_ID}"}</script>`;
    return { ok: true, status: 200, url, headers: {}, text: async () => html, json: async <T = unknown>() => ({}) as T };
  }
  const detail = url.match(/data-overview\/model\/(\d+)\.json/);
  if (detail) {
    return jsonResponse(url, { pageProps: { modelData: DETAIL[Number(detail[1])] } });
  }
  if (url.includes("data-overview/model.json")) {
    return jsonResponse(url, { pageProps: { statisticalList: MODELS, statisticalData: LIST_STAT_DATA } });
  }
  const design = url.match(/\/design-service\/design\/(\d+)(?:$|\?)/);
  if (design) {
    return jsonResponse(url, META[Number(design[1])]);
  }
  // Other metadata templates (/profile, /models) — force a miss so the base one wins.
  return { ok: false, status: 404, url, headers: {}, text: async () => "", json: async <T = unknown>() => ({}) as T };
};

function memStore(): { store: Store; written: Snapshot[] } {
  const written: Snapshot[] = [];
  let cache: MetaCache = {};
  return {
    written,
    store: {
      readSnapshot: async () => null,
      writeSnapshot: async (s) => void written.push(s),
      listSnapshots: async () => [],
      readMetaCache: async () => cache,
      flushMetaCache: async (c) => void (cache = c),
    },
  };
}

async function drain(gen: AsyncGenerator<unknown, Snapshot, void>) {
  const stages: string[] = [];
  let r = await gen.next();
  while (!r.done) {
    const evt = r.value as { stage?: string };
    if (evt.stage) stages.push(evt.stage);
    r = await gen.next();
  }
  return { snapshot: r.value, stages };
}

describe("runScrape (integration)", () => {
  it("turns fake MakerWorld responses into a complete snapshot", async () => {
    const { store } = memStore();
    const { snapshot, stages } = await drain(
      runScrape(fetcher, store, { start: "2026-05-01", end: "2026-05-31", delayMs: 0 }),
    );

    // Progress reaches completion.
    expect(stages).toContain("buildId");
    expect(stages).toContain("list");
    expect(stages.at(-1)).toBe("done");

    // Meta.
    expect(snapshot.meta).toMatchObject({
      buildId: BUILD_ID,
      modelCount: 2,
      errors: 0,
      dateRange: { start: "2026-05-01", end: "2026-05-31" },
    });

    // Per-model stats, metadata and traffic source.
    const alpha = snapshot.models.find((m) => m.id === 100)!;
    expect(alpha).toMatchObject({
      title: "Alpha Box",
      impr: 1000,
      view: 200,
      dl: 50,
      point: 120,
      boost: 3,
      category: "Gadgets",
      license: "CC BY",
      instances: 2,
    });
    expect(alpha.tags).toEqual(["useful", "edc"]);
    expect(alpha.ts).toEqual([40, 30, 10, 15, 5]);

    // Per-model daily points come from the model's own detail dateList (60 + 40 exclusive).
    expect(alpha.points?.daily[0]).toMatchObject({ date: "2026-05-29", pointExclusive: 100, boostExclusive: 1 });

    // Creator-level points block parsed from the list payload.
    expect(snapshot.points?.summary).toEqual({ pointRegular: 42, pointExclusive: 100.5, boostRegular: 1, boostExclusive: 5 });
    expect(snapshot.points?.daily).toHaveLength(2);
    expect(snapshot.points?.daily[0]).toMatchObject({ date: "2026-05-29", pointExclusive: 75 }); // 50 + 25
  });

  it("counts a model as an error when its detail fetch fails, without aborting the run", async () => {
    const failingFetcher: Fetcher = async (url) => {
      if (/data-overview\/model\/200\.json/.test(url)) {
        return { ok: false, status: 500, url, headers: {}, text: async () => "", json: async <T = unknown>() => ({}) as T };
      }
      return fetcher(url);
    };
    const { store } = memStore();
    const { snapshot } = await drain(
      runScrape(failingFetcher, store, { start: "2026-05-01", end: "2026-05-31", delayMs: 0 }),
    );
    expect(snapshot.models.map((m) => m.id)).toEqual([100]);
    expect(snapshot.meta.errors).toBe(1);
    expect(snapshot.meta.modelCount).toBe(1);
  });
});
