# Reddit posts — LaunchJury (v1)

### r/SideProject [Sharing my project]
Title: I made an AI score my launch post. It gave me a 5/10 and it was right. Here's what it flagged.

I built the tool, so treat this as an author post - but the useful part here is the feedback, not the tool.

I finished a side project and froze on the Show HN title for two days. So I wrote a CLI that pulls comparable launches off the HN Algolia API and Reddit (real titles, real point counts, real URLs), drafts a launch post, and then has seven scoring personas rate it and predict the top comment it would get.

Then I pointed it at itself. It gave my draft a 5/10. The four things it flagged apply to basically every launch post I see in this sub:

1. **You led with the output, not the mechanic.** "Generates launch assets" tells me nothing. "Reads your repo and pulls the comparable threads that actually got traction" is a thing I can verify. Lead with the weird part.
2. **No proof, only claims.** Every adjective in my draft was unearned. The fix was publishing the report where my own tool scored me a 5, including the failing rows.
3. **The objection wasn't named.** Mine was obvious - an AI generator launching into a community that's sick of AI generators. The predicted top comment was "another LLM wrapper that writes marketing copy." Naming it yourself in paragraph two is free; letting someone else name it in the comments is not.
4. **No why-now.** "~17,661 Show HN posts in 2024, over 448,000 in the past year" did more work than three paragraphs of value prop.

The one that stung: I looked up the closest existing product to mine. Same pitch, 1 point, 0 comments, and its domain now redirects to a spam site. Reading your own category's graveyard before you write is the single highest-leverage hour I've spent on a launch.

Free offline replay if you want to run it on your own repo: `npx launchjury ./my-project --mock`. Real run is about $3 and 4 minutes on an API key. MIT.

What's the harshest accurate thing anyone has said about your launch post?

### r/IndieHackers [Technical]
Title: I backtested launch-post scoring against 18 old Show HNs. It worked at the extremes and failed in the middle.

Disclosure: this came out of a tool I built and open-sourced, but I want to talk about the backtest, because the result is more interesting than the tool.

Premise: if an AI panel can predict how a launch post will do, it should be able to score posts whose outcomes are already known. So I took 18 historical Show HN threads with their real point counts, stripped the scores, and ran a seven-persona jury blind over each title and body.

What happened:

- It correctly put the extremes in the right order. "I made a Doom-like game fit inside a QR code" (531 points) scored high. "A marketing co-pilot for devs who hate marketing" (1 point, 0 comments, domain now redirecting to spam) scored low.
- It was close to useless in the middle. Anything in the 20-100 point band it graded more or less at random. Which makes sense - the difference between 30 points and 90 points is usually timing, front-page luck and who showed up, not the prose.
- n=18, one category, scores known to me while building the rubric. That is a smoke test, not evidence, and I would not defend it harder than that.

The practical takeaway for anyone launching: copy quality appears to set a floor, not a ceiling. You can write yourself out of a launch, but you probably can't write yourself into the front page. Which argues for spending your effort on (a) not sounding like marketing and (b) being present in the comments for eight hours, rather than on the tenth revision of your tagline.

The second takeaway is cheaper: before writing anything, go read every comparable launch in your category including the dead ones. The 1-point corpses taught me more than the 500-point hit.

Tool is MIT, offline mock mode is free (`npx launchjury ./my-project --mock`), real run ~$3. Happy to share the raw backtest output if anyone wants to pick holes in the methodology - I'd rather find out it's wrong now.
