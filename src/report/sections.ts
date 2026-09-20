import type { RunBundle } from "../schemas/bundle.ts";
import { ASSET_LABELS, type AssetKey } from "../schemas/common.ts";
import type { Assets } from "../schemas/assets.ts";
import { PRINCIPLES } from "../validation/principles.ts";
import { PERSONAS } from "../jury/personas.ts";
import { renderAsset } from "../stages/06-jury.ts";

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (n: number) => `$${n.toFixed(2)}`;
const mins = (ms: number) => `${Math.round(ms / 60000)} min`;
const pillClass = (v: string) => (v === "ready" || v === "passed" ? "ok" : v === "needs-work" || v === "below-threshold" ? "warn" : "bad");
const bar = (score: number, max = 10) => `<div class="bar"><i style="width:${Math.max(2, Math.round((score / max) * 100))}%"></i></div>`;
const list = (items: string[]) => (items.length ? `<ul class="clean">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="small">None.</p>`);
const quote = (e: { quote: string; url: string; source: string }) =>
  `<div class="quote">“${esc(e.quote)}”<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.source)} ↗</a></div>`;
const copyBtn = (path: string, label = "Copy") => `<button class="copy" data-copy-path="${esc(path)}">${label}</button>`;
const copyTextBtn = (text: string, label = "Copy") => `<button class="copy" data-copy-text="${esc(text)}">${label}</button>`;

export function nav() {
  const items = ["product", "validation", "research", "jury", "revisions", "distribution", "assets"];
  return `<nav>${items.map((i) => `<a href="#${i}">${i[0].toUpperCase() + i.slice(1)}</a>`).join("")}</nav>`;
}

export function hero(b: RunBundle) {
  const { brief, validation, jury, meta } = b;
  return `<header class="hero">
  <h1>${esc(brief.name)}</h1>
  <p class="one">${esc(validation.recommendedPositioning || brief.oneLiner)}</p>
  <div class="meta">
    <span class="pill ${pillClass(validation.verdict)}">Validation: ${esc(validation.verdict)} · ${validation.overall}/10</span>
    <span class="pill ${pillClass(jury.status)}">Jury: ${esc(jury.status)} · ${b.jury.rounds.at(-1)?.aggregate.overall ?? "—"}/10 after ${jury.rounds.length} round${jury.rounds.length === 1 ? "" : "s"}</span>
    <span class="pill">${esc(brief.category)}</span>
    <span class="pill">Goal: ${esc(brief.launchGoal)}</span>
    <span class="pill">${money(meta.totalUsd)} · ${mins(meta.totalMs)}${meta.mock ? " · replayed" : ""}</span>
  </div>
</header>`;
}

export function product(b: RunBundle) {
  const { brief } = b;
  return `<section id="product"><h2>Product</h2><p class="lede">What the agent understood from the repository.</p>
<div class="grid c2">
  <div class="card"><h3>What it does</h3><p>${esc(brief.whatItDoes)}</p><h3>How it works</h3><p>${esc(brief.howItWorks)}</p></div>
  <div class="card">
    <table><tr><th>Audience</th><td>${esc(brief.targetAudience)}</td></tr>
    <tr><th>Category</th><td>${esc(brief.category)} · ${esc(brief.language)}</td></tr>
    <tr><th>License</th><td>${esc(brief.license ?? "unknown")}</td></tr>
    <tr><th>Install</th><td>${brief.installCommand ? `<code>${esc(brief.installCommand)}</code>` : "—"}</td></tr>
    <tr><th>Repo</th><td>${brief.repoUrl ? `<a href="${esc(brief.repoUrl)}" target="_blank" rel="noopener">${esc(brief.repoUrl)}</a>` : "—"}</td></tr>
    <tr><th>Tone</th><td>${esc(brief.tone)}</td></tr></table>
    <h3>Key features</h3>${list(brief.keyFeatures)}
    ${brief.openQuestions.length ? `<h3>Open questions</h3>${list(brief.openQuestions)}` : ""}
  </div>
</div></section>`;
}

