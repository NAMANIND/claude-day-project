import type { RunBundle } from "../schemas/bundle.ts";
import { ASSET_LABELS, type AssetKey } from "../schemas/common.ts";
import { PRINCIPLES } from "../validation/principles.ts";
import { renderAsset } from "../stages/06-jury.ts";

export function exportMarkdown(b: RunBundle): Record<string, string> {
  const files: Record<string, string> = {};
  const a = b.finalAssets;
  for (const key of Object.keys(ASSET_LABELS) as AssetKey[]) {
    const file = `assets/${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}.md`;
    files[file] = `# ${ASSET_LABELS[key]} — ${b.brief.name} (v${a.version})\n\n${renderAsset(key, a[key])}\n`;
  }

  const d = b.distribution;
  files["distribution.md"] = `# Distribution plan — ${b.brief.name}

${d.audienceSummary}

## Channels
${d.channels.map((c) => `${c.rank}. **${c.channel}** (${c.platform}) — post the ${ASSET_LABELS[c.whatToPost]} on ${c.bestDay} at ${c.bestTimeLocal} ${c.timezone}.
   - Why: ${c.why}
   - Expect: ${c.expectedReaction}
   ${c.tagOrNotify.length ? `- Tag/notify: ${c.tagOrNotify.join(", ")}` : ""}
   ${c.rulesToRespect.length ? `- Rules: ${c.rulesToRespect.join("; ")}` : ""}`).join("\n")}

## Sequence
${d.sequence.map((s) => `- Day ${s.dayOffset >= 0 ? "+" : ""}${s.dayOffset}: **${s.channel}** — ${s.action}${s.note ? ` (${s.note})` : ""}`).join("\n")}

## Do not
${d.doNot.map((x) => `- ${x}`).join("\n")}
`;

  const v = b.validation;
  files["validation.md"] = `# Validation — ${b.brief.name}

Verdict: **${v.verdict}** (${v.overall}/10)

Recommended positioning: ${v.recommendedPositioning}

${PRINCIPLES.map((p) => {
    const s = v.scores.find((x) => x.principleId === p.id);
    return s ? `## ${p.name} — ${s.score}/10\n${s.rationale}\n\n**Fix:** ${s.fix}\n${s.evidence.map((e) => `> ${e.quote} — ${e.url}`).join("\n")}` : "";
  }).join("\n\n")}

## Predicted reaction
${v.predictedReaction}

## Top risks
${v.topRisks.map((r) => `- ${r}`).join("\n")}
`;

  files["jury.md"] = `# Jury — ${b.brief.name}

Status: **${b.jury.status}** after ${b.jury.rounds.length} round(s).

${b.jury.rounds.map((r) => `## Round ${r.round} — overall ${r.aggregate.overall}/10 (${r.aggregate.passed ? "pass" : "revise"})
${r.verdicts.map((j) => `### ${j.persona} — ${j.overall}/10
- Predicted top comment: "${j.predictedTopComment}"
- Objection: ${j.predictedObjection}
${j.assetScores.map((s) => `- ${ASSET_LABELS[s.asset]}: ${s.score}/10 — ${s.rationale}`).join("\n")}
${j.mustFix.map((m) => `- MUST FIX [${m.asset}]: ${m.instruction}`).join("\n")}`).join("\n\n")}
${r.changelog?.length ? `\n### Changes applied\n${r.changelog.map((c) => `- ${c}`).join("\n")}` : ""}`).join("\n\n")}
`;
  return files;
}
