import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { ValidationReport } from "../schemas/validation.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import type { ResearchFindings } from "../schemas/research.ts";
import { PRINCIPLES, principlesAsMarkdown, verdictFor, weightedOverall } from "../validation/principles.ts";

const SYSTEM = `You are a launch strategist who validates product positioning against explicit principles and real market evidence. You score honestly: a 5 is average, a 9 is rare. Every score needs evidence and a concrete fix. You write for a builder who wants the truth, not encouragement.`;

export function researchDigest(r: ResearchFindings, maxChars = 14_000): string {
  const lines: string[] = [];
  lines.push(`Summary: ${r.summary}`);
  lines.push(`\nSimilar products:`);
  for (const s of r.similarProducts) lines.push(`- ${s.name} (${s.platform}, ${s.reception}${s.points ? `, ${s.points}pts` : ""}): ${s.claim} → ${s.takeaway} [${s.url}]`);
  lines.push(`\nObjections:`);
  for (const o of r.objections) {
    lines.push(`- [${o.frequency}] ${o.objection}`);
    for (const e of o.evidence.slice(0, 2)) lines.push(`    "${e.quote}" — ${e.url}`);
  }
  lines.push(`\nPraise themes:`);
  for (const t of r.praiseThemes) {
    lines.push(`- ${t.theme}`);
    for (const e of t.evidence.slice(0, 2)) lines.push(`    "${e.quote}" — ${e.url}`);
  }
  lines.push(`\nFeature requests:`);
  for (const f of r.featureRequests) lines.push(`- ${f.request}`);
  lines.push(`\nWinning titles:`);
  for (const w of r.winningTitles) lines.push(`- "${w.title}" (${w.platform}, ${w.points}pts): ${w.whyItWorked}`);
  lines.push(`\nCommunities:`);
  for (const c of r.communities) lines.push(`- ${c.name} (${c.platform}): ${c.engagementNote}${c.rulesNote ? ` Rules: ${c.rulesNote}` : ""}`);
  lines.push(`\nGaps: ${r.gaps.join("; ")}`);
  const text = lines.join("\n");
  return text.length > maxChars ? text.slice(0, maxChars) + "\n…(truncated)" : text;
}

export function briefDigest(b: ProductBrief): string {
  return `Name: ${b.name}
One-liner: ${b.oneLiner}
What it does: ${b.whatItDoes}
How it works: ${b.howItWorks}
Category: ${b.category} · Language: ${b.language} · License: ${b.license ?? "unknown"}
Install: ${b.installCommand ?? "unknown"}
Key features: ${b.keyFeatures.join("; ")}
Claimed differentiators: ${b.differentiatorsClaimed.join("; ") || "none"}
Target audience: ${b.targetAudience}
Launch goal: ${b.launchGoal} · Tone: ${b.tone}
Repo: ${b.repoUrl ?? "n/a"}
Open questions: ${b.openQuestions.join("; ") || "none"}`;
}

export const validateStage: Stage<ValidationReport> = {
  name: "validate",
  label: "Validate positioning",
  key: "validation",
  schema: ValidationReport,
  async run(ctx, handle) {
    const brief = ctx.get<ProductBrief>("brief");
    const research = ctx.get<ResearchFindings>("research");

    const prompt = `Score this product's launch readiness against the principles below, using the research as evidence.

# Product
${briefDigest(brief)}

# Research findings
${researchDigest(research)}

# Principles
${principlesAsMarkdown()}

Instructions:
- Return exactly one score per principle, using the principle ids: ${PRINCIPLES.map((p) => p.id).join(", ")}.
- evidence: quote the README/brief or a research quote (with URL) that justifies the score. Use source "repo" for README-derived evidence with the repo URL.
- fix: the single most valuable concrete change for that principle (rewrite a sentence, add a benchmark, name a competitor, etc.).
- recommendedPositioning: the one-liner we should actually launch with. Noun + verb + for whom. No adjectives.
- predictedReaction: two or three sentences on how ${brief.targetAudience} will react on launch day, given the objections in the research.
- overall and verdict will be recomputed from weights; still fill them in.
- Use only facts and numbers that appear in the product or research sections above. If you want to suggest a "why now" or a proof point, phrase it as something to verify or build, never as an established fact.`;

    const res = await runStructured({
      label: "validate",
      prompt,
      schema: ValidationReport,
      model: ROLE_MODEL.validate,
      systemPrompt: SYSTEM,
      maxTurns: 8,
      maxBudgetUsd: ROLE_BUDGET_USD.validate,
      onEvent: handle.onEvent,
    });
    ctx.addCost("validate", res.costUsd, res.durationMs, res.model);

    // Deterministic post-processing: ensure all principles present, recompute overall + verdict.
    const scores = PRINCIPLES.map((p) => {
      const s = res.data.scores.find((x) => x.principleId === p.id);
      return s ?? { principleId: p.id, score: 5, rationale: "Not scored by the model; defaulted to average.", evidence: [], fix: "Re-run validation." };
    });
    const overall = weightedOverall(scores);
    return { ...res.data, scores, overall, verdict: verdictFor(overall) };
  },
};
