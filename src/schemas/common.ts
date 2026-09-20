import { z } from "zod";

export const AssetKey = z.enum([
  "showHn",
  "productHunt",
  "xThread",
  "reddit",
  "linkedin",
  "demoVideo",
  "launchVideo",
]);
export type AssetKey = z.infer<typeof AssetKey>;

export const ASSET_LABELS: Record<AssetKey, string> = {
  showHn: "Show HN post",
  productHunt: "Product Hunt launch",
  xThread: "X / Twitter thread",
  reddit: "Reddit posts",
  linkedin: "LinkedIn post",
  demoVideo: "Demo video script",
  launchVideo: "Launch video script",
};

export const Source = z.enum([
  "hn",
  "reddit",
  "producthunt",
  "indiehackers",
  "x",
  "web",
  "repo",
]);
export type Source = z.infer<typeof Source>;

export const Evidence = z.object({
  quote: z.string().describe("Verbatim or lightly trimmed quote"),
  url: z.string().describe("Where the quote came from"),
  source: Source,
  score: z.number().optional().describe("Upvotes/points if known"),
});
export type Evidence = z.infer<typeof Evidence>;

export const LaunchGoal = z.enum(["stars", "signups", "feedback", "users", "hiring"]);
export const Tone = z.enum(["technical-plain", "playful", "bold", "understated"]);
