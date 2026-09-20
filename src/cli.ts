#!/usr/bin/env -S npx tsx
import { parseArgs } from "node:util";
import path from "node:path";
import pc from "picocolors";
import { createUi } from "./ui/log.ts";
import { RunContext, type Flags } from "./pipeline/context.ts";
import { runPipeline } from "./pipeline/run.ts";
import { STAGE_NAMES } from "./pipeline/stages.ts";
import { slugFor } from "./stages/00-resolve.ts";
import { replayMock } from "./mock/replay.ts";

const HELP = `
${pc.bold("launchjury")} — a jury of launch specialists for your side project

Usage:
  launchjury <repo-path-or-github-url> [options]
  launchjury --mock                      replay a recorded run offline

Options:
  --from <stage>        resume from a stage using artifacts on disk
  --to <stage>          stop after a stage
  --yes, -y             accept the agent's suggested answers (non-interactive)
  --mock                replay fixtures/sample-run with simulated progress
  --mock-research       use recorded HN/Reddit data instead of live fetches
  --budget <usd>        abort if estimated spend exceeds this (default 6)
  --rounds <n>          max jury rounds (default 2)
  --concurrency <n>     parallel jurors (default 4)
  --out <dir>           output root (default ./out)
  --open                open report.html when done
  --quiet               minimal output
  -h, --help

Stages: ${STAGE_NAMES.join(" → ")}
`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      from: { type: "string" },
      to: { type: "string" },
      yes: { type: "boolean", short: "y", default: false },
      mock: { type: "boolean", default: false },
      "mock-research": { type: "boolean", default: false },
      budget: { type: "string", default: "6" },
      rounds: { type: "string", default: "2" },
      concurrency: { type: "string", default: "4" },
      out: { type: "string", default: "out" },
      open: { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || (!values.mock && positionals.length === 0)) {
    console.log(HELP);
    process.exit(values.help ? 0 : 1);
  }

  const flags: Flags = {
    from: values.from,
    to: values.to,
    yes: values.yes,
    mock: values.mock,
    mockResearch: values["mock-research"],
    budget: Number(values.budget),
    open: values.open,
    concurrency: Number(values.concurrency),
    rounds: Number(values.rounds),
    outRoot: path.resolve(values.out),
    quiet: values.quiet,
  };

  const ui = createUi({ quiet: flags.quiet });
  ui.intro("LaunchJury");

  if (flags.mock) {
    await replayMock(flags, ui);
    return;
  }

  const source = positionals[0];
  const ctx = new RunContext(source, flags, ui, slugFor(source));
  const started = Date.now();
  try {
    await runPipeline(ctx);
  } catch (err) {
    ui.error(err instanceof Error ? err.message : String(err));
    if (process.env.DEBUG) console.error(err);
    ui.outro(pc.red("Run failed. Fix the issue and resume with --from <stage>."));
    process.exit(1);
  }
  ui.costTable(Object.entries(ctx.meta.costs).map(([stage, c]) => ({ stage, ...c })));
  const totalS = ((Date.now() - started) / 1000).toFixed(0);
  ui.outro(`Done in ${totalS}s. Report: ${pc.cyan(path.join(ctx.outDir, "report.html"))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
