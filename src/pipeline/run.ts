import pc from "picocolors";
import { STAGES } from "./stages.ts";
import { artifactName, defaultLoad, defaultSave, type Stage } from "./stage.ts";
import type { RunContext } from "./context.ts";

function stageIndex(name: string | undefined, fallback: number): number {
  if (!name) return fallback;
  const i = STAGES.findIndex((s) => s.name === name);
  if (i < 0) throw new Error(`Unknown stage '${name}'. Stages: ${STAGES.map((s) => s.name).join(", ")}`);
  return i;
}

export async function runPipeline(ctx: RunContext): Promise<void> {
  const from = stageIndex(ctx.flags.from, 0);
  const to = stageIndex(ctx.flags.to, STAGES.length - 1);
  if (from > to) throw new Error(`--from ${ctx.flags.from} is after --to ${ctx.flags.to}`);

  // Load earlier artifacts from disk.
  for (let i = 0; i < from; i++) {
    const stage = STAGES[i];
    if (stage.load) stage.load(ctx, String(i).padStart(2, "0"));
    else defaultLoad(stage, ctx, i);
  }
  if (from > 0) ctx.ui.info(`Resuming from ${pc.bold(STAGES[from].name)} using artifacts in ${ctx.outDir}`);

  // Run stages, grouping consecutive parallelGroup members.
  let i = from;
  while (i <= to) {
    const stage = STAGES[i];
    const group: Array<{ stage: Stage<any>; index: number }> = [{ stage, index: i }];
    if (stage.parallelGroup) {
      while (i + 1 <= to && STAGES[i + 1].parallelGroup === stage.parallelGroup) {
        i++;
        group.push({ stage: STAGES[i], index: i });
      }
    }
    await Promise.all(group.map(({ stage: s, index }) => runOne(ctx, s, index)));
    i++;
  }
}

async function runOne(ctx: RunContext, stage: Stage<any>, index: number) {
  const handle = ctx.ui.stage(index, stage.label);
  try {
    const data = await stage.run(ctx, handle);
    defaultSave(stage, ctx, index, data);
    const cost = ctx.meta.costs[stage.name];
    handle.done(cost ? `$${cost.usd.toFixed(2)}` : stage.schema ? artifactName(index, stage.key) + ".json" : undefined);
  } catch (err) {
    handle.fail(err instanceof Error ? err.message : String(err));
    throw err;
  }
}
