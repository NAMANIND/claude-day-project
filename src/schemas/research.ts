import { z } from "zod";
import { Evidence } from "./common.ts";

export const SimilarProduct = z.object({
  name: z.string(),
  url: z.string(),
  platform: z.string(),
  claim: z.string().describe("What they said it does"),
  reception: z.enum(["positive", "mixed", "negative", "unknown"]),
  points: z.number().optional(),
  comments: z.number().optional(),
  takeaway: z.string().describe("What their launch teaches us"),
});

export const ResearchFindings = z.object({
  queriesUsed: z.array(z.string()).default([]),
  similarProducts: z.array(SimilarProduct).default([]),
  praiseThemes: z
    .array(z.object({ theme: z.string(), evidence: z.array(Evidence).default([]) }))
    .default([]),
  objections: z
    .array(
      z.object({
        objection: z.string(),
        frequency: z.enum(["common", "occasional", "rare"]),
        evidence: z.array(Evidence).default([]),
      }),
    )
    .default([]),
  featureRequests: z
    .array(z.object({ request: z.string(), evidence: z.array(Evidence).default([]) }))
    .default([]),
  winningTitles: z
    .array(
      z.object({
        title: z.string(),
        platform: z.string(),
        points: z.number(),
        url: z.string(),
        whyItWorked: z.string(),
      }),
    )
    .default([]),
  communities: z
    .array(
      z.object({
        name: z.string(),
        platform: z.enum(["reddit", "hn", "producthunt", "x", "indiehackers", "discord", "other"]),
        url: z.string().optional(),
        engagementNote: z.string(),
        rulesNote: z.string().optional(),
      }),
    )
    .default([]),
  gaps: z.array(z.string()).default([]).describe("What nobody has shipped yet"),
  summary: z.string().describe("3-5 sentence narrative of what the market is saying"),
});
export type ResearchFindings = z.infer<typeof ResearchFindings>;

// Deterministic prefetch output (no LLM involved)
export const RawComment = z.object({ author: z.string().optional(), text: z.string(), score: z.number().optional() });
export const RawHnStory = z.object({
  objectID: z.string(),
  title: z.string(),
  url: z.string().optional(),
  hnUrl: z.string(),
  points: z.number(),
  numComments: z.number(),
  createdAt: z.string(),
  comments: z.array(RawComment).default([]),
});
export const RawRedditPost = z.object({
  id: z.string(),
  subreddit: z.string(),
  title: z.string(),
  selftext: z.string(),
  url: z.string(),
  permalink: z.string(),
  score: z.number(),
  numComments: z.number(),
  createdAt: z.string(),
  comments: z.array(RawComment).default([]),
});
export const RawResearch = z.object({
  queries: z.array(z.string()),
  hn: z.array(RawHnStory),
  reddit: z.array(RawRedditPost),
  warnings: z.array(z.string()).default([]),
});
export type RawResearch = z.infer<typeof RawResearch>;
export type RawHnStory = z.infer<typeof RawHnStory>;
export type RawRedditPost = z.infer<typeof RawRedditPost>;
export type RawComment = z.infer<typeof RawComment>;