export function validation(b: RunBundle) {
  const v = b.validation;
  const rows = PRINCIPLES.map((p) => {
    const s = v.scores.find((x) => x.principleId === p.id);
    if (!s) return "";
    return `<tr><td><strong>${esc(p.name)}</strong><div class="small">${esc(p.question)}</div></td>
<td>${bar(s.score)}</td><td class="score">${s.score}</td>
<td>${esc(s.rationale)}<details><summary>Fix & evidence</summary><p><strong>Fix:</strong> ${esc(s.fix)}</p>${s.evidence.map(quote).join("")}</details></td></tr>`;
  }).join("");
  return `<section id="validation"><h2>Validation scorecard</h2>
<p class="lede">Scored against eight launch principles, weighted. Verdict: <span class="pill ${pillClass(v.verdict)}">${esc(v.verdict)} · ${v.overall}/10</span></p>
<div class="card"><table><thead><tr><th>Principle</th><th></th><th>Score</th><th>Why</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="grid c2" style="margin-top:14px">
  <div class="card"><h3>Predicted launch-day reaction</h3><p>${esc(v.predictedReaction)}</p></div>
  <div class="card"><h3>Top risks</h3>${list(v.topRisks)}</div>
</div></section>`;
}

export function research(b: RunBundle) {
  const r = b.research;
  return `<section id="research"><h2>What the market is saying</h2>
<p class="lede">${esc(r.summary)}</p>
<div class="card"><h3>Similar launches</h3><table><thead><tr><th>Product</th><th>Platform</th><th>Reception</th><th>Claim</th><th>Takeaway</th></tr></thead><tbody>
${r.similarProducts.map((s) => `<tr><td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></td><td>${esc(s.platform)}${s.points ? ` · ${s.points}pts` : ""}</td><td>${esc(s.reception)}</td><td>${esc(s.claim)}</td><td>${esc(s.takeaway)}</td></tr>`).join("")}
</tbody></table></div>
<div class="grid c3" style="margin-top:14px">
  <div class="card"><h3>Objections</h3>${r.objections.map((o) => `<p><strong>${esc(o.objection)}</strong> <span class="chip">${esc(o.frequency)}</span>${o.evidence.slice(0, 2).map(quote).join("")}</p>`).join("")}</div>
  <div class="card"><h3>What people praise</h3>${r.praiseThemes.map((t) => `<p><strong>${esc(t.theme)}</strong>${t.evidence.slice(0, 2).map(quote).join("")}</p>`).join("")}</div>
  <div class="card"><h3>Feature requests & gaps</h3>${list(r.featureRequests.map((f) => f.request))}<h3>Gaps</h3>${list(r.gaps)}</div>
</div>
<div class="grid c2" style="margin-top:14px">
  <div class="card"><h3>Titles that worked</h3><table><tbody>${r.winningTitles.map((w) => `<tr><td><a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)}</a><div class="small">${esc(w.platform)} · ${w.points}pts</div></td><td class="small">${esc(w.whyItWorked)}</td></tr>`).join("")}</tbody></table></div>
  <div class="card"><h3>Communities</h3><table><tbody>${r.communities.map((c) => `<tr><td>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}<div class="small">${esc(c.platform)}</div></td><td class="small">${esc(c.engagementNote)}${c.rulesNote ? `<br><em>${esc(c.rulesNote)}</em>` : ""}</td></tr>`).join("")}</tbody></table></div>
</div></section>`;
}

