import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { flattenHnComments, parseHnSearch, searchStories } from "../src/research/hn.ts";

const search = JSON.parse(fs.readFileSync("fixtures/http/hn-search.json", "utf8"));
const item = JSON.parse(fs.readFileSync("fixtures/http/hn-item.json", "utf8"));

describe("hn", () => {
  it("parses search hits and drops untitled ones", () => {
    const stories = parseHnSearch(search);
    expect(stories).toHaveLength(2);
    expect(stories[0].hnUrl).toBe("https://news.ycombinator.com/item?id=1001");
    expect(stories[0].points).toBe(312);
  });
  it("flattens comments two levels deep, strips html, skips empties", () => {
    const comments = flattenHnComments(item);
    expect(comments.map((c) => c.author)).toEqual(["alice", "op", "carol"]);
    expect(comments[0].text).toContain('why not just use pgbadger? It already does "most" of this.');
  });
  it("caps comment count", () => {
    expect(flattenHnComments(item, 1)).toHaveLength(1);
  });
  it("sorts by points and sends a User-Agent", async () => {
    let headers: Record<string, string> | undefined;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      headers = init.headers as Record<string, string>;
      return new Response(JSON.stringify(search), { status: 200 });
    }) as unknown as typeof fetch;
    const stories = await searchStories("postgres logs", { fetchImpl });
    expect(stories[0].points).toBeGreaterThan(stories[1].points);
    expect(headers?.["User-Agent"]).toMatch(/LaunchJury/);
  });
});
