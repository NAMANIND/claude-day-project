import pc from "picocolors";
import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { Assets, RevisedAssets } from "../schemas/assets.ts";
import { JuryResult, JuryVerdict, type JuryRound } from "../schemas/jury.ts";
import { ASSET_LABELS, type AssetKey } from "../schemas/common.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import type { ResearchFindings } from "../schemas/research.ts";
import { PERSONAS, personaSystemPrompt, type Persona } from "../jury/personas.ts";
import { aggregate, pLimit } from "../jury/foreman.ts";
import { readArtifact, writeArtifact } from "../pipeline/artifacts.ts";
import { briefDigest } from "./03-validate.ts";

export function assetsPacket(assets: Assets, targets: AssetKey[]): string {
  const parts: string[] = [];
  for (const key of targets) {
    const label = ASSET_LABELS[key];
    const value = assets[key];
    parts.push(`## ${label} (asset key: ${key})\n${renderAsset(key, value)}`);
  }
  return parts.join("\n\n");
}

export function renderAsset(key: AssetKey, value: unknown): string {
  switch (key) {
    case "showHn": {
      const v = value as Assets["showHn"];
      return `Title: ${v.title}\n\n${v.body}\n\n--- Author's first comment ---\n${v.authorFirstComment}`;
    }
    case "productHunt": {
      const v = value as Assets["productHunt"];
      return `Tagline: ${v.tagline}\nTopics: ${v.topics.join(", ")}\n\n${v.description}\n\n--- Maker comment ---\n${v.firstComment}`;
    }
    case "xThread": {
      const v = value as Assets["xThread"];
      return v.tweets.map((t, i) => `${i + 1}/ ${t}`).join("\n\n") + `\n\nTag: ${v.tagSuggestions.join(", ")}`;
    }
    case "reddit": {
      const v = value as Assets["reddit"];
      return v.map((r) => `### r/${r.subreddit}${r.flair ? ` [${r.flair}]` : ""}\nTitle: ${r.title}\n\n${r.body}`).join("\n\n");
    }
    case "linkedin":
      return (value as Assets["linkedin"]).post;
    case "demoVideo": {
      const v = value as Assets["demoVideo"];
      return `Title: ${v.title} (${v.totalSec}s)\n` + v.scenes.map(sceneLine).join("\n") + `\n\nShot list:\n${v.shotList.map((s) => `- ${s}`).join("\n")}\n\nRecording notes: ${v.recordingNotes}`;
    }
    case "launchVideo": {
      const v = value as Assets["launchVideo"];
      return `Hook: ${v.hook} (${v.totalSec}s)\n` + v.scenes.map(sceneLine).join("\n") + `\n\nCTA: ${v.cta}`;
    }
  }
}

function sceneLine(s: Assets["demoVideo"]["scenes"][number]) {
  return `Scene ${s.n} [${s.durationSec}s] SEE: ${s.onScreenAction} | VO: "${s.voiceOver}"${s.onScreenText ? ` | TEXT: ${s.onScreenText}` : ""} | SHOT: ${s.shot}`;
}

function researchObjections(r: ResearchFindings): string {
  return r.objections
    .slice(0, 6)
    .map((o) => `- [${o.frequency}] ${o.objection}${o.evidence[0] ? ` — e.g. "${o.evidence[0].quote.slice(0, 160)}"` : ""}`)
    .join("\n");
}

async function judge(persona: Persona, assets: Assets, brief: ProductBrief, research: ResearchFindings, round: number, onEvent: (e: import("../agent/progress.ts").ProgressEvent) => void) {
  const prompt = `Round ${round} of the launch jury for "${brief.name}".

# Product (for context only; you are judging the assets, not the product)
${briefDigest(brief)}

# Known objections from launches of similar products
${researchObjections(research) || "- none found"}

# Assets to judge
${assetsPacket(assets, persona.targets)}

Return a JuryVerdict with persona = "${persona.name}" and one assetScores entry per asset above (asset keys: ${persona.targets.join(", ")}).`;

  const res = await runStructured({
    label: `jury:${persona.name}`,
    prompt,
    schema: JuryVerdict,
    model: ROLE_MODEL.juror,
    systemPrompt: personaSystemPrompt(persona),
    effort: "medium",
    maxTurns: 8,
    maxBudgetUsd: ROLE_BUDGET_USD.juror,
    onEvent,
  });
  const allowed = new Set<string>(persona.targets);
  return {
    verdict: { ...res.data, persona: persona.name, assetScores: res.data.assetScores.filter((a) => allowed.has(a.asset)) },
    costUsd: res.costUsd,
    durationMs: res.durationMs,
  };
}