export function jury(b: RunBundle) {
  const rounds = b.jury.rounds;
  const tabs = rounds.map((r, i) => `<button role="tab" aria-selected="${i === 0}">Round ${r.round} · ${r.aggregate.overall}/10</button>`).join("");
  const panels = rounds
    .map((r, ri) => {
      const prev = rounds[ri - 1];
      const cards = r.verdicts
        .map((v) => {
          const p = PERSONAS.find((x) => x.name === v.persona);
          const prevV = prev?.verdicts.find((x) => x.persona === v.persona);
          const d = prevV ? v.overall - prevV.overall : 0;
          return `<div class="card persona">
  <div class="head"><h3>${p?.emoji ?? ""} ${esc(p?.title ?? v.persona)}</h3><span class="score">${v.overall}/10${d ? `<span class="delta ${d < 0 ? "neg" : ""}">${d > 0 ? "+" : ""}${d}</span>` : ""}</span></div>
  <div class="sub">${v.wouldEngage ? "Would engage" : "Would scroll past"} · weight ${p?.weight ?? 1}</div>
  <div class="chips">${v.assetScores.map((a) => `<span class="chip">${esc(ASSET_LABELS[a.asset])} ${a.score}</span>`).join("")}</div>
  <div class="quote">“${esc(v.predictedTopComment)}”</div>
  <p class="small"><strong>Objection:</strong> ${esc(v.predictedObjection)}</p>
  ${v.mustFix.length ? `<details><summary>Must fix (${v.mustFix.length})</summary>${list(v.mustFix.map((m) => `[${ASSET_LABELS[m.asset]}] ${m.instruction}`))}</details>` : ""}
  <details><summary>Per-asset rationale</summary>${v.assetScores.map((a) => `<p><strong>${esc(ASSET_LABELS[a.asset])} · ${a.score}</strong><br>${esc(a.rationale)}${a.edits.length ? list(a.edits.map((e) => `${e.what}${e.after ? ` → “${e.after}”` : ""}`)) : ""}</p>`).join("")}</details>
</div>`;
        })
        .join("");
      const agg = r.aggregate;
      return `<div class="panel">
<div class="kpi" style="margin-bottom:14px">
  <div class="card"><div class="n">${agg.overall}</div><div class="l">weighted overall</div></div>
  ${Object.entries(agg.perAsset).map(([k, s]) => `<div class="card"><div class="n">${s}</div><div class="l">${esc(ASSET_LABELS[k as AssetKey] ?? k)}</div></div>`).join("")}
  <div class="card"><div class="n"><span class="pill ${agg.passed ? "ok" : "warn"}">${agg.passed ? "PASS" : "REVISE"}</span></div><div class="l">threshold 7.5 overall, 6 per asset</div></div>
</div>
<div class="grid c2">${cards}</div></div>`;
    })
    .join("");
  return `<section id="jury"><h2>The jury</h2>
<p class="lede">Seven specialists scored the drafts, predicted the top comment their audience would leave, and demanded fixes. The foreman aggregates by weight and sends drafts back until they pass.</p>
<div data-tabs><div class="tabs">${tabs}</div>${panels}</div></section>`;
}

export function revisions(b: RunBundle) {
  const rounds = b.jury.rounds.filter((r) => r.changelog?.length);
  if (!rounds.length) {
    return `<section id="revisions"><h2>Revisions</h2><p class="lede">The first draft passed the jury; no revisions were needed.</p></section>`;
  }
  return `<section id="revisions"><h2>Revisions</h2><p class="lede">What changed between rounds, and why.</p>
${rounds.map((r) => `<div class="card"><h3>After round ${r.round} → assets v${r.assetsVersion + 1}</h3>${list(r.changelog ?? [])}
<details><summary>Show v${r.assetsVersion} Show HN before revision</summary><pre>${esc(renderAsset("showHn", b.assetsHistory[r.assetsVersion - 1]?.showHn ?? b.assetsHistory[0].showHn))}</pre></details></div>`).join("")}
</section>`;
}

export function distribution(b: RunBundle) {
  const d = b.distribution;
  return `<section id="distribution"><h2>Where to launch</h2>
<p class="lede">${esc(d.audienceSummary)}</p>
<div class="card"><table><thead><tr><th>#</th><th>Channel</th><th>Post</th><th>When</th><th>Why this audience</th><th>Tag / notify</th></tr></thead><tbody>
${d.channels.map((c) => `<tr><td class="score">${c.rank}</td><td>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.channel)}</a>` : esc(c.channel)}<div class="small">${esc(c.platform)}</div></td><td><a href="#asset-${c.whatToPost}">${esc(ASSET_LABELS[c.whatToPost])}</a></td><td class="small">${esc(c.bestDay)}<br>${esc(c.bestTimeLocal)} ${esc(c.timezone)}</td><td class="small">${esc(c.why)}${c.evidence.slice(0, 1).map(quote).join("")}<div><em>Expect:</em> ${esc(c.expectedReaction)}</div>${c.rulesToRespect.length ? `<div><em>Rules:</em> ${esc(c.rulesToRespect.join("; "))}</div>` : ""}</td><td class="small">${esc(c.tagOrNotify.join(", ") || "—")}</td></tr>`).join("")}
</tbody></table></div>
<div class="grid c2" style="margin-top:14px">
  <div class="card"><h3>Sequence</h3><ul class="timeline">${d.sequence.sort((a, z) => a.dayOffset - z.dayOffset).map((s) => `<li><span class="day">day ${s.dayOffset >= 0 ? "+" : ""}${s.dayOffset}</span><span><strong>${esc(s.channel)}</strong> — ${esc(s.action)}${s.note ? `<div class="small">${esc(s.note)}</div>` : ""}</span></li>`).join("")}</ul></div>
  <div class="card"><h3>Do not</h3>${list(d.doNot)}</div>
