import { prefetch, rawResearchToText } from "../src/research/prefetch.ts";
const raw = await prefetch(
  {
    name: "x", slug: "x", oneLiner: "", whatItDoes: "", howItWorks: "", category: "", language: "", keyFeatures: [], differentiatorsClaimed: [],
    targetAudience: "", launchGoal: "stars", tone: "technical-plain", competitorsGuessed: [], openQuestions: [],
    searchQueries: ["launch checklist tool", "product hunt launch generator"], candidateSubreddits: ["SideProject"],
  },
  { onProgress: (m) => console.log("  ", m), maxQueries: 2, hnCommentsFor: 2, redditCommentsFor: 1 },
);
console.log("HN", raw.hn.length, "REDDIT", raw.reddit.length, "WARN", raw.warnings);
console.log("HN comments on top:", raw.hn[0]?.title, raw.hn[0]?.comments.length);
console.log("Reddit comments on top:", raw.reddit[0]?.title, raw.reddit[0]?.comments.length);
console.log("text chars:", rawResearchToText(raw).length);
