# LinkedIn post — LaunchJury (v1)

I spent five weeks building a side project and two days staring at an empty title field.

The build had tests, types, CI. The launch post had nothing. No way to tell whether the sentence I'd written was good or just familiar.

Meanwhile the evidence was sitting in public. Every comparable launch of the last ten years, with its exact score, its exact comments, and whether anyone cared. One API call away.

So I wrote a CLI that goes and gets those threads before it writes a word.

It reads the repo. It pulls the comparable launches with their real numbers. It drafts the posts. Then seven scoring personas rate every draft, predict the top comment it would get, and list what has to change. A plain TypeScript function - no model, unit tested - aggregates the scores and decides pass or fail.

Then I pointed it at itself.

It gave my draft a 5 out of 10.

It predicted the top comment would be "another LLM wrapper that writes marketing copy."

It was right. I rewrote the post by hand from its notes, and published the failing report alongside the repo.

That's the part I keep thinking about. The copy it generated was fine and forgettable. The score and the predicted comment were the thing worth $3.

Most of us edit our own writing by reading it again. That mostly measures how familiar it has become.

MIT licensed. Free offline mode. Link in the first comment.
