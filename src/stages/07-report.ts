import path from "node:path";
import { execFile } from "node:child_process";
import type { Stage } from "../pipeline/stage.ts";
import { RunBundle } from "../schemas/bundle.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import type { ResearchFindings } from "../schemas/research.ts";
import type { ValidationReport } from "../schemas/validation.ts";
import type { DistributionPlan } from "../schemas/distribution.ts";
import type { Assets } from "../schemas/assets.ts";
import type { JuryResult } from "../schemas/jury.ts";
import { writeJson, writeText } from "../pipeline/artifacts.ts";
import { renderReport } from "../report/render.ts";
import { exportMarkdown } from "../report/markdown.ts";

export const reportStage: Stage<{ reportPath: string }> = {
  name: "report",
  label: "Render report",
  key: "report",
  async run(ctx, handle) {
    const bundle: RunBundle = RunBundle.parse({
      meta: { ...ctx.meta, finishedAt: new Date().toISOString() },
      brief: ctx.get<ProductBrief>("brief"),
      research: ctx.get<ResearchFindings>("research"),
      validation: ctx.get<ValidationReport>("validation"),
      distribution: ctx.get<DistributionPlan>("distribution"),
      jury: ctx.get<JuryResult>("jury"),
      assetsHistory: ctx.get<Assets[]>("assetsHistory"),
      finalAssets: ctx.get<Assets>("finalAssets"),
    });

    writeJson(path.join(ctx.outDir, "bundle.json"), bundle);
    const html = renderReport(bundle);
    const reportPath = path.join(ctx.outDir, "report.html");
    writeText(reportPath, html);
    handle.message("report.html");

    for (const [file, text] of Object.entries(exportMarkdown(bundle))) {
      writeText(path.join(ctx.outDir, file), text);
    }
    handle.message("markdown exports");

    if (ctx.flags.open) {
      const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      execFile(cmd, [reportPath], () => {});
    }
    return { reportPath };
  },
};
