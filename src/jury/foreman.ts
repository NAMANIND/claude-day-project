import type { AssetKey } from "../schemas/common.ts";
import type { JuryAggregate, JuryVerdict } from "../schemas/jury.ts";
import { PERSONAS, personaByName } from "./personas.ts";

export const PASS_OVERALL = 7.5;
export const PASS_MIN_ASSET = 6;
export const MAX_MUST_FIX_PER_ASSET = 3;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function aggregate(verdicts: JuryVerdict[]): JuryAggregate {
  const weightOf = (name: string) => PERSONAS.find((p) => p.name === name)?.weight ?? 1;

  let num = 0;
  let den = 0;
  const perAssetSums = new Map<string, { num: number; den: number }>();
  for (const v of verdicts) {
    const w = weightOf(v.persona);
    num += v.overall * w;
    den += w;
    for (const a of v.assetScores) {
      const cur = perAssetSums.get(a.asset) ?? { num: 0, den: 0 };
      cur.num += a.score * w;
      cur.den += w;
      perAssetSums.set(a.asset, cur);
    }
  }
  const perAsset: Record<string, number> = {};
  for (const [k, { num: n, den: d }] of perAssetSums) perAsset[k] = round1(n / d);

  const overall = den ? round1(num / den) : 0;
  const assetEntries = Object.entries(perAsset);
  const weakest = assetEntries.sort((a, b) => a[1] - b[1])[0];
  const minAsset = weakest ? weakest[1] : 10;
  const passed = overall >= PASS_OVERALL && minAsset >= PASS_MIN_ASSET;

  return {
    overall,
    perAsset,
    passed,
    weakestAsset: weakest?.[0],
    mustFix: dedupeMustFix(verdicts),
  };
}

/** Merge must-fix instructions per asset, most-trusted juror first, capped per asset. */
export function dedupeMustFix(verdicts: JuryVerdict[]): JuryAggregate["mustFix"] {
  const sorted = [...verdicts].sort(
    (a, b) => (personaWeight(b.persona) ?? 1) - (personaWeight(a.persona) ?? 1),
  );
  const perAsset = new Map<AssetKey, JuryAggregate["mustFix"]>();
  for (const v of sorted) {
    for (const m of v.mustFix) {
      const list = perAsset.get(m.asset) ?? [];
      if (list.length >= MAX_MUST_FIX_PER_ASSET) continue;
      const norm = m.instruction.toLowerCase().replace(/\W+/g, " ").trim();
      if (list.some((x) => similar(x.instruction, norm))) continue;
      list.push({ asset: m.asset, instruction: m.instruction, persona: v.persona });
      perAsset.set(m.asset, list);
    }
  }
  return [...perAsset.values()].flat();
}

function personaWeight(name: string): number | undefined {
  try {
    return personaByName(name).weight;
  } catch {
    return undefined;
  }
}

/** Cheap near-duplicate check: share >60% of words. */
function similar(a: string, normB: string): boolean {
  const wa = new Set(a.toLowerCase().replace(/\W+/g, " ").trim().split(" ").filter((w) => w.length > 3));
  const wb = normB.split(" ").filter((w) => w.length > 3);
  if (!wa.size || !wb.length) return false;
  const shared = wb.filter((w) => wa.has(w)).length;
  return shared / Math.max(wa.size, wb.length) > 0.6;
}

export function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(next);
      };
      active < concurrency ? run() : queue.push(run);
    });
}
