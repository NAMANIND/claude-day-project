import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { flattenRedditComments, parseRedditSearch, searchPosts } from "../src/research/reddit.ts";

const search = JSON.parse(fs.readFileSync("fixtures/http/reddit-search.json", "utf8"));
const comments = JSON.parse(fs.readFileSync("fixtures/http/reddit-comments.json", "utf8"));

describe("reddit", () => {
  it("parses only t3 posts and builds permalinks", () => {
    const posts = parseRedditSearch(search);
    expect(posts).toHaveLength(2);
    expect(posts[0].permalink).toBe("https://www.reddit.com/r/PostgreSQL/comments/abc1/anyone_using/");
  });
  it("flattens comments, skipping deleted and 'more'", () => {
    const flat = flattenRedditComments(comments);
    expect(flat.map((c) => c.author)).toEqual(["u1", "u2"]);
  });
  it("falls back to the next host on 403", async () => {
    const hosts: string[] = [];
    const fetchImpl = (async (url: string) => {
      hosts.push(new URL(url).host);
      if (hosts.length === 1) return new Response("blocked", { status: 403 });
      return new Response(JSON.stringify(search), { status: 200 });
    }) as unknown as typeof fetch;
    const posts = await searchPosts("log analyzer", { fetchImpl });
    expect(hosts.slice(0, 2)).toEqual(["www.reddit.com", "old.reddit.com"]);
    expect(posts[0].score).toBe(120);
  });
});
