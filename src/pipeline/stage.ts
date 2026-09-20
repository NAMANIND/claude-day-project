import type { z } from "zod";
import type { RunContext } from "./context.ts";
import type { StageHandle } from "../ui/log.ts";
import { readArtifact, writeArtifact } from "./artifacts.ts";

export interface Stage<T = unknown> {
  name: string;
  label: string;
  /** Store key and artifact base name (without the NN- prefix). */
  key: string;
  schema?: z.ZodType<T>;
  /** Stages sharing a group run concurrently. */
  parallelGroup?: string;
  run(ctx: RunContext, handle: StageHandle): Promise<T>;
  /** Override to load extra artifacts when resuming with --from. */
  load?(ctx: RunContext, prefix: string): void;
}

export function artifactName(index: number, key: string) {
  return `${String(index).padStart(2, "0")}-${key}`;
}

export function defaultLoad<T>(stage: Stage<T>, ctx: RunContext, index: number) {
  if (!stage.schema) return;
  ctx.set(stage.key, readArtifact(ctx.outDir, artifactName(index, stage.key), stage.schema));
}

export function defaultSave<T>(stage: Stage<T>, ctx: RunContext, index: number, data: T) {
  ctx.set(stage.key, data);
  if (stage.schema) writeArtifact(ctx.outDir, artifactName(index, stage.key), stage.schema, data);
}
