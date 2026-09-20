import { z } from "zod";
import { AssetKey, Evidence } from "./common.ts";

export const Channel = z.object({
  rank: z.number().int(),
  channel: z.string().describe("e.g. 'Show HN', 'r/commandline', 'Product Hunt'"),
  platform: z.string(),
  url: z.string().optional(),
  why: z.string().describe("Why this audience, grounded in research"),
  evidence: z.array(Evidence).default([]),
  whatToPost: AssetKey,
  bestDay: z.string(),
  bestTimeLocal: z.string(),
  timezone: z.string(),
  tagOrNotify: z.array(z.string()).default([]),
  rulesToRespect: z.array(z.string()).default([]),
  expectedReaction: z.string(),
});

export const DistributionPlan = z.object({
  channels: z.array(Channel),
  sequence: z.array(
    z.object({
      dayOffset: z.number().int(),
      action: z.string(),
      channel: z.string(),
      note: z.string().optional(),
    }),
  ),
  doNot: z.array(z.string()).default([]),
  audienceSummary: z.string().describe("Who we are reaching and where they hang out"),
});
export type DistributionPlan = z.infer<typeof DistributionPlan>;
