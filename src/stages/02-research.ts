import fs from "node:fs";
import path from "node:path";
import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { ResearchFindings, RawResearch } from "../schemas/research.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import { prefetch, rawResearchToText } from "../research/prefetch.ts";
import { createResearchServer, RESEARCH_TOOL_NAMES } from "../research/mcp-server.ts";
import { writeArtifact } from "../pipeline/artifacts.ts";

const SYSTEM = `You are a launch research analyst. You study how similar products were received when they launched, extract what people praised, objected to, and asked for, and you always cite a URL for every quote. You separate what the data says from what you infer. You are allergic to generic advice.`;

const FIXTURE = path.resolve(import.meta.dirname, "../../fixtures/http/raw-research.json");

export const researchStage: Stage<ResearchFindings> = {
  name: "research",
  label: "Research launch platforms",
  key: "research",
  schema: ResearchFindings,
  async run(ctx, handle) {
    const brief = ctx.get<ProductBrief>("brief");

    let raw: RawResearch;
    if (ctx.flags.mockResearch && fs.existsSync(FIXTURE)) {
      handle.message("using recorded HN/Reddit fixtures");
      raw = RawResearch.parse(JSON.parse(fs.readFileSync(FIXTURE, "utf8")));
    } else {
      raw = await prefetch(brief, { onProgress: (m) => handle.message(m) });
    }
    writeArtifact(ctx.outDir, "02a-raw-research", RawResearch, raw);
    handle.message(`${raw.hn.length} HN stories, ${raw.reddit.length} Reddit posts prefetched`);
    const redditBlocked = raw.reddit.length === 0;
    const webSearchBudget = redditBlocked ? 6 : 4;
    const toolNames = redditBlocked ? RESEARCH_TOOL_NAMES.filter((t) => !t.includes("reddit")) : RESEARCH_TOOL_NAMES;

    const prompt = `We are about to launch this product:

Name: ${brief.name}
One-liner: ${brief.oneLiner}
What it does: ${brief.whatItDoes}
Category: ${brief.category} · Language: ${brief.language}
Target audience: ${brief.targetAudience}
Claimed differentiators: ${brief.differentiatorsClaimed.join("; ") || "none stated"}
Competitors we suspect: ${brief.competitorsGuessed.join(", ") || "unknown"}

Below is pre-fetched data from Hacker News and Reddit for these queries: ${raw.queries.map((q) => `"${q}"`).join(", ")}.

${rawResearchToText(raw)}

Your job: produce ResearchFindings that tell us how THIS audience reacts to launches of similar products.

Rules:
- Every Evidence quote must be a real quote from the data above or from a page you fetched, with its URL. Never fabricate quotes.
- You may make at most ${webSearchBudget} WebSearch calls (use them for Product Hunt, Indie Hackers, X/Twitter${redditBlocked ? ', and at least two "site:reddit.com" searches because the Reddit API was blocked' : ', or "site:reddit.com" if Reddit data is thin'}) and at most 6 research tool calls (hn_comments${redditBlocked ? "" : " / reddit_comments"} on the most relevant threads, or one new hn_search${redditBlocked ? "" : " / reddit_search"} if the prefetched queries missed the mark). WebFetch a Product Hunt or Reddit page when a search result looks directly relevant.
- similarProducts: 4-8 adjacent products/launches with an honest reception rating and a one-line takeaway for us.
- objections: the recurring pushback this category gets. Mark frequency honestly.
- winningTitles: titles that earned real points, with why they worked.
- communities: where these people actually engage (subreddits, HN, PH topics, X circles), with a note on how they treat self-promotion.
- gaps: what nobody in the data has shipped or what people keep asking for.
- summary: 3-5 sentences a founder could read in 30 seconds.`;

    const res = await runStructured({
      label: "research",
      prompt,
      schema: ResearchFindings,
      model: ROLE_MODEL.research,
      systemPrompt: SYSTEM,
      tools: ["WebSearch", "WebFetch"],
      allowedTools: toolNames,
      mcpServers: { research: createResearchServer() },
      maxTurns: 25,
      maxBudgetUsd: ROLE_BUDGET_USD.research,
      onEvent: handle.onEvent,
    });
    ctx.addCost("research", res.costUsd, res.durationMs, res.model);
    return { ...res.data, queriesUsed: res.data.queriesUsed.length ? res.data.queriesUsed : raw.queries };
  },
};
