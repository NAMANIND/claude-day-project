import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { DistributionPlan } from "../schemas/distribution.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import type { ResearchFindings } from "../schemas/research.ts";
import type { ValidationReport } from "../schemas/validation.ts";
import { heuristicsAsMarkdown } from "../research/heuristics.ts";
import { briefDigest, researchDigest } from "./03-validate.ts";

const SYSTEM = `You are a distribution strategist for developer and indie products. You decide WHERE to post, WHAT to post there, WHEN, and WHO to tell, and you justify every channel with evidence about where the target audience actually engages. You know each community's tolerance for self-promotion and you never recommend spamming.`;

export const distributeStage: Stage<DistributionPlan> = {
  name: "distribute",
  label: "Plan distribution",
  key: "distribution",
  schema: DistributionPlan,
  parallelGroup: "A",
  async run(ctx, handle) {
    const brief = ctx.get<ProductBrief>("brief");
    const research = ctx.get<ResearchFindings>("research");
    const validation = ctx.get<ValidationReport>("validation");

    const prompt = `Build a distribution plan for this launch.

# Product
${briefDigest(brief)}
Recommended positioning (from validation): ${validation.recommendedPositioning}
Validation verdict: ${validation.verdict} (${validation.overall}/10). Top risks: ${validation.topRisks.join("; ")}

# Research (where this audience lives and how they react)
${researchDigest(research, 10_000)}

# Posting heuristics (use and adapt; cite the reasoning)
${heuristicsAsMarkdown()}

Instructions:
- channels: 5-8 ranked channels. For each: why THIS audience is there (with evidence from research where possible), which asset to post (one of showHn, productHunt, xThread, reddit, linkedin, demoVideo, launchVideo), best day and local time with timezone, who to tag or notify (specific communities, newsletters, people-types — no invented handles), rules to respect, and the reaction to expect.
- Only include a subreddit if the research suggests it tolerates project posts; otherwise put it in doNot with the reason.
- sequence: a day-by-day plan from day -3 (prep) to day +7, e.g. soft launch on Indie Hackers, Show HN Tuesday morning, Product Hunt the following week, follow-ups.
- doNot: channels or behaviours to avoid and why (e.g. "r/programming removes project posts").
- audienceSummary: 2-3 sentences: who we are reaching and where they hang out.
- Launch goal is "${brief.launchGoal}" — rank channels by how well they serve that goal.`;

    const res = await runStructured({
      label: "distribute",
      prompt,
      schema: DistributionPlan,
      model: ROLE_MODEL.distribute,
      systemPrompt: SYSTEM,
      maxTurns: 3,
      maxBudgetUsd: ROLE_BUDGET_USD.distribute,
      onEvent: handle.onEvent,
    });
    ctx.addCost("distribute", res.costUsd, res.durationMs, res.model);
    return { ...res.data, channels: res.data.channels.sort((a, b) => a.rank - b.rank) };
  },
};
