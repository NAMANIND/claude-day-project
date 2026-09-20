import type { RawComment, RawRedditPost } from "../schemas/research.ts";
import { fetchJson, sleep, truncate, type Fetcher } from "./http.ts";

const HOSTS = ["https://www.reddit.com", "https://old.reddit.com", "https://api.reddit.com"];

export interface RedditListing<T> {
  data?: { children?: Array<{ kind: string; data: T }> };
}
export interface RedditPostData {
  id: string;
  subreddit: string;
  title: string;
  selftext?: string;
  url?: string;
  permalink: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
}
export interface RedditCommentData {
  author?: string;
  body?: string;
  score?: number;
  replies?: RedditListing<RedditCommentData> | "";
}

export function parseRedditSearch(res: RedditListing<RedditPostData>): RawRedditPost[] {
  return (res.data?.children ?? [])
    .filter((c) => c.kind === "t3" && c.data?.title)
    .map(({ data: d }) => ({
      id: d.id,
      subreddit: d.subreddit,
      title: d.title,
      selftext: truncate(d.selftext ?? "", 600),
      url: d.url ?? `https://www.reddit.com${d.permalink}`,
      permalink: `https://www.reddit.com${d.permalink}`,
      score: d.score ?? 0,
      numComments: d.num_comments ?? 0,
      createdAt: new Date((d.created_utc ?? 0) * 1000).toISOString(),
      comments: [],
    }));
}

export function flattenRedditComments(
  listing: RedditListing<RedditCommentData>[] | RedditListing<RedditCommentData>,
  cap = 25,
  maxLen = 400,
): RawComment[] {
  const out: RawComment[] = [];
  const commentsListing = Array.isArray(listing) ? listing[1] : listing;
  const walk = (l: RedditListing<RedditCommentData> | "" | undefined, depth: number) => {
    if (!l || typeof l === "string") return;
    for (const c of l.data?.children ?? []) {
      if (out.length >= cap) return;
      if (c.kind !== "t1" || !c.data?.body || c.data.body === "[deleted]") continue;
      out.push({ author: c.data.author, text: truncate(c.data.body, maxLen), score: c.data.score });
      if (depth < 1) walk(c.data.replies, depth + 1);
    }
  };
  walk(commentsListing, 0);
  return out.slice(0, cap);
}

async function fetchWithHostFallback<T>(path: string, fetchImpl?: Fetcher): Promise<T> {
  let lastErr: unknown;
  for (const host of HOSTS) {
    try {
      return await fetchJson<T>(`${host}${path}`, { fetchImpl, retries: 1 });
    } catch (err) {
      lastErr = err;
      await sleep(400);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function searchPosts(
  query: string,
  opts: { subreddit?: string; limit?: number; fetchImpl?: Fetcher } = {},
): Promise<RawRedditPost[]> {
  const limit = opts.limit ?? 10;
  const path = opts.subreddit
    ? `/r/${opts.subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&t=all&limit=${limit}`
    : `/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=${limit}`;
  const res = await fetchWithHostFallback<RedditListing<RedditPostData>>(path, opts.fetchImpl);
  return parseRedditSearch(res).sort((a, b) => b.score - a.score);
}

export async function getPostComments(
  permalink: string,
  opts: { cap?: number; fetchImpl?: Fetcher } = {},
): Promise<RawComment[]> {
  const path = new URL(permalink).pathname.replace(/\/$/, "") + `.json?limit=40&depth=2&sort=top`;
  const res = await fetchWithHostFallback<RedditListing<RedditCommentData>[]>(path, opts.fetchImpl);
  return flattenRedditComments(res, opts.cap ?? 25);
}
