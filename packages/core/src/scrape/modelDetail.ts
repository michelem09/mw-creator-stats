import { BASE, sleep } from "./session";
import type { Fetcher } from "../ports";
import type { PointsData } from "../types";
import { parsePointsData } from "./points";

export interface ModelSummary {
  impression?: number | string;
  view?: number | string;
  download?: number | string;
  print?: number | string;
  collect?: number | string;
  like?: number | string;
  boost?: number | string;
  point?: number | string;
}

export interface ModelTrafficSource {
  recommend?: number | string;
  search?: number | string;
  browse?: number | string;
  directUrl?: number | string;
  others?: number | string;
}

export interface ModelDesignInfo {
  publishTime?: string;
}

export interface ModelDetail {
  summary: ModelSummary;
  trafficSource: ModelTrafficSource;
  designInfo: ModelDesignInfo;
  /** This model's daily points/boost series, parsed from `modelData.dateList`. */
  points: PointsData | null;
}

// The raw payload carries more than we type here (summary/trafficSource/designInfo);
// `dateList` sits alongside them and feeds parsePointsData.
interface RawModelData {
  summary?: ModelSummary;
  trafficSource?: ModelTrafficSource;
  designInfo?: ModelDesignInfo;
}

interface DetailShape {
  pageProps?: { modelData?: RawModelData };
}

export async function getModelDetail(
  fetcher: Fetcher,
  buildId: string,
  designId: number,
  start: string,
  end: string,
): Promise<ModelDetail> {
  const url =
    `${BASE}/_next/data/${buildId}/en/my/data-overview/model/${designId}.json` +
    `?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}` +
    `&designId=${designId}`;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetcher(url, {
        headers: { "x-nextjs-data": "1" },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as DetailShape;
      const md = j.pageProps?.modelData;
      if (!md) throw new Error("modelData missing from payload");
      return {
        summary: md.summary || {},
        trafficSource: md.trafficSource || {},
        designInfo: md.designInfo || {},
        points: parsePointsData(md),
      };
    } catch (e) {
      lastErr = e;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Unknown error fetching model detail");
}
