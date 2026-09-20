import pc from "picocolors";
import { STAGES } from "./stages.ts";
import { artifactName, defaultLoad, defaultSave, type Stage } from "./stage.ts";
import type { RunContext } from "./context.ts";
import type { StageHandle } from "../ui/log.ts";

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
    if (group.length === 1) {
      await runOne(ctx, group[0].stage, group[0].index);
    } else {
      await runGroup(ctx, group);
    }
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

/** Parallel stages share one spinner so their progress lines don't fight over the terminal. */
async function runGroup(ctx: RunContext, group: Array<{ stage: Stage<any>; index: number }>) {
  const label = group.map((g) => g.stage.label).join(" ‖ ");
  const handle = ctx.ui.stage(group[0].index, label);
  const latest = new Map<string, string>();
  const compose = () => [...latest.entries()].map(([k, v]) => `${k}: ${v}`).join("  ·  ");
  const sub = (stage: Stage<any>): StageHandle => ({
    message: (t) => { latest.set(stage.name, t); handle.message(compose()); },
    done: () => {},
    fail: () => {},
    onEvent: (e) => {
      if (e.kind === "tool") latest.set(stage.name, `${e.name} ${e.summary}`);
      else if (e.kind === "status") latest.set(stage.name, e.text);
      else return;
      handle.message(compose());
    },
  });
  try {
    await Promise.all(
      group.map(async ({ stage, index }) => {
        const data = await stage.run(ctx, sub(stage));
        defaultSave(stage, ctx, index, data);
        latest.set(stage.name, "done");
        handle.message(compose());
      }),
    );
    const usd = group.reduce((a, g) => a + (ctx.meta.costs[g.stage.name]?.usd ?? 0), 0);
    handle.done(`$${usd.toFixed(2)}`);
  } catch (err) {
    handle.fail(err instanceof Error ? err.message : String(err));
    throw err;
  }
}
