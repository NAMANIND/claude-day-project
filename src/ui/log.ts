import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ProgressEvent } from "../agent/progress.ts";

export interface StageHandle {
  message(text: string): void;
  done(text?: string): void;
  fail(text: string): void;
  onEvent(e: ProgressEvent): void;
}

const money = (usd: number) => `$${usd.toFixed(2)}`;
const secs = (ms: number) => `${(ms / 1000).toFixed(0)}s`;

export interface Ui {
  intro(title: string): void;
  outro(text: string): void;
  stage(index: number, label: string): StageHandle;
  step(text: string): void;
  info(text: string): void;
  warn(text: string): void;
  error(text: string): void;
  note(text: string, title?: string): void;
  costTable(rows: Array<{ stage: string; usd: number; ms: number; model?: string }>): void;
  quiet: boolean;
}

export function createUi(opts: { quiet?: boolean } = {}): Ui {
  const quiet = opts.quiet ?? false;
  return {
    quiet,
    intro(title) {
      if (!quiet) p.intro(pc.bgCyan(pc.black(` ${title} `)));
    },
    outro(text) {
      if (!quiet) p.outro(text);
    },
    step: (t) => !quiet && p.log.step(t),
    info: (t) => !quiet && p.log.info(t),
    warn: (t) => !quiet && p.log.warn(pc.yellow(t)),
    error: (t) => p.log.error(pc.red(t)),
    note: (t, title) => !quiet && p.note(t, title),
    costTable(rows) {
      if (quiet) return;
      const total = rows.reduce((a, r) => a + r.usd, 0);
      const totalMs = rows.reduce((a, r) => a + r.ms, 0);
      const lines = rows.map(
        (r) => `${r.stage.padEnd(12)} ${money(r.usd).padStart(6)} ${secs(r.ms).padStart(5)}  ${pc.dim(r.model ?? "")}`,
      );
      lines.push(pc.bold(`${"total".padEnd(12)} ${money(total).padStart(6)} ${secs(totalMs).padStart(5)}`));
      p.note(lines.join("\n"), "Cost");
    },
    stage(index, label) {
      const prefix = pc.dim(`[${String(index).padStart(2, "0")}]`);
      const s = quiet ? null : p.spinner();
      s?.start(`${prefix} ${label}`);
      const started = Date.now();
      let lastLine = "";
      const setMsg = (text: string) => {
        lastLine = text;
        s?.message(`${prefix} ${label} ${pc.dim("›")} ${text}`);
      };
      return {
        message: setMsg,
        done(text) {
          const dur = pc.dim(`${secs(Date.now() - started)}`);
          s?.stop(`${prefix} ${pc.green("✔")} ${label} ${text ? pc.dim("› " + text) : ""} ${dur}`);
        },
        fail(text) {
          s?.stop(`${prefix} ${pc.red("✖")} ${label} ${pc.red(text)}`);
        },
        onEvent(e) {
          switch (e.kind) {
            case "tool":
              setMsg(`${e.subagent ? "  ↳ " : ""}${pc.cyan(e.name)} ${e.summary}`);
              break;
            case "subagent":
              setMsg(`${pc.magenta("spawn")} ${e.name} ${pc.dim(e.description)}`);
              break;
            case "status":
              setMsg(pc.yellow(e.text));
              break;
            case "result":
              setMsg(`${pc.dim(`${e.turns} turns · ${money(e.costUsd)}`)}`);
              break;
            case "text":
              if (!lastLine) setMsg(pc.dim(e.text.split("\n")[0].slice(0, 70)));
              break;
          }
        },
      };
    },
  };
}
