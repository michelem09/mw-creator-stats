import { BASE } from "./session";
import type { Fetcher } from "../ports";
import type { PointsData } from "../types";
import { extractNextData } from "./buildId";
import { parsePointsData } from "./points";

export interface RawModel {
  designId: number;
  title: string;
}

export interface ModelListResult {
  list: RawModel[];
  /** Reward points/boost block from the same payload, or null if absent. */
  points: PointsData | null;
}

interface PageProps {
  statisticalList?: RawModel[];
  statisticalData?: unknown;
}

interface ListShape {
  pageProps?: PageProps;
  props?: { pageProps?: PageProps };
}

export async function getModelList(
  fetcher: Fetcher,
  buildId: string,
  start: string,
  end: string,
  fallbackHtml = "",
): Promise<ModelListResult> {
  const url =
    `${BASE}/_next/data/${buildId}/en/my/data-overview/model.json` +
    `?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
  try {
    const r = await fetcher(url, {
      headers: { "x-nextjs-data": "1" },
    });
    if (r.ok) {
      const j = (await r.json()) as ListShape;
      const lst = j.pageProps?.statisticalList || [];
      if (lst.length) {
        return { list: lst, points: parsePointsData(j.pageProps?.statisticalData) };
      }
    }
  } catch {
    /* fall through */
  }
  if (fallbackHtml) {
    const nd = extractNextData<ListShape>(fallbackHtml);
    const pp = nd?.props?.pageProps;
    const lst = pp?.statisticalList || [];
    if (lst.length) {
      return { list: lst, points: parsePointsData(pp?.statisticalData) };
    }
  }
  throw new Error(
    "Could not retrieve the model list (statisticalList empty from both endpoint and page). Cookie auth may have failed.",
  );
}
