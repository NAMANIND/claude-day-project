import path from "node:path";
import type { Ui } from "../ui/log.ts";
import type { RunMeta } from "../schemas/bundle.ts";

export interface Flags {
  from?: string;
  to?: string;
  yes: boolean;
  mock: boolean;
  mockResearch: boolean;
  budget: number;
  open: boolean;
  concurrency: number;
  rounds: number;
  outRoot: string;
  quiet: boolean;
}

export class BudgetExceededError extends Error {}

export class RunContext {
  readonly store = new Map<string, unknown>();
  readonly meta: RunMeta;
  slug: string;
  outDir: string;

  constructor(
    public readonly source: string,
    public readonly flags: Flags,
    public readonly ui: Ui,
    slug: string,
  ) {
    this.slug = slug;
    this.outDir = path.join(flags.outRoot, slug);
    this.meta = {
      slug,
      source,
      startedAt: new Date().toISOString(),
      costs: {},
      totalUsd: 0,
      totalMs: 0,
      mock: flags.mock,
    };
  }

  setSlug(slug: string) {
    this.slug = slug;
    this.meta.slug = slug;
    this.outDir = path.join(this.flags.outRoot, slug);
  }

  get<T>(key: string): T {
    if (!this.store.has(key)) throw new Error(`Missing artifact '${key}' — run the earlier stage first`);
    return this.store.get(key) as T;
  }
  set(key: string, value: unknown) {
    this.store.set(key, value);
  }
  has(key: string) {
    return this.store.has(key);
  }

  addCost(stage: string, usd: number, ms: number, model?: string) {
    const prev = this.meta.costs[stage] ?? { usd: 0, ms: 0, model };
    this.meta.costs[stage] = { usd: prev.usd + usd, ms: prev.ms + ms, model: model ?? prev.model };
    this.meta.totalUsd = Object.values(this.meta.costs).reduce((a, c) => a + c.usd, 0);
    this.meta.totalMs = Object.values(this.meta.costs).reduce((a, c) => a + c.ms, 0);
    if (this.flags.budget > 0 && this.meta.totalUsd > this.flags.budget) {
      throw new BudgetExceededError(
        `Run cost $${this.meta.totalUsd.toFixed(2)} exceeded --budget ${this.flags.budget}`,
      );
    }
  }
}
