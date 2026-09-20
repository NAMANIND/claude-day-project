# Product Hunt launch — LaunchJury (v1)

Tagline: Know how your launch post will land before you post it
Topics: Developer Tools, Artificial Intelligence, Marketing

LaunchJury is an MIT-licensed CLI for the developer who just finished a side project and has never written a Show HN or a Product Hunt launch.

Point it at a repo:
npx launchjury ./my-project --mock

What happens:

1. Reads your README, manifests and source, so the copy describes the product you actually built.
2. Pulls real comparable launches from Hacker News and Reddit - titles, point counts, comment counts, URLs.
3. Scores your positioning against eight principles: clarity, audience, differentiation, why-now, proof, objections, credibility, ask.
4. Drafts the full kit: Show HN post and first comment, PH tagline/description/maker comment, X thread, LinkedIn post, per-subreddit Reddit posts, demo and launch video scripts.
5. Seven weighted AI jurors score every asset, predict the top comment it would get, and list must-fix edits.
6. A deterministic, unit-tested foreman aggregates the scores and gates pass/fail. Fail, and a reviser rewrites and re-runs the jury.

Out the back: one self-contained report.html with copy buttons, plus markdown assets and per-stage JSON you can resume from.

Honest bits: --mock is free and offline. A real run is about $3 and 4 minutes with an ANTHROPIC_API_KEY. It scored its own first draft a 5 out of 10, and that report is published in the repo.

--- Maker comment ---
I spent five weeks on a side project and then sat looking at an empty Show HN title field for two days.

The advice I found was all vibes - "be concrete," "don't sound like marketing" - with nothing to check my draft against. Meanwhile the data was sitting right there: every comparable launch of the last decade, with its exact score and its exact comments, one API call away. So I wrote the thing that goes and gets those threads first, and only then writes anything.

The part that changed my mind about it was when I ran it on itself. It gave my draft a 5, predicted the top comment would be "another LLM wrapper that writes marketing copy," and listed the reasons. I rewrote the post by hand from that feedback. The generated draft and the rewrite are both in the repo so you can read the diff.

I genuinely do not know whether the useful product here is the generated copy or the score. Which one would you actually use?
