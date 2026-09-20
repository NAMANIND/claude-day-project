import { z } from "zod";
import { runStructured } from "../src/agent/run-query.ts";
import { personasAsAgentDefinitions } from "../src/jury/personas.ts";

const S = z.object({ title: z.string(), score: z.number().int().min(1).max(10), tags: z.array(z.string()).default([]) });

const a = await runStructured({
  label: "smoke-plain",
  prompt: "Rate the Show HN title 'Show HN: Revolutionary AI-powered platform!!!' — return title (a better rewrite), score, tags.",
  schema: S,
  model: "sonnet",
  maxTurns: 2,
  maxBudgetUsd: 0.2,
  onEvent: (e) => console.log("  ev", e.kind, "summary" in e ? e.summary : "text" in e ? e.text.slice(0, 40) : ""),
});
console.log("PLAIN", JSON.stringify(a.data), `$${a.costUsd.toFixed(3)}`, `${a.durationMs}ms`, a.retried ? "RETRIED" : "");

const b = await runStructured({
  label: "smoke-agent",
  prompt: "Judge this Show HN title only: 'Show HN: Revolutionary AI-powered platform!!!'. Return title (your rewrite), score, tags (which rubric items it violates).",
  schema: S,
  model: "sonnet",
  agents: personasAsAgentDefinitions("sonnet"),
  agent: "hn-veteran",
  maxTurns: 2,
  maxBudgetUsd: 0.2,
});
console.log("AGENT", JSON.stringify(b.data), `$${b.costUsd.toFixed(3)}`, `${b.durationMs}ms`, b.retried ? "RETRIED" : "");
