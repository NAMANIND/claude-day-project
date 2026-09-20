import { z } from "zod";

export const Scene = z.object({
  n: z.number().int(),
  durationSec: z.number(),
  onScreenAction: z.string().describe("What the viewer sees"),
  voiceOver: z.string(),
  onScreenText: z.string().optional(),
  shot: z.string().describe("How to record it: screen region, zoom, cursor, etc."),
});

export const ShowHn = z.object({
  title: z.string().describe("Starts with 'Show HN:' and stays under 80 chars"),
  body: z.string(),
  authorFirstComment: z.string(),
});
export const ProductHunt = z.object({
  tagline: z.string().describe("Under 60 chars"),
  description: z.string(),
  firstComment: z.string().describe("Maker comment"),
  topics: z.array(z.string()).default([]),
});
export const XThread = z.object({
  tweets: z.array(z.string()).describe("3-8 tweets, each under 280 chars"),
  tagSuggestions: z.array(z.string()).default([]),
});
export const RedditPost = z.object({
  subreddit: z.string(),
  title: z.string(),
  body: z.string(),
  flair: z.string().optional(),
});
export const LinkedIn = z.object({ post: z.string() });
export const DemoVideo = z.object({
  title: z.string(),
  totalSec: z.number(),
  scenes: z.array(Scene),
  shotList: z.array(z.string()).default([]),
  recordingNotes: z.string(),
});
export const LaunchVideo = z.object({
  hook: z.string().describe("First line spoken or shown"),
  totalSec: z.number(),
  scenes: z.array(Scene),
  cta: z.string(),
});

export const Posts = z.object({
  showHn: ShowHn,
  productHunt: ProductHunt,
  xThread: XThread,
  reddit: z.array(RedditPost),
  linkedin: LinkedIn,
});
export const Videos = z.object({ demoVideo: DemoVideo, launchVideo: LaunchVideo });

export const Assets = Posts.extend(Videos.shape).extend({ version: z.number().int() });
export type Assets = z.infer<typeof Assets>;
export type Posts = z.infer<typeof Posts>;
export type Videos = z.infer<typeof Videos>;

export const RevisedAssets = z.object({
  assets: Posts.extend(Videos.shape),
  changelog: z.array(z.string()).describe("One line per change, naming the asset and the juror concern it addresses"),
});
export type RevisedAssets = z.infer<typeof RevisedAssets>;
