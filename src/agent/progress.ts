import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export type ProgressEvent =
  | { kind: "tool"; name: string; summary: string; subagent?: boolean }
  | { kind: "subagent"; name: string; description: string }
  | { kind: "text"; text: string; subagent?: boolean }
  | { kind: "result"; costUsd: number; turns: number; ok: boolean; subtype: string }
  | { kind: "status"; text: string };

function short(s: unknown, n = 60): string {
  const str = typeof s === "string" ? s : JSON.stringify(s);
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function summarizeToolInput(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Read":
      return short(String(input.file_path ?? "").split("/").slice(-2).join("/"));
    case "Glob":
    case "Grep":
      return short(input.pattern);
    case "WebSearch":
      return `"${short(input.query, 50)}"`;
    case "WebFetch":
      return short(input.url, 70);
    case "Agent":
    case "Task":
      return short(input.subagent_type ?? input.description, 50);
    default: {
      if (name.startsWith("mcp__")) {
        const tool = name.split("__").slice(2).join("__");
        const firstArg = Object.values(input)[0];
        return `${tool} ${firstArg !== undefined ? `"${short(firstArg, 45)}"` : ""}`.trim();
      }
      return short(input, 50);
    }
  }
}

export function toProgress(msg: SDKMessage): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  if (msg.type === "assistant") {
    const sub = msg.parent_tool_use_id != null;
    for (const block of msg.message.content ?? []) {
      if (block.type === "tool_use") {
        const input = (block.input ?? {}) as Record<string, unknown>;
        if (block.name === "StructuredOutput") {
          events.push({ kind: "status", text: "writing structured output" });
        } else if (block.name === "Agent" || block.name === "Task") {
          events.push({
            kind: "subagent",
            name: String(input.subagent_type ?? "agent"),
            description: String(input.description ?? ""),
          });
        } else {
          events.push({ kind: "tool", name: block.name, summary: summarizeToolInput(block.name, input), subagent: sub });
        }
      } else if (block.type === "text" && block.text.trim()) {
        events.push({ kind: "text", text: block.text.trim(), subagent: sub });
      }
    }
  } else if (msg.type === "result") {
    events.push({
      kind: "result",
      costUsd: msg.total_cost_usd ?? 0,
      turns: msg.num_turns,
      ok: msg.subtype === "success",
      subtype: msg.subtype,
    });
  }
  return events;
}
