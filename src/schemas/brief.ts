import { z } from "zod";
import { LaunchGoal, Tone } from "./common.ts";

export const SuggestedAnswers = z.object({
  targetAudience: z.string().describe("A specific person you could DM, not 'developers'"),
  launchGoal: LaunchGoal,
  tone: Tone,
});

export const ProductBrief = z.object({
  name: z.string(),
  slug: z.string().describe("kebab-case identifier"),
  repoUrl: z.string().optional(),
  oneLiner: z.string().describe("One sentence: what it does, for whom"),
  whatItDoes: z.string(),
  howItWorks: z.string(),
  category: z.string().describe("e.g. 'CLI dev tool', 'SaaS', 'library'"),
  language: z.string(),
  license: z.string().optional(),
  keyFeatures: z.array(z.string()).default([]),
  installCommand: z.string().optional(),
  differentiatorsClaimed: z.array(z.string()).default([]),
  targetAudience: z.string(),
  launchGoal: LaunchGoal,
  tone: Tone,
  searchQueries: z
    .array(z.string())
    .describe("3-6 short queries to find similar products and discussions"),
  candidateSubreddits: z.array(z.string()).default([]).describe("without r/ prefix"),
  competitorsGuessed: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  suggestedAnswers: SuggestedAnswers.optional(),
});
export type ProductBrief = z.infer<typeof ProductBrief>;
