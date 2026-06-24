import { BASE } from "./session";
import type { Fetcher } from "../ports";
import { extractNextData } from "./buildId";

export interface RawModel {
  designId: number;
  title: string;
}

interface ListShape {
  pageProps?: { statisticalList?: RawModel[] };
  props?: { pageProps?: { statisticalList?: RawModel[] } };
}

export async function getModelList(
  fetcher: Fetcher,
  buildId: string,
  start: string,
  end: string,
  fallbackHtml = "",
): Promise<RawModel[]> {
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
      if (lst.length) return lst;
    }
  } catch {
    /* fall through */
  }
  if (fallbackHtml) {
    const nd = extractNextData<ListShape>(fallbackHtml);
    const lst = nd?.props?.pageProps?.statisticalList || [];
    if (lst.length) return lst;
  }
  throw new Error(
    "Could not retrieve the model list (statisticalList empty from both endpoint and page). Cookie auth may have failed.",
  );
}
