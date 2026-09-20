import { z } from "zod";
import { Evidence } from "./common.ts";

export const PrincipleScore = z.object({
  principleId: z.string(),
  score: z.number().int().min(0).max(10),
  rationale: z.string(),
  evidence: z.array(Evidence).default([]),
  fix: z.string().describe("Concrete change that would raise the score"),
});

export const ValidationReport = z.object({
  scores: z.array(PrincipleScore),
  overall: z.number().describe("Weighted 0-10"),
  verdict: z.enum(["ready", "needs-work", "rethink-positioning"]),
  recommendedPositioning: z.string().describe("The one-liner we should actually launch with"),
  topRisks: z.array(z.string()).default([]),
  predictedReaction: z.string().describe("How the target audience will likely react on launch day"),
});
export type ValidationReport = z.infer<typeof ValidationReport>;