</div></section>`;
}

function scenes(s: Assets["demoVideo"]["scenes"]) {
  return s.map((x) => `<div class="scene"><span class="n">#${x.n}</span><span class="n">${x.durationSec}s</span><span><strong>See:</strong> ${esc(x.onScreenAction)}${x.onScreenText ? `<br><strong>Text:</strong> ${esc(x.onScreenText)}` : ""}<br><span class="small">Shot: ${esc(x.shot)}</span></span><span class="vo">“${esc(x.voiceOver)}”</span></div>`).join("");
}

export function assets(b: RunBundle) {
  const a = b.finalAssets;
  const keys = Object.keys(ASSET_LABELS) as AssetKey[];
  const tabs = keys.map((k, i) => `<button role="tab" aria-selected="${i === 0}" id="asset-${k}">${esc(ASSET_LABELS[k])}</button>`).join("");
  const panel = (k: AssetKey) => {
    switch (k) {
      case "showHn":
        return `<div class="asset"><h3>Title ${copyTextBtn(a.showHn.title)}</h3><pre>${esc(a.showHn.title)}</pre><h3>Post ${copyBtn("finalAssets.showHn.body")}</h3><pre>${esc(a.showHn.body)}</pre><h3>Your first comment ${copyBtn("finalAssets.showHn.authorFirstComment")}</h3><pre>${esc(a.showHn.authorFirstComment)}</pre></div>`;
      case "productHunt":
        return `<div class="asset"><h3>Tagline ${copyTextBtn(a.productHunt.tagline)}</h3><pre>${esc(a.productHunt.tagline)}</pre><h3>Description ${copyBtn("finalAssets.productHunt.description")}</h3><pre>${esc(a.productHunt.description)}</pre><h3>Maker comment ${copyBtn("finalAssets.productHunt.firstComment")}</h3><pre>${esc(a.productHunt.firstComment)}</pre><p class="small">Topics: ${esc(a.productHunt.topics.join(", "))}</p></div>`;
      case "xThread":
        return `<div class="asset">${a.xThread.tweets.map((t, i) => `<h3>Tweet ${i + 1} <span class="small">(${t.length}/280)</span> ${copyTextBtn(t)}</h3><pre>${esc(t)}</pre>`).join("")}<p class="small">Tag: ${esc(a.xThread.tagSuggestions.join(", "))}</p></div>`;
      case "reddit":
        return `<div class="asset">${a.reddit.map((r, i) => `<h3>r/${esc(r.subreddit)}${r.flair ? ` · ${esc(r.flair)}` : ""} ${copyBtn(`finalAssets.reddit.${i}.body`)}</h3><pre>${esc(r.title)}\n\n${esc(r.body)}</pre>`).join("")}</div>`;
      case "linkedin":
        return `<div class="asset"><h3>Post ${copyBtn("finalAssets.linkedin.post")}</h3><pre>${esc(a.linkedin.post)}</pre></div>`;
      case "demoVideo":
        return `<div class="asset"><h3>${esc(a.demoVideo.title)} <span class="small">${a.demoVideo.totalSec}s</span> ${copyBtn("finalAssets.demoVideo", "Copy JSON")}</h3>${scenes(a.demoVideo.scenes)}<h3>Shot list</h3>${list(a.demoVideo.shotList)}<p class="small"><strong>Recording notes:</strong> ${esc(a.demoVideo.recordingNotes)}</p></div>`;
      case "launchVideo":
        return `<div class="asset"><h3>Hook <span class="small">${a.launchVideo.totalSec}s</span> ${copyBtn("finalAssets.launchVideo", "Copy JSON")}</h3><pre>${esc(a.launchVideo.hook)}</pre>${scenes(a.launchVideo.scenes)}<h3>CTA</h3><pre>${esc(a.launchVideo.cta)}</pre></div>`;
    }
  };
  return `<section id="assets"><h2>Launch assets <span class="small">v${a.version}</span></h2>
<p class="lede">Final versions after the jury. Copy buttons paste the exact text. Markdown versions are in the <code>assets/</code> folder next to this report.</p>
<div data-tabs><div class="tabs">${tabs}</div>${keys.map((k) => `<div class="panel">${panel(k)}</div>`).join("")}</div></section>`;
}

export function footer(b: RunBundle) {
  const costs = Object.entries(b.meta.costs).map(([k, c]) => `${k} ${money(c.usd)}`).join(" · ");
  return `<footer>Generated by LaunchJury on ${esc(b.meta.finishedAt ?? b.meta.startedAt)} · ${costs}</footer>`;
}
