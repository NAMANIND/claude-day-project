import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import type { Flags } from "../pipeline/context.ts";
import { RunContext } from "../pipeline/context.ts";
import type { Ui } from "../ui/log.ts";
import { runPipeline } from "../pipeline/run.ts";
import { STAGES } from "../pipeline/stages.ts";
import { readArtifact } from "../pipeline/artifacts.ts";
import { ProductBrief } from "../schemas/brief.ts";
import { JuryResult } from "../schemas/jury.ts";
import { RunMeta } from "../schemas/bundle.ts";
import { PERSONAS } from "../jury/personas.ts";
import { sleep } from "../research/http.ts";

const FIXTURE_DIR = path.resolve(import.meta.dirname, "../../fixtures/sample-run");

/** Replay a recorded run: copy fixtures to out/, animate progress, then really render the report. */
export async function replayMock(flags: Flags, ui: Ui) {
  if (!fs.existsSync(path.join(FIXTURE_DIR, "01-brief.json"))) {
    throw new Error(`No recorded run at ${FIXTURE_DIR}. Run a real launch first and copy out/<slug> there.`);
  }
  const brief = readArtifact(FIXTURE_DIR, "01-brief", ProductBrief);
  const jury = readArtifact(FIXTURE_DIR, "06-jury", JuryResult);
  const meta = fs.existsSync(path.join(FIXTURE_DIR, "meta.json")) ? RunMeta.parse(JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, "meta.json"), "utf8"))) : undefined;

  const ctx = new RunContext(meta?.source ?? brief.repoUrl ?? brief.slug, { ...flags, from: "report", mock: true }, ui, brief.slug);
  fs.mkdirSync(ctx.outDir, { recursive: true });
  for (const f of fs.readdirSync(FIXTURE_DIR)) {
    if (f.endsWith(".json")) fs.copyFileSync(path.join(FIXTURE_DIR, f), path.join(ctx.outDir, f));
  }
  if (meta) Object.assign(ctx.meta, { ...meta, mock: true, slug: brief.slug });

  const speed = Number(process.env.LAUNCHJURY_MOCK_SPEED ?? 1);
  const wait = (ms: number) => sleep(ms / speed);

  ui.info(pc.dim("Replaying a recorded run (no API calls). Remove --mock for a live run."));

  const script: Array<[string, string[]]> = [
    ["resolve", [`repo ${brief.repoUrl ?? brief.slug}`]],
    ["ingest", ["Read README.md", "Glob src/**/*", "Read src/index.ts", "Grep export", `${brief.name}: ${brief.oneLiner}`]],
    ["research", [...brief.searchQueries.slice(0, 4).map((q) => `hn_search "${q}"`), `reddit_search "${brief.searchQueries[0]}"`, "hn_comments …", `WebSearch "${brief.searchQueries[1] ?? brief.searchQueries[0]} product hunt"`, "WebFetch producthunt.com/…"]],
    ["validate", ["scoring 8 principles", "recommended positioning"]],
    ["distribute", ["ranking channels", "sequencing launch week"]],
    ["draft", ["1/2 drafts done (posts)", "2/2 drafts done (videos)"]],
  ];
  for (const [name, lines] of script) {
    const index = STAGES.findIndex((s) => s.name === name);
    const handle = ui.stage(index, STAGES[index].label);
    for (const l of lines) {
      handle.message(l);
      await wait(name === "resolve" ? 300 : 700);
    }
    const cost = meta?.costs[name];
    handle.done(cost ? `$${cost.usd.toFixed(2)}` : undefined);
  }

  const juryIdx = STAGES.findIndex((s) => s.name === "jury");
  const handle = ui.stage(juryIdx, STAGES[juryIdx].label);
  for (const round of jury.rounds) {
    let done = 0;
    for (const v of round.verdicts) {
      done++;
      const p = PERSONAS.find((x) => x.name === v.persona);
      handle.message(`round ${round.round}: ${done}/${round.verdicts.length} jurors · ${p?.emoji ?? ""} ${v.persona} ${v.overall}/10`);
      await wait(500);
    }
    ui.note(
      round.verdicts.map((v) => `${PERSONAS.find((p) => p.name === v.persona)?.emoji ?? "•"} ${v.persona.padEnd(20)} ${String(v.overall).padStart(2)}/10  ${pc.dim(v.predictedObjection.slice(0, 60))}`).join("\n") +
        `\n\n${pc.bold(`overall ${round.aggregate.overall}/10`)} · ${round.aggregate.passed ? pc.green("PASS") : pc.yellow("REVISE")}`,
      `Jury round ${round.round}`,
    );
    if (round.changelog?.length) {
      handle.message(`round ${round.round}: revising ${round.aggregate.mustFix.length} must-fixes`);
      await wait(1200);
    }
  }
  handle.done(meta?.costs.jury ? `$${meta.costs.jury.usd.toFixed(2)}` : undefined);

  await runPipeline(ctx);
  ui.costTable(Object.entries(ctx.meta.costs).map(([stage, c]) => ({ stage, ...c })));
  ui.outro(`Replayed. Report: ${pc.cyan(path.join(ctx.outDir, "report.html"))}`);
}
