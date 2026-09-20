import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { personasAsAgentDefinitions, personaByName, personaSystemPrompt } from "../src/jury/personas.ts";
import { toStructuredSchema } from "../src/agent/run-query.ts";

const S = z.object({ title: z.string(), score: z.number().int().min(1).max(10) });
const prompt = "Judge this Show HN title only: 'Show HN: Revolutionary AI-powered platform!!!'. Return title (your rewrite) and score.";
const base = { model: "sonnet", tools: [] as string[], permissionMode: "bypassPermissions" as const, allowDangerouslySkipPermissions: true, settingSources: [] as never[], maxTurns: 2, outputFormat: { type: "json_schema" as const, schema: toStructuredSchema(S) }, persistSession: false };

async function run(label: string, options: Record<string, unknown>) {
  const t = Date.now();
  for await (const m of query({ prompt, options: { ...base, ...options } as never })) {
    if (m.type === "assistant") for (const b of m.message.content) console.log(`  [${label}] block`, b.type, b.type === "tool_use" ? b.name : b.type === "text" ? b.text.slice(0, 80) : "");
    if (m.type === "result") console.log(`  [${label}] result`, m.subtype, "structured:", JSON.stringify((m as { structured_output?: unknown }).structured_output), "text:", ("result" in m ? m.result : "").slice(0, 100), `${Date.now() - t}ms`);
  }
}
await run("agent", { agents: personasAsAgentDefinitions("sonnet"), agent: "hn-veteran" });
await run("sysprompt", { systemPrompt: personaSystemPrompt(personaByName("hn-veteran")) });
