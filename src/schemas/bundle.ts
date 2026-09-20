import { z } from "zod";
import { ProductBrief } from "./brief.ts";
import { ResearchFindings } from "./research.ts";
import { ValidationReport } from "./validation.ts";
import { DistributionPlan } from "./distribution.ts";
import { Assets } from "./assets.ts";
import { JuryResult } from "./jury.ts";

export const StageCost = z.object({ usd: z.number(), ms: z.number(), model: z.string().optional() });

export const RunMeta = z.object({
  slug: z.string(),
  source: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  costs: z.record(z.string(), StageCost).default({}),
  totalUsd: z.number().default(0),
  totalMs: z.number().default(0),
  mock: z.boolean().default(false),
});

export const RunBundle = z.object({
  meta: RunMeta,
  brief: ProductBrief,
  research: ResearchFindings,
  validation: ValidationReport,
  distribution: DistributionPlan,
  jury: JuryResult,
  assetsHistory: z.array(Assets),
  finalAssets: Assets,
});
export type RunBundle = z.infer<typeof RunBundle>;
export type RunMeta = z.infer<typeof RunMeta>;
