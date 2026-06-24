import type { ModelMetadata } from "../types";
import { BASE, mwFetch } from "./session";

const ENDPOINT_TEMPLATES = [
  "{base}/api/v1/design-service/design/{id}",
  "{base}/api/v1/design-service/design/{id}/profile",
  "{base}/api/v1/design-service/models/{id}",
] as const;

const EMPTY: ModelMetadata = {
  category: "",
  tags: [],
  publishTime: "",
  createTime: "",
  license: "",
  instanceCount: 0,
};

type Obj = Record<string, unknown>;

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

/** Some MW responses are flat top-level, others nest the payload under data/design/model/result.
 *  Probe the wrappers and return the first object that looks like the design payload. */
function unwrap(input: unknown): Obj {
  if (!input || typeof input !== "object") return {};
  const o = input as Obj;
  // If top-level already has category/tags/instances/license fields, use as-is.
  if (
    "categories" in o || "tags" in o || "license" in o ||
    "instances" in o || "categoryName" in o
  ) {
    return o;
  }
  for (const k of ["data", "design", "model", "result"] as const) {
    const v = o[k];
    if (v && typeof v === "object") return v as Obj;
  }
  return o;
}

function pickCategory(o: Obj): string {
  // Real MW shape (2026-06): categories: [{id, name, slug, ...}]
  const cats = o.categories;
  if (Array.isArray(cats) && cats.length) {
    const first = cats[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const r = first as Obj;
      const n = asString(r.name || r.title);
      if (n) return n;
    }
  }
  // Other shapes seen historically.
  for (const k of ["categoryName", "categoryTitle"] as const) {
    const s = asString(o[k]);
    if (s) return s;
  }
  for (const k of ["primaryCategory", "category", "classify", "categoryV2", "parentCategory"] as const) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
    if (v && typeof v === "object") {
      const n = asString((v as Obj).name || (v as Obj).title);
      if (n) return n;
    }
  }
  const cl = o.categoryList;
  if (Array.isArray(cl) && cl.length) {
    const first = cl[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return asString((first as Obj).name);
  }
  return "";
}

function pickTags(o: Obj): string[] {
  const sources: unknown[] = [];
  for (const k of ["tags", "tagsTranslated", "designTags", "tagList", "keywords"] as const) {
    const v = o[k];
    if (Array.isArray(v)) sources.push(...v);
  }
  const out: string[] = [];
  for (const t of sources) {
    if (typeof t === "string") {
      const s = t.trim();
      if (s) out.push(s);
    } else if (t && typeof t === "object") {
      const r = t as Obj;
      const s = asString(r.name || r.tag || r.title || r.label).trim();
      if (s) out.push(s);
    }
  }
  // De-duplicate (preserve order)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of out) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(t);
  }
  return unique.slice(0, 30);
}

function pickPublish(o: Obj): string {
  for (const k of ["publishTime", "publishedAt", "publicTime", "firstPublishTime", "publishAt"] as const) {
    const s = asString(o[k]);
    if (s) return s;
  }
  // MW currently has no publishTime field; createTime is the de-facto publication date.
  return asString(o.createTime || o.createdAt || o.createDate);
}

function pickCreate(o: Obj): string {
  return asString(o.createTime || o.createdAt || o.createDate);
}

function pickLicense(o: Obj): string {
  const v = o.license;
  if (typeof v === "string" && v) return v;
  if (v && typeof v === "object") {
    const s = asString((v as Obj).name || (v as Obj).type);
    if (s) return s;
  }
  return asString(o.licenseName || o.licenseType);
}

function pickInstances(o: Obj): number {
  const arr = o.instances;
  if (Array.isArray(arr)) return arr.length;
  const v = o.instanceCount ?? o.instanceNum ?? o.modelInstanceCount ?? o.fileCount;
  const n = typeof v === "number" ? v : parseInt(asString(v), 10);
  return Number.isFinite(n) ? n : 0;
}

function pickCover(o: Obj): string {
  return asString(o.coverUrl || o.cover || o.image);
}

export function extractMetadata(input: unknown): ModelMetadata {
  const o = unwrap(input);
  return {
    category: pickCategory(o),
    tags: pickTags(o),
    publishTime: pickPublish(o),
    createTime: pickCreate(o),
    license: pickLicense(o),
    instanceCount: pickInstances(o),
    cover: pickCover(o) || undefined,
  };
}

export async function fetchModelMetadata(
  cookie: string,
  designId: number,
  preferredTemplate: { value: string },
): Promise<ModelMetadata> {
  const order = preferredTemplate.value
    ? [
        preferredTemplate.value,
        ...ENDPOINT_TEMPLATES.filter((t) => t !== preferredTemplate.value),
      ]
    : [...ENDPOINT_TEMPLATES];

  let lastErr = "";
  for (const tpl of order) {
    const url = tpl.replace("{base}", BASE).replace("{id}", String(designId));
    try {
      const r = await mwFetch(url, cookie);
      if (!r.ok) {
        lastErr = `HTTP ${r.status}`;
        continue;
      }
      const j = await r.json<unknown>();
      const meta = extractMetadata(j);
      // Consider the response valid if it yields category or tags. Otherwise try the next template.
      if (meta.category || meta.tags.length) {
        preferredTemplate.value = tpl;
        return meta;
      }
      lastErr = "no category/tags in payload";
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return { ...EMPTY, _error: lastErr || "all endpoints failed" };
}
