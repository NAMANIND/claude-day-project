import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { ProductBrief } from "../schemas/brief.ts";
import { LaunchGoal, Tone } from "../schemas/common.ts";
import type { Resolved } from "./00-resolve.ts";

const MANIFESTS = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod", "setup.py", "Gemfile", "composer.json", "pom.xml"];

function readIfExists(file: string, max: number): string | undefined {
  if (!fs.existsSync(file)) return undefined;
  const txt = fs.readFileSync(file, "utf8");
  return txt.length > max ? txt.slice(0, max) + "\n…(truncated)" : txt;
}

function findReadme(dir: string): string | undefined {
  const entry = fs.readdirSync(dir).find((f) => /^readme(\.(md|mdx|rst|txt))?$/i.test(f));
  return entry ? path.join(dir, entry) : undefined;
}

export function preRead(repoDir: string) {
  const readmePath = findReadme(repoDir);
  const readme = readmePath ? readIfExists(readmePath, 7000) : undefined;
  const manifests = MANIFESTS.map((m) => ({ name: m, text: readIfExists(path.join(repoDir, m), 2500) })).filter((m) => m.text);
  const tree = fs
    .readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => (d.isDirectory() ? d.name + "/" : d.name))
    .slice(0, 60);
  return { readme, readmeName: readmePath ? path.basename(readmePath) : undefined, manifests, tree };
}

const SYSTEM = `You are a product analyst preparing a launch brief. You read a code repository and describe, in plain concrete language, what the product does, for whom, and what makes it different. You never invent features that are not in the code or README. When something is unclear, you say so in openQuestions instead of guessing.`;

export const ingestStage: Stage<ProductBrief> = {
  name: "ingest",
  label: "Understand the product",
  key: "brief",
  schema: ProductBrief,
  async run(ctx, handle) {
    const resolved = ctx.get<Resolved>("resolved");
    const pre = preRead(resolved.repoDir);
    handle.message(`read ${pre.readmeName ?? "no README"}, ${pre.manifests.length} manifest(s)`);

    const prompt = `Produce a ProductBrief for the repository in the current working directory.

Repository: ${resolved.repoUrl ?? resolved.source}
Top-level entries: ${pre.tree.join(", ")}

${pre.readme ? `## ${pre.readmeName}\n${pre.readme}` : "## No README found. Rely on the code."}

${pre.manifests.map((m) => `## ${m.name}\n${m.text}`).join("\n\n")}

Steps:
1. Use Glob/Grep/Read to look at the entry point and 2-4 key source files so you understand what it ACTUALLY does (not just what the README claims). Spend at most 8 tool calls.
2. Write the brief. The oneLiner must be: noun + verb + for whom, no adjectives.
3. searchQueries: 3-6 short queries a person would type to find similar tools and discussions about this problem (generic problem terms, competitor names, category names). Do not include the product's own name.
4. candidateSubreddits: 3-6 subreddits where the target user hangs out (no r/ prefix).
5. suggestedAnswers: your best guess for targetAudience (a specific person, not "developers"), launchGoal, and tone. Also copy those into the top-level fields.
6. slug: "${resolved.slug}".`;

    const res = await runStructured({
      label: "ingest",
      prompt,
      schema: ProductBrief,
      model: ROLE_MODEL.ingest,
      systemPrompt: SYSTEM,
      tools: ["Read", "Glob", "Grep"],
      cwd: resolved.repoDir,
      maxTurns: 20,
      maxBudgetUsd: ROLE_BUDGET_USD.ingest,
      onEvent: handle.onEvent,
    });
    ctx.addCost("ingest", res.costUsd, res.durationMs, res.model);

    const brief = { ...res.data, slug: resolved.slug, repoUrl: res.data.repoUrl ?? resolved.repoUrl };
    const s = brief.suggestedAnswers ?? { targetAudience: brief.targetAudience, launchGoal: brief.launchGoal, tone: brief.tone };

    if (ctx.flags.yes || ctx.ui.quiet) {
      return { ...brief, targetAudience: s.targetAudience, launchGoal: s.launchGoal, tone: s.tone };
    }

    handle.done(`${brief.name}: ${brief.oneLiner}`);
    p.note(`${brief.oneLiner}\n\n${brief.whatItDoes}`, `Here is what I understood about ${brief.name}`);

    const answers = await p.group(
      {
        targetAudience: () =>
          p.text({
            message: "Who exactly is this for? (a person you could DM)",
            initialValue: s.targetAudience,
            validate: (v) => (v && v.trim().length > 3 ? undefined : "Please describe the person"),
          }),
        launchGoal: () =>
          p.select({
            message: "What does a successful launch look like?",
            initialValue: s.launchGoal,
            options: LaunchGoal.options.map((g) => ({ value: g, label: goalLabel(g) })),
          }),
        tone: () =>
          p.select({
            message: "Tone of voice",
            initialValue: s.tone,
            options: Tone.options.map((t) => ({ value: t, label: t })),
          }),
      },
      { onCancel: () => { p.cancel("Cancelled."); process.exit(130); } },
    );
    return { ...brief, targetAudience: answers.targetAudience.trim(), launchGoal: answers.launchGoal, tone: answers.tone };
  },
};

function goalLabel(g: string) {
  return (
    {
      stars: "GitHub stars / awareness",
      signups: "Signups / waitlist",
      feedback: "Honest feedback from real users",
      users: "Active users / installs",
      hiring: "Hiring / credibility",
    } as Record<string, string>
  )[g] ?? g;
}
