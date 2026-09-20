import { describe, expect, it } from "vitest";
import * as schemas from "../src/schemas/index.ts";
import { extractJson, toStructuredSchema } from "../src/agent/run-query.ts";
import { PRINCIPLES, weightedOverall, verdictFor } from "../src/validation/principles.ts";

describe("schemas", () => {
  it("every schema converts to draft-07 JSON schema", () => {
    for (const s of [schemas.ProductBrief, schemas.ResearchFindings, schemas.ValidationReport, schemas.Assets, schemas.JuryVerdict, schemas.DistributionPlan, schemas.RevisedAssets, schemas.Posts, schemas.Videos]) {
      const js = toStructuredSchema(s);
      expect(js.type).toBe("object");
      expect(js.$schema).toBeUndefined();
    }
  });
  it("lenient defaults apply on parse", () => {
    const r = schemas.ResearchFindings.parse({ summary: "x" });
    expect(r.objections).toEqual([]);
  });
  it("extractJson pulls a fenced object out of prose", () => {
    expect(extractJson('Sure!\n```json\n{"a": {"b": "}"}}\n```\nthanks')).toEqual({ a: { b: "}" } });
    expect(extractJson("no json here")).toBeUndefined();
  });
  it("weightedOverall and verdict", () => {
    const all = PRINCIPLES.map((p) => ({ principleId: p.id, score: 8 }));
    expect(weightedOverall(all)).toBe(8);
    expect(verdictFor(8)).toBe("ready");
    expect(verdictFor(6)).toBe("needs-work");
    expect(verdictFor(2)).toBe("rethink-positioning");
  });
});
