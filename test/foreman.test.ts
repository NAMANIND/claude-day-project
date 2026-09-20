import { describe, expect, it } from "vitest";
import { aggregate, dedupeMustFix, pLimit } from "../src/jury/foreman.ts";
import type { JuryVerdict } from "../src/schemas/jury.ts";

const v = (persona: string, overall: number, asset: "showHn" | "reddit", score: number, fixes: string[] = []): JuryVerdict => ({
  persona,
  overall,
  assetScores: [{ asset, score, rationale: "r", edits: [] }],
  predictedTopComment: "c",
  predictedObjection: "o",
  mustFix: fixes.map((instruction) => ({ asset, instruction })),
  wouldEngage: overall >= 7,
});

describe("foreman", () => {
  it("weights hn-veteran (1.2) more than x-growth (0.8)", () => {
    const agg = aggregate([v("hn-veteran", 10, "showHn", 10), v("x-growth", 5, "showHn", 5)]);
    expect(agg.overall).toBe(8);
    expect(agg.perAsset.showHn).toBe(8);
  });
  it("fails when any asset is below 6 even if overall passes", () => {
    const agg = aggregate([v("hn-veteran", 9, "showHn", 9), v("reddit-mod", 8, "reddit", 5)]);
    expect(agg.overall).toBeGreaterThanOrEqual(7.5);
    expect(agg.passed).toBe(false);
    expect(agg.weakestAsset).toBe("reddit");
  });
  it("passes at the threshold", () => {
    expect(aggregate([v("ph-coach", 8, "showHn", 7)]).passed).toBe(true);
    expect(aggregate([v("ph-coach", 7, "showHn", 7)]).passed).toBe(false);
  });
  it("dedupes near-identical must-fixes and caps per asset", () => {
    const fixes = dedupeMustFix([
      v("skeptical-user", 5, "showHn", 5, ["Remove the word revolutionary from the title", "Add the license to the body"]),
      v("hn-veteran", 5, "showHn", 5, ["Remove the word revolutionary from the title please", "Mention the stack", "Cut the emoji", "Fifth fix"]),
    ]);
    expect(fixes).toHaveLength(3);
    expect(fixes[0].persona).toBe("skeptical-user"); // same weight, stable order
    expect(fixes.filter((f) => /revolutionary/.test(f.instruction))).toHaveLength(1);
  });
  it("pLimit runs at most N at once", async () => {
    const limit = pLimit(2);
    let active = 0;
    let peak = 0;
    await Promise.all(
      Array.from({ length: 6 }, () =>
        limit(async () => {
          active++;
          peak = Math.max(peak, active);
          await new Promise((r) => setTimeout(r, 5));
          active--;
        }),
      ),
    );
    expect(peak).toBe(2);
  });
});
