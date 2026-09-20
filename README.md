# LaunchJury

**A jury of launch specialists for the side project you never got around to marketing.**

You built something interesting. Then it sat there, because writing a Show HN post, a Product Hunt tagline, a demo video script, and figuring out *where* to post it all felt like a second project. LaunchJury does that second project.

Point it at a repo. It reads the code, researches how similar products were received on Hacker News, Reddit, Product Hunt and Indie Hackers, validates your positioning against eight launch principles, drafts every launch asset, and then puts the drafts in front of a **jury of seven specialist personas** who score them, predict the top comment your audience will leave, and send them back for revision until they pass.

```
npx tsx src/cli.ts ./my-project
```

## What you get

Everything lands in `out/<project>/`:

- **`report.html`** — a single self-contained page: validation scorecard, research with real quotes and links, jury verdicts per persona with predicted reactions, revision history, distribution plan, and every asset with a copy button.
- **Launch assets** (`assets/*.md`) — Show HN title + post + your first comment, Product Hunt tagline + description + maker comment, an X thread, per-subreddit Reddit posts, a LinkedIn post, a scene-by-scene **demo video script** with a shot list, and a 60-90s **launch video script**.
- **`distribution.md`** — ranked channels with evidence for why that audience is there, what to post where, best day and time, who to tag, rules to respect, and a day-by-day launch sequence.
- **`validation.md`** and **`jury.md`** — the reasoning behind every score.
- One JSON artifact per stage, so you can re-run any part with `--from <stage>`.

## The jury

| Juror | Judges | Weight |
|---|---|---|
| 🟠 Hacker News veteran | Show HN title, post, first comment | 1.2 |
| 🐱 Product Hunt launch coach | tagline, description, maker comment, launch video | 1.0 |
| 👮 Reddit community moderator | each subreddit post for rule fit and value-first framing | 1.0 |
| 🐦 X growth marketer | thread hook, structure, LinkedIn variant | 0.8 |
| ✍️ Developer-tools copywriter | positioning consistency and adjective abuse across all posts | 1.0 |
| 🎬 Demo video director | recordability, pacing, hook-in-5-seconds | 1.0 |
| 🤨 Skeptical target user | "would I install this today?" across everything | 1.2 |

Each juror returns a structured verdict: a score per asset, a predicted top comment written in the audience's voice, the strongest objection, and up to three must-fix edits. A deterministic foreman aggregates by weight. Drafts pass when the weighted overall is at least 7.5 and no single asset is below 6. Otherwise a reviser applies the must-fixes and the jury sits again (two rounds by default).

## Pipeline

```
resolve → ingest → research → validate → distribute ‖ draft → jury (×2) → report
```

| Stage | What happens | Model |
|---|---|---|
| ingest | Reads README, manifests, and key source files; asks you three questions (audience, goal, tone) | Sonnet |
| research | Deterministic prefetch from the Hacker News Algolia API and Reddit, then an analyst agent with web search and follow-up tools extracts praise, objections, winning titles, and communities, every quote with a URL | Sonnet |
| validate | Scores eight weighted principles (one-liner clarity, audience specificity, differentiation vs. found competitors, why now, proof, objection coverage, credibility, ask & friction) with evidence and a fix each | Opus |
| distribute | Ranks channels, times, tags, and a launch-week sequence, grounded in the research | Sonnet |
| draft | Writes posts and video scripts in parallel | Opus |
| jury | Seven parallel jurors, foreman, reviser, repeat | Sonnet / Opus |
| report | Renders the HTML and markdown | — |

A full run costs roughly $2-4 and takes 6-10 minutes. Cost per stage is printed at the end.

## Install

Requires Node 20+ and either a Claude Code login or `ANTHROPIC_API_KEY`.

```bash
git clone <this repo> && cd launchjury
npm install
npx tsx src/cli.ts <repo-path-or-github-url>
```

Options:

```
--from <stage>      resume from a stage using artifacts on disk
--to <stage>        stop after a stage
--yes               accept the agent's suggested answers (non-interactive)
--mock              replay a recorded run offline (demo mode)
--mock-research     use recorded HN/Reddit data instead of live fetches
--budget <usd>      abort if estimated spend exceeds this (default 6)
--rounds <n>        max jury rounds (default 2)
--concurrency <n>   parallel jurors (default 4)
--open              open report.html when done
```

## How it is built

TypeScript on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk). Every LLM stage is one `query()` call with a JSON-schema `outputFormat`, validated with zod, and written to disk before the next stage starts. Research fetchers are plain TypeScript exposed to the analyst as in-process MCP tools. Agents get read-only tools only and never see your `CLAUDE.md`. The foreman is pure TypeScript with unit tests, so scoring is reproducible. The report is one HTML file with no external requests.

Built for Claude Day. Not done yet: rendering the videos, fetching subreddit rules automatically, and letting you argue with a juror.

## License

MIT