async function revise(assets: Assets, round: JuryRound, brief: ProductBrief, onEvent: (e: import("../agent/progress.ts").ProgressEvent) => void) {
  const edits = round.verdicts.flatMap((v) =>
    v.assetScores.flatMap((a) => a.edits.map((e) => `- [${a.asset}] ${v.persona}: ${e.what} (${e.why})${e.before ? `\n    before: ${e.before}` : ""}${e.after ? `\n    after: ${e.after}` : ""}`)),
  );
  const prompt = `You are revising launch assets after a jury round. Product: ${brief.name} — ${brief.oneLiner}. Tone: ${brief.tone}.

# Jury aggregate
Overall ${round.aggregate.overall}/10. Per asset: ${Object.entries(round.aggregate.perAsset).map(([k, v]) => `${k} ${v}`).join(", ")}.

# Must-fix (apply every one)
${round.aggregate.mustFix.map((m) => `- [${m.asset}] (${m.persona}) ${m.instruction}`).join("\n") || "- none"}

# Suggested edits (apply those that are consistent with the must-fixes)
${edits.slice(0, 40).join("\n") || "- none"}

# Predicted top comments to pre-empt
${round.verdicts.map((v) => `- ${v.persona}: "${v.predictedTopComment}"`).join("\n")}

# Current assets (all of them; return ALL assets, changed or not)
${assetsPacket(assets, Object.keys(ASSET_LABELS) as AssetKey[])}

Hard rule: do not introduce facts, numbers, or claims of completed work that are not in the current assets or the jury feedback. If a juror asked for proof you do not have, remove the claim rather than inventing support.

Return RevisedAssets: the complete asset set with the fixes applied, plus a changelog with one line per change naming the asset and the juror concern it addresses. Keep everything that was not criticized. Keep the same structure (same number of reddit posts, tweets under 280 chars, Show HN title under 80 chars).`;

  const res = await runStructured({
    label: "revise",
    prompt,
    schema: RevisedAssets,
    model: ROLE_MODEL.revise,
    systemPrompt: "You are a senior launch editor. You apply jury feedback precisely, preserve the author's voice, and never add hype while fixing things.",
    maxTurns: 8,
    maxBudgetUsd: ROLE_BUDGET_USD.revise,
    onEvent,
  });
  return { assets: { version: assets.version + 1, ...res.data.assets } as Assets, changelog: res.data.changelog, costUsd: res.costUsd, durationMs: res.durationMs };
}

export const juryStage: Stage<JuryResult> = {
  name: "jury",
  label: "Convene the jury",
  key: "jury",
  schema: JuryResult,
  async run(ctx, handle) {
    const brief = ctx.get<ProductBrief>("brief");
    const research = ctx.get<ResearchFindings>("research");
    let assets = ctx.get<Assets>("assets-v1");
    const history: Assets[] = [assets];
    const rounds: JuryRound[] = [];
    const maxRounds = Math.max(1, ctx.flags.rounds);
    const limit = pLimit(Math.max(1, ctx.flags.concurrency));

    for (let round = 1; round <= maxRounds; round++) {
      let done = 0;
      const started = Date.now();
      let roundCost = 0;
      handle.message(`round ${round}: 0/${PERSONAS.length} jurors`);
      const failed: string[] = [];
      const results = await Promise.all(
        PERSONAS.map((p) =>
          limit(async () => {
            try {
              const r = await judge(p, assets, brief, research, round, () => {});
              done++;
              roundCost += r.costUsd;
              handle.message(`round ${round}: ${done}/${PERSONAS.length} jurors · ${p.emoji} ${p.name} ${r.verdict.overall}/10`);
              return r;
            } catch (err) {
              done++;
              failed.push(p.name);
              handle.message(`round ${round}: ${done}/${PERSONAS.length} jurors · ${p.emoji} ${p.name} failed`);
              return undefined;
            }
          }),
        ),
      );
      const verdicts = results.filter((r): r is NonNullable<typeof r> => !!r).map((r) => r.verdict);
      if (failed.length) ctx.ui.warn(`Jurors skipped after errors: ${failed.join(", ")}`);
      if (!verdicts.length) throw new Error("Every juror failed; check auth/budget and resume with --from jury");
      const agg = aggregate(verdicts);
      const juryRound: JuryRound = { round, assetsVersion: assets.version, verdicts, aggregate: agg, costUsd: roundCost };
      ctx.addCost("jury", roundCost, Date.now() - started, ROLE_MODEL.juror);

      ctx.ui.note(
        verdicts
          .map((v) => `${PERSONAS.find((p) => p.name === v.persona)?.emoji ?? "•"} ${v.persona.padEnd(20)} ${String(v.overall).padStart(2)}/10  ${pc.dim(v.predictedObjection.slice(0, 60))}`)
          .join("\n") + `\n\n${pc.bold(`overall ${agg.overall}/10`)} · weakest: ${agg.weakestAsset ?? "—"} (${agg.weakestAsset ? agg.perAsset[agg.weakestAsset] : "—"}) · ${agg.passed ? pc.green("PASS") : pc.yellow("REVISE")}`,
        `Jury round ${round}`,
      );

      if (agg.passed || round === maxRounds) {
        rounds.push(juryRound);
        break;
      }

      handle.message(`round ${round}: revising ${agg.mustFix.length} must-fixes`);
      const rev = await revise(assets, juryRound, brief, handle.onEvent);
      ctx.addCost("jury", rev.costUsd, rev.durationMs, ROLE_MODEL.revise);
      juryRound.changelog = rev.changelog;
      rounds.push(juryRound);
      assets = rev.assets;
      history.push(assets);
      writeArtifact(ctx.outDir, `06-assets-v${assets.version}`, Assets, assets);
    }

    const last = rounds[rounds.length - 1];
    ctx.set("assetsHistory", history);
    ctx.set("finalAssets", assets);
    writeArtifact(ctx.outDir, "06-assets-final", Assets, assets);
    return { rounds, finalAssetsVersion: assets.version, status: last.aggregate.passed ? "passed" : "below-threshold" };
  },
  load(ctx, prefix) {
    const jury = readArtifact(ctx.outDir, `${prefix}-jury`, JuryResult);
    ctx.set("jury", jury);
    const history: Assets[] = [ctx.get<Assets>("assets-v1")];
    for (let v = 2; v <= jury.finalAssetsVersion; v++) history.push(readArtifact(ctx.outDir, `06-assets-v${v}`, Assets));
    ctx.set("assetsHistory", history);
    ctx.set("finalAssets", readArtifact(ctx.outDir, "06-assets-final", Assets));
  },
};
