import { describe, expect, it } from "vitest";
import { renderReport } from "../src/report/render.ts";
import { exportMarkdown } from "../src/report/markdown.ts";
import { RunBundle } from "../src/schemas/bundle.ts";
import { PRINCIPLES } from "../src/validation/principles.ts";

const scene = { n: 1, durationSec: 5, onScreenAction: "Terminal shows result", voiceOver: "Here is the result.", shot: "Full screen, 24pt font" };
const assets = (version: number) => ({
  version,
  showHn: { title: `Show HN: Foo – v${version} <script>alert(1)</script>`, body: "Body", authorFirstComment: "Hi" },
  productHunt: { tagline: "Tag", description: "Desc", firstComment: "Maker", topics: ["Dev Tools"] },
  xThread: { tweets: ["One", "Two", "Three"], tagSuggestions: [] },
  reddit: [{ subreddit: "SideProject", title: "T", body: "B" }],
  linkedin: { post: "LI" },
  demoVideo: { title: "Demo", totalSec: 60, scenes: [scene], shotList: ["Shot A"], recordingNotes: "1080p" },
  launchVideo: { hook: "Hook", totalSec: 70, scenes: [scene], cta: "Try it" },
});
const verdict = (persona: string, overall: number) => ({
  persona,
  overall,
  assetScores: [{ asset: "showHn" as const, score: overall, rationale: "ok", edits: [] }],
  predictedTopComment: "Why not just use X?",
  predictedObjection: "Wrapper",
  mustFix: [{ asset: "showHn" as const, instruction: "Cut the emoji" }],
  wouldEngage: overall >= 7,
});

export const bundle = RunBundle.parse({
  meta: { slug: "foo", source: ".", startedAt: "2026-09-20T00:00:00Z", costs: { ingest: { usd: 0.1, ms: 1000 } }, totalUsd: 0.1, totalMs: 1000 },
  brief: {
    name: "Foo", slug: "foo", oneLiner: "Foo parses bars for bazzers", whatItDoes: "Parses", howItWorks: "Magic", category: "CLI", language: "TypeScript",
    keyFeatures: ["fast"], differentiatorsClaimed: [], targetAudience: "Bazzers", launchGoal: "stars", tone: "technical-plain", searchQueries: ["bar parser"], candidateSubreddits: ["SideProject"], competitorsGuessed: [], openQuestions: [],
  },
  research: { summary: "Market likes bars.", similarProducts: [{ name: "Bar", url: "https://x", platform: "hn", claim: "c", reception: "mixed", takeaway: "t" }], objections: [{ objection: "Wrapper", frequency: "common", evidence: [{ quote: "just a wrapper", url: "https://news.ycombinator.com/item?id=1", source: "hn" }] }] },
  validation: { scores: PRINCIPLES.map((p) => ({ principleId: p.id, score: 7, rationale: "r", evidence: [], fix: "f" })), overall: 7, verdict: "needs-work", recommendedPositioning: "Foo parses bars", topRisks: ["r1"], predictedReaction: "meh" },
  distribution: { channels: [{ rank: 1, channel: "Show HN", platform: "hn", why: "w", whatToPost: "showHn", bestDay: "Tue", bestTimeLocal: "08:00", timezone: "PT", expectedReaction: "ok" }], sequence: [{ dayOffset: 0, action: "Post", channel: "Show HN" }], doNot: ["spam"], audienceSummary: "Bazzers" },
  jury: {
    rounds: [
      { round: 1, assetsVersion: 1, verdicts: [verdict("hn-veteran", 5)], aggregate: { overall: 5, perAsset: { showHn: 5 }, passed: false, weakestAsset: "showHn", mustFix: [{ asset: "showHn", instruction: "Cut the emoji", persona: "hn-veteran" }] }, changelog: ["showHn: cut emoji"] },
      { round: 2, assetsVersion: 2, verdicts: [verdict("hn-veteran", 8)], aggregate: { overall: 8, perAsset: { showHn: 8 }, passed: true, mustFix: [] } },
    ],
    finalAssetsVersion: 2,
    status: "passed",
  },
  assetsHistory: [assets(1), assets(2)],
  finalAssets: assets(2),
});

describe("report", () => {
  const html = renderReport(bundle);
  it("escapes model-provided text", () => {
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
  it("embeds a JSON bundle that round-trips", () => {
    const m = html.match(/<script type="application\/json" id="bundle">([\s\S]*?)<\/script>/);
    expect(m).toBeTruthy();
    const parsed = JSON.parse(m![1].replace(/<\\\//g, "</"));
    expect(parsed.finalAssets.version).toBe(2);
  });
  it("renders every section and no 'undefined'", () => {
    for (const id of ["product", "validation", "research", "jury", "revisions", "distribution", "assets"]) expect(html).toContain(`id="${id}"`);
    expect(html).not.toMatch(/>undefined</);
    expect(html).toContain("Round 2 · 8/10");
    expect(html).toContain('class="delta ">+3');
  });
  it("exports markdown per asset plus plan files", () => {
    const files = exportMarkdown(bundle);
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["assets/show-hn.md", "assets/demo-video.md", "distribution.md", "validation.md", "jury.md"]));
    expect(files["assets/show-hn.md"]).toContain("Show HN: Foo – v2");
  });
});
