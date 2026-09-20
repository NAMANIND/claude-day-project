# Validation — LaunchJury

Verdict: **needs-work** (5.1/10)

Recommended positioning: LaunchJury is a CLI that reads your repo, pulls the comparable Show HN threads and how they scored, and rates your draft launch post against them before you submit it.

## One-liner clarity — 5/10
"Generates and scores launch assets for indie developers releasing a side project" has a clean noun+verb and a named audience, so a stranger can restate it. The problem is that what they restate is the exact sentence that has failed seven times in the research set. "Launch assets" is a marketing abstraction, not a thing a developer can picture, and "generates" puts you in the prompt-to-copy generator bucket before anyone reads the second sentence. The scoring/jury half — the only part that is actually unclaimed territory — is buried behind the generation half. CoLaunchly's "marketing co-pilot for devs who hate marketing" is structurally the same sentence and got 1 point, 0 comments, and a dead domain.

**Fix:** Lead with the verifiable, unusual mechanic instead of the output: "Reads your repo, pulls the comparable Show HNs that actually got traction, and scores your draft post against them before you submit." Drop the words generate, assets, and launch copy from the first sentence entirely.
> Generates and scores launch assets for indie developers releasing a side project. — file:///Users/naman/million/claude-day-project/README.md
> Show HN: CoLaunchly – A marketing co-pilot for devs who hate marketing — https://news.ycombinator.com/item?id=43544891
> Show HN: DepsGuard – One command to harden NPM/pnpm/yarn/bun/uv configs — https://news.ycombinator.com/item?id=48359478

## Audience specificity — 7/10
"A solo indie hacker who just finished building something and has never written a Show HN post" is a person you could DM, and it names the exact moment of pain — the gap between last commit and first post. That is well above the "developers" baseline. It stops short of 9 because there is no stack or artifact anchor (TypeScript repo with a README? A CLI? A weekend web app?), and because the stated audience is the segment least able to judge whether the output is good — which weakens the value claim even as it sharpens the persona.

**Fix:** Anchor the persona to an artifact and a deadline: "You have a public GitHub repo with a README, you're planning to post it Tuesday morning, and you've never written a Show HN." That single sentence makes the tool's input requirement and the trigger moment concrete.
> A solo indie hacker or side-project developer who just finished building something and has never written a Show HN post or Product Hunt launch — file:///Users/naman/million/claude-day-project/README.md

## Differentiation vs. found competitors — 6/10
The research independently confirms three genuinely unclaimed axes: nobody grounds generation in scraped comparable launches with URLs, nobody runs a multi-persona weighted jury with a deterministic gate, nobody ships a multi-channel kit in one run. That is real, and the deterministic unit-tested foreman is the kind of detail HN respects. But differentiation is scored on what the pitch communicates, not what the code does — and the current framing names no competitor, cites no thread, and leads with the one attribute (generation) that is indistinguishable from PitchGrub, founderpal, and CoLaunchly. Ten features listed flat is not a sharp axis; it reads as scope, and scope reads as LLM-wrapper.

**Fix:** Name the failure mode explicitly in the post: "Every pitch generator I found writes copy from a prompt with no idea how comparable posts actually did. This one starts by pulling the real threads — here are the seven it pulled for itself, with scores and URLs." Then show the research artifact from LaunchJury's own run as the proof.
> No competitor in this dataset does a real research step (scraping/citing actual comparable HN/PH/Reddit launches with URLs) before generating copy — every rival found is a blind prompt-to-copy generator. — file:///Users/naman/million/claude-day-project/research.json
> Consistently 1-4 points, 0-1 comments across a decade of attempts (2014-2025). Pure LLM-wrapper generators for founder-facing copy are structurally ignored by HN regardless of era or exact niche. — https://news.ycombinator.com/item?id=8260359

## Why now — 3/10
There is no why-now anywhere in the brief. Nothing stated explains why this couldn't have been built in 2021 — and "AI got good" is the generic 4-6 answer, not a 7. This is the weakest scored dimension relative to how easy it is to fix, because two real why-nows are sitting in the research and both are unused: Show HN volume went from 17,661 posts in 2024 to over 448,000 in the past year, which turns "write a decent post" from a nice-to-have into a triage problem; and running seven scoring personas in parallel over a repo for $2-4 is a 2026 price point, not a 2021 one.

**Fix:** Add one sentence with the number in it: "Show HN went from ~17k posts a year to ~448k. The post is now the bottleneck, not the build — and running seven reviewer passes over your repo costs about $3."
> In 2024, there were 17,661 Show HN posts. In the past year, there have been over 448,000 Show HN posts! — https://news.ycombinator.com/item?id=47201629
> real runs cost ~$2-4 — file:///Users/naman/million/claude-day-project/README.md

## Proof and demo-ability — 6/10
There is a real artifact — a self-contained report.html with scores, predicted top comments, and cited URLs — and that is genuinely screenshot-able in a way a tagline generator is not. The mock mode gives a zero-cost path to see it. But the demo does not speak for itself yet: "npx tsx src/cli.ts ./my-project" presumes the user already cloned the repo, the run is multi-minute and multi-stage, and the headline output is more text, which is the least persuasive possible payload for an audience that is tired of generated text. The most persuasive proof available — running LaunchJury on LaunchJury and publishing the verdict — is described nowhere.

