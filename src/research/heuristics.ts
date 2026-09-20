/** Posting heuristics inlined into the distribution prompt. Kept as data so the report can cite them. */
export const POSTING_HEURISTICS = [
  { channel: "Show HN", day: "Tue-Thu", time: "07:00-09:00 PT", why: "Front page turnover is slowest early US morning; weekend posts get fewer votes. One shot only; re-posts get flagged." },
  { channel: "Product Hunt", day: "Tue-Wed (Sun for less competition)", time: "00:01 PT launch", why: "Full 24h voting window; weekdays have more traffic but more competition. Line up 10-20 supporters beforehand; never ask for upvotes publicly." },
  { channel: "Reddit (niche subs)", day: "Mon-Thu", time: "06:00-09:00 ET", why: "Mods are active, US and EU both awake. Read each sub's self-promotion rule; lead with a lesson or question, not a link." },
  { channel: "X / Twitter", day: "Tue-Thu", time: "09:00-11:00 ET", why: "First 30 min of engagement decides reach. Post the thread, then reply to every comment for an hour. Link goes in the last tweet." },
  { channel: "LinkedIn", day: "Tue-Wed", time: "08:00-10:00 local", why: "Professional audience reads before meetings. Native text beats links; put the link in the first comment." },
  { channel: "Indie Hackers", day: "Any weekday", time: "morning ET", why: "Small, forgiving audience; good for a build-in-public story a few days before HN/PH." },
  { channel: "Dev newsletters / Discords", day: "Week after launch", time: "n/a", why: "Second wave: pitch curators once you have a launch story and early numbers." },
];

export function heuristicsAsMarkdown(): string {
  return POSTING_HEURISTICS.map((h) => `- **${h.channel}** — ${h.day}, ${h.time}. ${h.why}`).join("\n");
}
