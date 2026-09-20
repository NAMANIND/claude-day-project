import type { ProductBrief } from "../schemas/brief.ts";
import type { RawResearch, RawHnStory, RawRedditPost } from "../schemas/research.ts";
import * as hn from "./hn.ts";
import * as reddit from "./reddit.ts";
import { sleep } from "./http.ts";

export interface PrefetchOptions {
  onProgress?: (msg: string) => void;
  maxQueries?: number;
  hnCommentsFor?: number;
  redditCommentsFor?: number;
}

export async function prefetch(brief: ProductBrief, opts: PrefetchOptions = {}): Promise<RawResearch> {
  const queries = brief.searchQueries.slice(0, opts.maxQueries ?? 5);
  const warnings: string[] = [];
  const hnMap = new Map<string, RawHnStory>();
  const redditMap = new Map<string, RawRedditPost>();
  const log = opts.onProgress ?? (() => {});

  // HN: all queries in parallel (Algolia is fast and tolerant)
  await Promise.all(
    queries.map(async (q) => {
      try {
        log(`hn_search "${q}"`);
        for (const s of await hn.searchStories(q, { hitsPerPage: 10 })) hnMap.set(s.objectID, s);
      } catch (e) {
        warnings.push(`HN search failed for "${q}": ${(e as Error).message}`);
      }
    }),
  );

  // Reddit: sequential, paced
  const redditTargets: Array<{ q: string; sub?: string }> = [
    ...queries.slice(0, 3).map((q) => ({ q })),
    ...brief.candidateSubreddits.slice(0, 3).map((sub) => ({ q: queries[0], sub })),
  ];
  for (const t of redditTargets) {
    try {
      log(`reddit_search "${t.q}"${t.sub ? ` in r/${t.sub}` : ""}`);
      for (const p of await reddit.searchPosts(t.q, { subreddit: t.sub, limit: t.sub ? 5 : 8 })) redditMap.set(p.id, p);
    } catch (e) {
      warnings.push(`Reddit search failed for "${t.q}"${t.sub ? ` in r/${t.sub}` : ""}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }

  const hnStories = [...hnMap.values()].sort((a, b) => b.points - a.points);
  const redditPosts = [...redditMap.values()].sort((a, b) => b.score - a.score);

  await Promise.all(
    hnStories.slice(0, opts.hnCommentsFor ?? 5).map(async (s) => {
      if (!s.numComments) return;
      try {
        log(`hn_comments "${s.title.slice(0, 40)}"`);
        s.comments = await hn.getStoryComments(s.objectID, { cap: 20 });
      } catch (e) {
        warnings.push(`HN comments failed for ${s.objectID}: ${(e as Error).message}`);
      }
    }),
  );

  for (const p of redditPosts.slice(0, opts.redditCommentsFor ?? 3)) {
    if (!p.numComments) continue;
    try {
      log(`reddit_comments "${p.title.slice(0, 40)}"`);
      p.comments = await reddit.getPostComments(p.permalink, { cap: 20 });
    } catch (e) {
      warnings.push(`Reddit comments failed for ${p.id}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }

  if (!redditPosts.length) {
    warnings.push("Reddit returned nothing (likely blocked). Analyst should use WebSearch with site:reddit.com.");
  }

  return { queries, hn: hnStories.slice(0, 25), reddit: redditPosts.slice(0, 20), warnings };
}

/** Compact text rendering for the analyst prompt, capped in size. */
export function rawResearchToText(raw: RawResearch, maxChars = 60_000): string {
  const parts: string[] = [];
  parts.push(`## Hacker News (${raw.hn.length} stories)`);
  for (const s of raw.hn) {
    parts.push(`\n### [${s.points}pts, ${s.numComments} comments] ${s.title}\n${s.hnUrl}${s.url ? ` → ${s.url}` : ""} (${s.createdAt.slice(0, 10)})`);
    for (const c of s.comments.slice(0, 10)) parts.push(`  - (${c.score ?? "?"}) ${c.text.slice(0, 260)}`);
  }
  parts.push(`\n## Reddit (${raw.reddit.length} posts)`);
  for (const p of raw.reddit) {
    parts.push(`\n### [r/${p.subreddit}, ${p.score}pts, ${p.numComments} comments] ${p.title}\n${p.permalink}\n${p.selftext.slice(0, 300)}`);
    for (const c of p.comments.slice(0, 10)) parts.push(`  - (${c.score ?? "?"}) ${c.text.slice(0, 260)}`);
  }
  if (raw.warnings.length) parts.push(`\n## Warnings\n${raw.warnings.map((w) => `- ${w}`).join("\n")}`);
  const text = parts.join("\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "\n…(truncated)" : text;
}
