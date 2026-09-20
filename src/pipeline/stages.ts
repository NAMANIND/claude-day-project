import type { Stage } from "./stage.ts";
import { resolveStage } from "../stages/00-resolve.ts";
import { ingestStage } from "../stages/01-ingest.ts";
import { researchStage } from "../stages/02-research.ts";
import { validateStage } from "../stages/03-validate.ts";
import { distributeStage } from "../stages/04-distribute.ts";
import { draftStage } from "../stages/05-draft.ts";
import { juryStage } from "../stages/06-jury.ts";
import { reportStage } from "../stages/07-report.ts";

// Order matters: the index is the artifact prefix (00-resolve.json, 01-brief.json, ...).
export const STAGES: Stage<any>[] = [
  resolveStage,
  ingestStage,
  researchStage,
  validateStage,
  distributeStage,
  draftStage,
  juryStage,
  reportStage,
];

export const STAGE_NAMES = STAGES.map((s) => s.name);
