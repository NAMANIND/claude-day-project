import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import type { Stage } from "../pipeline/stage.ts";

export const Resolved = z.object({
  repoDir: z.string(),
  slug: z.string(),
  source: z.string(),
  repoUrl: z.string().optional(),
});
export type Resolved = z.infer<typeof Resolved>;

export function isGitUrl(s: string) {
  return /^(https?:\/\/|git@)/.test(s);
}

export function slugFor(source: string): string {
  const base = isGitUrl(source)
    ? source.replace(/\.git$/, "").split(/[/:]/).filter(Boolean).pop() ?? "project"
    : path.basename(path.resolve(source));
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

export const resolveStage: Stage<Resolved> = {
  name: "resolve",
  label: "Resolve repository",
  key: "resolved",
  schema: Resolved,
  async run(ctx, handle) {
    const src = ctx.source;
    const slug = slugFor(src);
    if (isGitUrl(src)) {
      const dir = path.join(os.tmpdir(), "launchjury", slug);
      if (fs.existsSync(path.join(dir, ".git"))) {
        handle.message("using cached clone");
      } else {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(dir), { recursive: true });
        handle.message(`git clone --depth 1 ${src}`);
        execFileSync("git", ["clone", "--depth", "1", "--quiet", src, dir], { stdio: "pipe" });
      }
      return { repoDir: dir, slug, source: src, repoUrl: src.replace(/\.git$/, "") };
    }
    const dir = path.resolve(src);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`Not a directory: ${dir}`);
    }
    let repoUrl: string | undefined;
    try {
      const remote = execFileSync("git", ["-C", dir, "remote", "get-url", "origin"], { stdio: "pipe" }).toString().trim();
      repoUrl = remote.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
    } catch {
      /* no remote */
    }
    return { repoDir: dir, slug, source: src, repoUrl };
  },
};