**Fix:** Ship the dogfood artifact as the demo: publish the report.html LaunchJury generated about itself, including the scores where it failed, and link it in the first line of the post. A tool that shows its own 5/10 is the one screenshot no competitor in this set can copy.
> Output is a single self-contained report.html plus markdown assets and JSON artifacts per stage in out/<project>/. — file:///Users/naman/million/claude-day-project/README.md
> Extremely concrete, visually verifiable technical feat stated in one sentence — no adjectives, no marketing framing — https://news.ycombinator.com/item?id=23968399

## Objection coverage — 3/10
The research names four recurring objections and the brief pre-empts none of them in any customer-facing text. The most dangerous one is structural: HN is in an active backlash against AI-generated posts, and this is an AI post generator, so the launch post itself is the proof-of-concept and will be read as such by a hostile audience. The second — that this category is reliably ignored — is not acknowledged. The third, karma and self-promo history, is an account-level problem that no feature fixes. The brief's own open questions (hosted vs OSS? GitHub ingestion path? cost without a subscription?) are also unanswered, and each is a predictable top comment.

**Fix:** Put the objection in the title's shadow and answer it in the first comment: "Yes, this writes Show HN posts, and yes, HN is drowning in AI posts. I wrote this post by hand after LaunchJury scored my draft a 5 and told me why. Here's the diff between what it generated and what I posted." That single move converts the biggest liability into the most interesting thing about the launch.
> most of these posts are AI generated — https://news.ycombinator.com/item?id=47201629
> I often click on the submitter's profile and if I see very low karma, or karma only related to their own submissions, then it makes me think that they're only on HN to promote themselves. — https://news.ycombinator.com/item?id=47061947
> Imagine a friend that you're meeting up with for drinks, who has no idea what you've been working on, but is smart, curious, and asks good questions. — https://www.indiehackers.com/post/how-to-write-posts-that-do-well-on-hacker-news-607f4f48e9

## Credibility signals — 4/10
One clear verifiable signal: MIT license. A second, weaker one: a deterministic, unit-tested foreman, which is a credible engineering detail if the tests are visible. Everything else is missing — the repo URL field is literally empty in the brief, there is no named author, no users, no example runs, and critically no evidence that any post this tool produced ever performed well. For a product whose entire claim is "I can predict how your launch will land," the absence of a single scored prediction checked against a real outcome is the credibility gap that a skeptical HN reader will find in about ninety seconds.

**Fix:** Backtest and publish it: run the jury against 10-20 of the historical Show HNs already in the research set (Doom-in-QR 531, Runway 93, DepsGuard 40, CoLaunchly 1) and show the correlation between predicted score and actual points — including the misses. That is the one credibility signal nobody else in this category has ever attempted.
> Category: CLI dev tool · Language: TypeScript · License: MIT / Repo: (empty) — file:///Users/naman/million/claude-day-project/README.md
> We started with some napkin math, graduated to a complicated spreadsheet, and then tried to distill that into this rough calculator — https://news.ycombinator.com/item?id=27435377

## Ask and friction — 6/10
There is a single command, no signup, no hosted account, and a --mock path that costs nothing — all genuinely good. It falls short of the 7-10 band on friction arithmetic, not intent: "npx tsx src/cli.ts ./my-project" is not a standalone npx invocation, it requires having cloned the repo and installed deps, and a real run needs an ANTHROPIC_API_KEY plus $2-4 plus several minutes across eight stages before the reader sees anything. That is meaningfully more than two minutes to first value.

**Fix:** Make the zero-cost path the published CTA and make it a true one-liner: publish to npm so the command is `npx launchjury ./my-project --mock`, and state the real-run cost and runtime in the same breath ("real run: ~$3, ~4 min, needs ANTHROPIC_API_KEY").
> npx tsx src/cli.ts ./my-project — file:///Users/naman/million/claude-day-project/README.md
> Supports --mock/--mock-research for offline demo, --budget to cap spend (real runs cost ~$2-4). — file:///Users/naman/million/claude-day-project/README.md

## Predicted reaction
The indie hacker you're aiming at will nod at the problem — they genuinely don't know how to write a Show HN post, and the Indie Hackers threads prove they keep asking. But on launch day they won't be the ones setting the tone: HN regulars will see "generates launch copy with AI" and pattern-match it to the pitch-generator graveyard within seconds, and at least one top comment will be some version of "did the tool write this post?" If you don't answer that in the post itself, the thread dies at 3 points with one snarky reply and your actual audience never sees it; if you open with your own scored report card, the dogfooding angle is interesting enough that the same crowd will stay and argue about whether the jury's predictions hold up.

## Top risks
- Category contamination: seven adjacent products in the research (CoLaunchly, PitchGrub, founderpal, PH tagline generators) landed at 1-4 points with near-zero comments. The default reading of your one-liner is 'another one of those,' and you get about one sentence to break it.
- The recursion trap: you are launching an AI post generator into an audience actively hostile to AI-generated posts. If your Show HN reads polished, it's slop; if it reads hand-written, readers will ask why you didn't use your own tool. Only an explicit 'here's what it generated, here's what I changed, here's why' defuses both.
- Zero outcome evidence: nothing shows a LaunchJury-scored post ever performed. Without a backtest against known threads, the jury is an unfalsifiable vibe check wearing a unit test.
- Account risk, not product risk: HN buries low-karma self-promoters regardless of quality. If the submitting account has no comment history, the best post in this analysis still goes nowhere.
- Scope-as-weakness: ten features and seven personas read as LLM-wrapper breadth to the exact audience that rewards DepsGuard-style narrowness. Consider leading with Show HN only and mentioning the rest as 'also does X'.
- Unresolved product identity: the open question of hosted SaaS vs local OSS will surface as 'what's the catch / when does this get a pricing page' in the thread. Decide and state it in the post.
