export interface Principle {
  id: string;
  name: string;
  weight: number;
  question: string;
  anchors: { low: string; mid: string; high: string };
}

export const PRINCIPLES: Principle[] = [
  {
    id: "one-liner",
    name: "One-liner clarity",
    weight: 1.5,
    question: "Can a stranger restate what it does and for whom after one sentence?",
    anchors: {
      low: "Jargon, 'AI-powered platform', no audience.",
      mid: "Clear noun and verb but vague audience or benefit.",
      high: "Noun + verb + specific audience, concrete outcome, zero filler.",
    },
  },
  {
    id: "audience",
    name: "Audience specificity",
    weight: 1.0,
    question: "Is the target user a person you could DM, not 'developers'?",
    anchors: {
      low: "'Everyone' or 'developers'.",
      mid: "A role, but no stack or moment of pain.",
      high: "Role + stack + the exact moment they feel the pain.",
    },
  },
  {
    id: "differentiation",
    name: "Differentiation vs. found competitors",
    weight: 1.5,
    question: "Against the adjacent products found in research, what is the one thing only this does or does 10x better?",
    anchors: {
      low: "Indistinguishable from products people already complained about.",
      mid: "Some differences but no crisp axis.",
      high: "Named competitors, one sharp axis, backed by their own comment threads.",
    },
  },
  {
    id: "why-now",
    name: "Why now",
    weight: 0.8,
    question: "What changed (tech, platform, price, regulation) that makes this possible or urgent today?",
    anchors: {
      low: "No reason this couldn't have existed five years ago.",
      mid: "Generic 'AI is hot'.",
      high: "A specific enabling change, stated plainly.",
    },
  },
  {
    id: "proof",
    name: "Proof and demo-ability",
    weight: 1.2,
    question: "Can the core value be shown in a 10-second clip or a copy-pasteable command?",
    anchors: {
      low: "Needs a paragraph of setup to understand.",
      mid: "Showable, but needs narration.",
      high: "One command or one before/after that speaks for itself.",
    },
  },
  {
    id: "objections",
    name: "Objection coverage",
    weight: 1.2,
    question: "Are the top 3 objections seen in research on similar launches pre-empted?",
    anchors: {
      low: "Walks straight into the known objections.",
      mid: "Addresses one of them.",
      high: "Names and answers the top objections before the audience raises them.",
    },
  },
  {
    id: "credibility",
    name: "Credibility signals",
    weight: 0.8,
    question: "License, maintenance, author, benchmarks, who already uses it?",
    anchors: {
      low: "Anonymous, no license, no proof.",
      mid: "One verifiable signal.",
      high: "Two or more verifiable signals visible in the post.",
    },
  },
  {
    id: "ask",
    name: "Ask and friction",
    weight: 1.0,
    question: "Is it obvious what the reader should do next, and can they do it in under 2 minutes?",
    anchors: {
      low: "No CTA, or signup wall before value.",
      mid: "CTA present but multi-step.",
      high: "Single CTA per channel with a zero-signup path.",
    },
  },
];

export function principlesAsMarkdown(): string {
  return PRINCIPLES.map(
    (p) =>
      `### ${p.id} — ${p.name} (weight ${p.weight})\n${p.question}\n- 0-3: ${p.anchors.low}\n- 4-6: ${p.anchors.mid}\n- 7-10: ${p.anchors.high}`,
  ).join("\n\n");
}

export function weightedOverall(scores: { principleId: string; score: number }[]): number {
  let num = 0;
  let den = 0;
  for (const p of PRINCIPLES) {
    const s = scores.find((x) => x.principleId === p.id);
    if (!s) continue;
    num += s.score * p.weight;
    den += p.weight;
  }
  return den ? Math.round((num / den) * 10) / 10 : 0;
}

export function verdictFor(overall: number): "ready" | "needs-work" | "rethink-positioning" {
  if (overall >= 7.5) return "ready";
  if (overall >= 5) return "needs-work";
  return "rethink-positioning";
}
