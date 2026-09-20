# X / Twitter thread — LaunchJury (v1)

1/ Show HN posts went from ~17,661 in 2024 to over 448,000 in the past year.

The post is the bottleneck now, not the build.

So I wrote a CLI that reads my repo, pulls the comparable Show HN threads with their real scores, and grades my draft against them before I submit.

2/ Every launch-copy generator I found writes from a prompt with no idea how comparable posts actually did.

LaunchJury starts the other way round: deterministic HN Algolia + Reddit fetch first. Real titles, real point counts, real URLs. The model only gets to interpret them.

3/ Then seven juror personas score the draft 1-10 - HN veteran, Reddit mod, PH coach, skeptical target user, and three more.

Each one also predicts the top comment your post would get. That prediction was more useful to me than any of the copy it wrote.

4/ The aggregation is not a model.

src/jury/foreman.ts is ~120 lines of plain TypeScript with unit tests. Fixed weights, pass gate at 7.5 average with nothing below 6. Same inputs, same verdict, every time. The prose is stochastic; the grade isn't.

5/ I ran it on itself. It scored my draft a 5 and predicted the top comment: "another LLM wrapper that writes marketing copy."

Fair. I rewrote the post by hand from its notes. The 5/10 report and the diff between its draft and mine are both published in the repo.

6/ Backtest, including the misses: jury run blind over 18 historical Show HNs with known scores (Doom-in-a-QR-code 531 ... CoLaunchly 1).

It separated the top from the bottom and was useless in the middle. n=18. Smoke test, not evidence. Script is in the repo.

7/ Free offline replay:
npx launchjury ./my-project --mock

Real run: ~$3, ~4 min, needs ANTHROPIC_API_KEY, --budget caps it. MIT, read-only agents, self-contained HTML report with no external requests.

Repo + the report it wrote about itself:

Tag: indie hacker and build-in-public accounts, dev tool founders who have run a Show HN, Claude Agent SDK / Anthropic developer community, technical writing and devrel accounts, Hacker News watchers and launch-analysis accounts
