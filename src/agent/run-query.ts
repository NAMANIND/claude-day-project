import { query, type AgentDefinition, type McpServerConfig, type Options } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toProgress, type ProgressEvent } from "./progress.ts";

export interface RunArgs<T> {
  label: string;
  prompt: string;
  schema: z.ZodType<T>;
  model: string;
  /** Built-in tools to expose. `[]` (default) disables all built-ins. */
  tools?: string[];
  /** Extra allowed tool names, e.g. mcp__research__hn_search. Built-ins in `tools` are allowed automatically. */
  allowedTools?: string[];
  mcpServers?: Record<string, McpServerConfig>;
  agents?: Record<string, AgentDefinition>;
  agent?: string;
  systemPrompt?: string;
  cwd?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  effort?: "low" | "medium" | "high";
  onEvent?: (e: ProgressEvent) => void;
  env?: Record<string, string>;
}

export interface RunResult<T> {
  data: T;
  costUsd: number;
  durationMs: number;
  turns: number;
  model: string;
  retried: boolean;
}

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public readonly raw?: unknown,
  ) {
    super(message);
  }
}

export function toStructuredSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7", io: "input" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** Pull the first balanced JSON object out of free text. */
export function extractJson(text: string): unknown | undefined {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [fenced?.[1], text];
  for (const c of candidates) {
    if (!c) continue;
    const start = c.indexOf("{");
    if (start < 0) continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < c.length; i++) {
      const ch = c[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(c.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  return undefined;
}

const NUDGE = `

IMPORTANT: Your final answer must be ONLY a single JSON object that matches the required schema exactly. No prose before or after. Leave optional fields out rather than inventing values.`;

export async function runStructured<T>(args: RunArgs<T>): Promise<RunResult<T>> {
  const started = Date.now();
  let totalCost = 0;
  let turns = 0;

  const attempt = async (prompt: string) => {
    const tools = args.tools ?? [];
    const options: Options = {
      model: args.model,
      tools,
      allowedTools: [...tools, ...(args.allowedTools ?? [])],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      settingSources: [],
      maxTurns: args.maxTurns ?? 12,
      maxBudgetUsd: args.maxBudgetUsd,
      outputFormat: { type: "json_schema", schema: toStructuredSchema(args.schema) },
      forwardSubagentText: true,
      persistSession: false,
      ...(args.systemPrompt ? { systemPrompt: args.systemPrompt } : {}),
      ...(args.cwd ? { cwd: args.cwd } : {}),
      ...(args.mcpServers ? { mcpServers: args.mcpServers } : {}),
      ...(args.agents ? { agents: args.agents } : {}),
      ...(args.agent ? { agent: args.agent } : {}),
      ...(args.effort ? { effort: args.effort } : {}),
      ...(args.env ? { env: { ...process.env, ...args.env } as Record<string, string> } : {}),
    };

    let structured: unknown;
    let resultText = "";
    let subtype = "unknown";
    for await (const msg of query({ prompt, options })) {
      for (const ev of toProgress(msg)) args.onEvent?.(ev);
      if (msg.type === "result") {
        totalCost += msg.total_cost_usd ?? 0;
        turns += msg.num_turns;
        subtype = msg.subtype;
        if (msg.subtype === "success") {
          structured = msg.structured_output;
          resultText = msg.result;
        } else if ("result" in msg && typeof (msg as { result?: unknown }).result === "string") {
          resultText = (msg as { result: string }).result;
        }
      }
    }
    return { structured, resultText, subtype };
  };

  const tryParse = (raw: unknown): T | undefined => {
    if (raw === undefined || raw === null) return undefined;
    const parsed = args.schema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };

  let retried = false;
  let last = await attempt(args.prompt);
  let data = tryParse(last.structured) ?? tryParse(extractJson(last.resultText));

  if (!data && last.subtype !== "error_max_budget_usd") {
    retried = true;
    args.onEvent?.({ kind: "status", text: "output did not match schema, retrying once" });
    last = await attempt(args.prompt + NUDGE);
    data = tryParse(last.structured) ?? tryParse(extractJson(last.resultText));
  }

  if (!data) {
    const issues = last.structured ? args.schema.safeParse(last.structured).error?.issues.slice(0, 3) : undefined;
    throw new StructuredOutputError(
      `${args.label}: no valid structured output (subtype=${last.subtype}${issues ? `, issues=${JSON.stringify(issues)}` : ""})`,
      last.structured ?? last.resultText,
    );
  }

  return { data, costUsd: totalCost, durationMs: Date.now() - started, turns, model: args.model, retried };
}
