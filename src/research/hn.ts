import type { RawComment, RawHnStory } from "../schemas/research.ts";
import { fetchJson, stripHtml, truncate, type Fetcher } from "./http.ts";

const BASE = "https://hn.algolia.com/api/v1";

export interface HnSearchHit {
  objectID: string;
  title: string;
  url?: string | null;
  points?: number | null;
  num_comments?: number | null;
  created_at: string;
}
export interface HnSearchResponse {
  hits: HnSearchHit[];
}
export interface HnItem {
  id: number;
  author?: string | null;
  text?: string | null;
  points?: number | null;
  children?: HnItem[];
}

export function hnStoryUrl(id: string) {
  return `https://news.ycombinator.com/item?id=${id}`;
}

export function parseHnSearch(res: HnSearchResponse): RawHnStory[] {
  return (res.hits ?? [])
    .filter((h) => h.title)
    .map((h) => ({
      objectID: String(h.objectID),
      title: h.title,
      url: h.url ?? undefined,
      hnUrl: hnStoryUrl(String(h.objectID)),
      points: h.points ?? 0,
      numComments: h.num_comments ?? 0,
      createdAt: h.created_at,
      comments: [],
    }));
}

/** Flatten a comment tree, top-scoring/first-level first, cap the count. */
export function flattenHnComments(item: HnItem, cap = 25, maxLen = 400): RawComment[] {
  const out: RawComment[] = [];
  const walk = (nodes: HnItem[] | undefined, depth: number) => {
    for (const n of nodes ?? []) {
      if (out.length >= cap) return;
      if (n.text) {
        out.push({
          author: n.author ?? undefined,
          text: truncate(stripHtml(n.text), maxLen),
          score: n.points ?? undefined,
        });
      }
      if (depth < 1) walk(n.children, depth + 1);
    }
  };
  walk(item.children, 0);
  return out.slice(0, cap);
}

export async function searchStories(
  query: string,
  opts: { hitsPerPage?: number; fetchImpl?: Fetcher } = {},
): Promise<RawHnStory[]> {
  const url = `${BASE}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${opts.hitsPerPage ?? 15}`;
  const res = await fetchJson<HnSearchResponse>(url, { fetchImpl: opts.fetchImpl });
  return parseHnSearch(res).sort((a, b) => b.points - a.points);
}

export async function getStoryComments(
  objectID: string,
  opts: { cap?: number; fetchImpl?: Fetcher } = {},
): Promise<RawComment[]> {
  const item = await fetchJson<HnItem>(`${BASE}/items/${objectID}`, { fetchImpl: opts.fetchImpl });
  return flattenHnComments(item, opts.cap ?? 25);
}
