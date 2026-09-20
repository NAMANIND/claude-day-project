# Show HN post — LaunchJury (v1)

Title: Show HN: LaunchJury - reads your repo, scores your draft vs. real Show HNs

LaunchJury is a CLI. You point it at a repo:

npx launchjury ./my-project --mock

It reads the README, the manifests and enough source to say what the project actually is. Then it hits the HN Algolia API and Reddit for comparable launches - same category, same shape - and pulls their titles, point counts, comment counts and URLs. Then it drafts a Show HN post, a Product Hunt listing, an X thread, a LinkedIn post and per-subreddit Reddit posts. Then seven juror personas (HN veteran, PH coach, Reddit mod, growth marketer, dev-tools copywriter, demo director, skeptical target user) score every asset 1-10, predict the top comment it would get, and list must-fix edits. A foreman - plain TypeScript, unit tested, no model in the loop - aggregates the weighted scores and gates: weighted average >= 7.5, nothing below 6. Fail, and a reviser rewrites and the jury runs again, up to 2 rounds. Output is out/<project>/report.html, self-contained, no external requests.

Why I built it: in 2024 there were about 17,661 Show HN posts. In the past year there have been over 448,000. The post is now the bottleneck, not the build, and I had no idea how to write one.

The obvious objection, up front: yes, this is an AI generator for Show HN posts, and yes, HN is drowning in AI-written posts. I did not post what it generated. I ran LaunchJury on itself, it scored my own draft a 5, and the jury told me why: the mechanic was buried under the output, there was no proof, and the skeptical-user juror predicted the top comment would be "another LLM wrapper that writes marketing copy." I rewrote this post by hand from those notes. The generated draft and this post are both in examples/launchjury/ so you can read the diff, along with the report.html it wrote about itself, failing scores included.

I also ran the jury blind against 18 historical Show HNs whose real point counts I already knew (Doom-in-a-QR-code 531, Runway 93, DepsGuard 40, CoLaunchly 1, and 14 others). It separated the top few from the bottom few and was close to useless in the middle. n=18, one category, so treat it as a smoke test, not evidence. Script and raw output are in scripts/backtest.ts if you want to argue with the methodology - I would like someone to.

How it is built: TypeScript on the Claude Agent SDK. Eight stages - resolve, ingest, research, validate, distribute, draft, jury, report. Each LLM stage is one query() call with a zod-validated JSON schema output, and every stage writes its artifact to disk, so --from jury resumes without re-paying for research. One decision worth mentioning: research is deliberately split in half. The HN Algolia and Reddit fetches are deterministic code, so the numbers are real and identical between runs; only the interpretation is a model, and it has to cite a URL for anything it claims. The scoring gate is the same idea - the jurors are models, but the aggregation and the pass/fail threshold are pure functions with unit tests, so a run is reproducible even when the prose is not. Agents run read-only and sandboxed; they never read your CLAUDE.md.

Not done yet: GitHub URL ingestion does a shallow clone to a temp dir with no auth, so private repos are local-path only. The Reddit prefetch is unauthenticated JSON and gets rate-limited if you run it repeatedly. English only. The juror weights are hand-set numbers I guessed and have not tuned against anything. The video scripts are the weakest output by a distance - they read like a template and I would cut them if nobody uses them.

Cost: --mock is free and replays a recorded run end to end, which is the honest way to evaluate it. A real run is about $3 and about 4 minutes against an ANTHROPIC_API_KEY, and --budget hard-caps the spend. MIT.

--- Author's first comment ---
Author here. The part I would most like torn apart is the foreman, because it is the only piece that is supposed to be trustworthy.

The jurors are models and their prose is noise. So the aggregation is deliberately not: src/jury/foreman.ts is about 120 lines of TypeScript with no model call, it takes seven score vectors and fixed weights, and it returns pass/fail. Same inputs, same verdict, every time. The weights are the weak point - I picked them by hand (HN veteran and skeptical-target-user weigh heaviest for a dev tool, PH coach weighs least) and I have no principled defence of those numbers beyond "they matched my intuitions on 18 old threads." If someone has a better way to calibrate persona weights against known outcomes, that is the thing I actually want to talk about.

Second, pre-empting the top comment, which the tool itself predicted: "another LLM wrapper that writes marketing copy." That is fair, and the record backs it up - the closest analog I found in the research, CoLaunchly, got 1 point and 0 comments and its domain now redirects to spam. The research artifact LaunchJury produced for its own launch lists seven of those corpses with scores and URLs; it is in examples/launchjury/research.json. The only reason I think this one is different is the direction of the arrow: it starts by pulling what actually happened to comparable posts, and its most useful output for me was not the copy, it was a 5/10 and a list of reasons. If you run it and it just hands you confident slop, tell me and paste the report - that is the failure mode I most want to see.

I will be here all day and will reply to everything, including bug reports.
