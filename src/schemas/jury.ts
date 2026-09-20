import { z } from "zod";
import { AssetKey } from "./common.ts";

export const Edit = z.object({
  what: z.string(),
  why: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const AssetScore = z.object({
  asset: AssetKey,
  score: z.number().int().min(1).max(10),
  rationale: z.string(),
  edits: z.array(Edit).default([]),
});

export const JuryVerdict = z.object({
  persona: z.string(),
  overall: z.number().int().min(1).max(10),
  assetScores: z.array(AssetScore),
  predictedTopComment: z.string().describe("The literal top comment this audience would leave"),
  predictedObjection: z.string(),
  mustFix: z.array(z.object({ asset: AssetKey, instruction: z.string() })).default([]),
  wouldEngage: z.boolean().describe("Would this persona upvote/share/install?"),
});
export type JuryVerdict = z.infer<typeof JuryVerdict>;

export const JuryAggregate = z.object({
  overall: z.number(),
  perAsset: z.record(z.string(), z.number()),
  passed: z.boolean(),
  weakestAsset: z.string().optional(),
  mustFix: z.array(z.object({ asset: AssetKey, instruction: z.string(), persona: z.string() })),
});
export type JuryAggregate = z.infer<typeof JuryAggregate>;

export const JuryRound = z.object({
  round: z.number().int(),
  assetsVersion: z.number().int(),
  verdicts: z.array(JuryVerdict),
  aggregate: JuryAggregate,
  changelog: z.array(z.string()).optional(),
  costUsd: z.number().optional(),
});
export type JuryRound = z.infer<typeof JuryRound>;

export const JuryResult = z.object({
  rounds: z.array(JuryRound),
  finalAssetsVersion: z.number().int(),
  status: z.enum(["passed", "below-threshold"]),
});
export type JuryResult = z.infer<typeof JuryResult>;
