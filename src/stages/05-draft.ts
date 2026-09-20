import type { Stage } from "../pipeline/stage.ts";
import { runStructured } from "../agent/run-query.ts";
import { ROLE_BUDGET_USD, ROLE_MODEL } from "../agent/models.ts";
import { Assets, Posts, Videos } from "../schemas/assets.ts";
import type { ProductBrief } from "../schemas/brief.ts";
import type { ResearchFindings } from "../schemas/research.ts";
import type { ValidationReport } from "../schemas/validation.ts";
import { briefDigest, researchDigest } from "./03-validate.ts";

const POSTS_SYSTEM = `You write launch posts for developer and indie products. You write like a builder talking to peers: concrete nouns, short sentences, no unearned adjectives ('blazing', 'seamless', 'powerful', 'revolutionary' are banned), no 'excited to announce'. Each platform gets a native post, not a copy-paste. You pre-empt known objections instead of hoping nobody notices.`;

const VIDEO_SYSTEM = `You write demo and launch video scripts for developer tools that one person can record with a screen recorder in an afternoon. The result appears before the setup. Every scene has an on-screen action, voice-over under 150 words per minute, optional on-screen text, a duration, and a precise recordable shot. No cinematic nonsense.`;

export function launchContext(brief: ProductBrief, research: ResearchFindings, validation: ValidationReport): string {
  return `# Product
${briefDigest(brief)}

# Positioning to use
${validation.recommendedPositioning}

# Validation fixes to apply
${validation.scores.filter((s) => s.score < 8).map((s) => `- ${s.principleId} (${s.score}/10): ${s.fix}`).join("\n")}

# What the market says
${researchDigest(research, 9_000)}`;
}

export const draftStage: Stage<Assets> = {
  name: "draft",
  label: "Draft launch assets",
  key: "assets-v1",
  schema: Assets,
  parallelGroup: "A",
  async run(ctx, handle) {
    const brief = ctx.get<ProductBrief>("brief");
    const research = ctx.get<ResearchFindings>("research");
    const validation = ctx.get<ValidationReport>("validation");
    const context = launchContext(brief, research, validation);

    const postsPrompt = `${context}

Write the launch posts. Tone: ${brief.tone}. Launch goal: ${brief.launchGoal}.

- showHn.title: starts with "Show HN:", factual, under 80 characters, no superlatives. Body: what it does, why you built it, how it is built (stack + one interesting decision), what is not done yet, license. authorFirstComment: invites technical critique and offers a detail worth discussing; pre-empts the top objection from research.
- productHunt: tagline under 60 chars and benefit-led; description scannable; firstComment is the maker's origin story in first person ending with a question; topics: up to 3.
- xThread: 3-8 tweets, each under 280 chars. Tweet 1 stops the scroll with a result or a contrarian claim. One idea per tweet. Link only in the last tweet. tagSuggestions: types of accounts or communities to tag (no invented handles).
- reddit: 1-3 posts, each for a specific subreddit from: ${brief.candidateSubreddits.join(", ") || "your best judgement"}. Value-first (a lesson, a comparison, a question), discloses you are the author, native to that sub's style.
- linkedin: personal story, short lines, no hashtag soup; says the link is in the first comment.`;

    const videosPrompt = `${context}

Write two scripts.

- demoVideo: 60-120 seconds total. Scene 1 (under 5s) shows the end result. Then setup, the core flow, one 'wow' detail, and a CTA. Each scene: onScreenAction, voiceOver, onScreenText (optional), durationSec, shot (screen region, zoom, cursor, terminal font size). shotList: every distinct recording needed. recordingNotes: resolution, font sizes, cursor settings, what to hide.
- launchVideo: 60-90 seconds, hook-driven narrative for Product Hunt / X: the pain in one line, the product doing the thing by second 10, who it is for, why now, one credibility signal, CTA. hook: the first line spoken or shown. cta: the last line.`;

    let finished = 0;
    const tick = (name: string) => {
      finished++;
      handle.message(`${finished}/2 drafts done (${name})`);
    };

    const [posts, videos] = await Promise.all([
      runStructured({
        label: "draft:posts",
        prompt: postsPrompt,
        schema: Posts,
        model: ROLE_MODEL.draft,
        systemPrompt: POSTS_SYSTEM,
        maxTurns: 3,
        maxBudgetUsd: ROLE_BUDGET_USD.draft,
        onEvent: handle.onEvent,
      }).then((r) => (tick("posts"), r)),
      runStructured({
        label: "draft:videos",
        prompt: videosPrompt,
        schema: Videos,
        model: ROLE_MODEL.draft,
        systemPrompt: VIDEO_SYSTEM,
        maxTurns: 3,
        maxBudgetUsd: ROLE_BUDGET_USD.draft,
        onEvent: handle.onEvent,
      }).then((r) => (tick("videos"), r)),
    ]);
    ctx.addCost("draft", posts.costUsd + videos.costUsd, Math.max(posts.durationMs, videos.durationMs), posts.model);

    return { version: 1, ...posts.data, ...videos.data };
  },
};
