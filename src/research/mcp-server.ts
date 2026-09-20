import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import * as hn from "./hn.ts";
import * as reddit from "./reddit.ts";

const text = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const errText = (err: unknown) => ({
  content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  isError: true,
});

export const RESEARCH_TOOL_NAMES = [
  "mcp__research__hn_search",
  "mcp__research__hn_comments",
  "mcp__research__reddit_search",
  "mcp__research__reddit_comments",
];

export function createResearchServer() {
  return createSdkMcpServer({
    name: "research",
    version: "0.1.0",
    tools: [
      tool(
        "hn_search",
        "Search Hacker News stories (Algolia). Returns title, points, comment count, HN url, external url.",
        { query: z.string().describe("Search terms, e.g. 'postgres log parser'") },
        async ({ query }) => {
          try {
            const stories = await hn.searchStories(query, { hitsPerPage: 10 });
            return text(stories.map(({ comments: _c, ...s }) => s));
          } catch (e) {
            return errText(e);
          }
        },
        { annotations: { readOnlyHint: true } },
      ),
      tool(
        "hn_comments",
        "Fetch up to 25 top-level comments for a Hacker News story by its objectID.",
        { objectID: z.string() },
        async ({ objectID }) => {
          try {
            return text(await hn.getStoryComments(objectID));
          } catch (e) {
            return errText(e);
          }
        },
        { annotations: { readOnlyHint: true } },
      ),
      tool(
        "reddit_search",
        "Search Reddit posts, optionally within one subreddit (no r/ prefix). Returns title, score, comments, permalink.",
        { query: z.string(), subreddit: z.string().optional() },
        async ({ query, subreddit }) => {
          try {
            const posts = await reddit.searchPosts(query, { subreddit, limit: 8 });
            return text(posts.map(({ comments: _c, ...p }) => p));
          } catch (e) {
            return errText(e);
          }
        },
        { annotations: { readOnlyHint: true } },
      ),
      tool(
        "reddit_comments",
        "Fetch up to 25 top comments for a Reddit post by its full permalink URL.",
        { permalink: z.string() },
        async ({ permalink }) => {
          try {
            return text(await reddit.getPostComments(permalink));
          } catch (e) {
            return errText(e);
          }
        },
        { annotations: { readOnlyHint: true } },
      ),
    ],
  });
}
