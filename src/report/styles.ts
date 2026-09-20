export const CSS = `
:root{--bg:#fbfbfa;--fg:#1a1a1a;--muted:#6b6b6b;--card:#fff;--line:#e6e4df;--accent:#0f6fff;--accent-soft:#e8f0ff;--ok:#127a3e;--warn:#9a6700;--bad:#b3261e;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;--sans:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#111213;--fg:#ececec;--muted:#9a9a9a;--card:#1a1b1d;--line:#2a2c30;--accent:#6ea3ff;--accent-soft:#1b2740;--ok:#4cc38a;--warn:#e2b340;--bad:#ff7b72}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);line-height:1.5;font-size:15px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:10px 24px;display:flex;gap:18px;flex-wrap:wrap;font-size:13px}
nav a{color:var(--muted)}nav a:hover{color:var(--fg)}
main{max-width:1080px;margin:0 auto;padding:24px}
header.hero{padding:32px 0 16px}header h1{font-size:34px;margin:0 0 6px;letter-spacing:-.01em}
.one{font-size:18px;color:var(--muted);margin:0 0 14px}
.meta{display:flex;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid var(--line)}
.pill.ok{color:var(--ok);border-color:var(--ok)}.pill.warn{color:var(--warn);border-color:var(--warn)}.pill.bad{color:var(--bad);border-color:var(--bad)}
section{margin:36px 0}section>h2{font-size:22px;margin:0 0 6px;letter-spacing:-.01em}.lede{color:var(--muted);margin:0 0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.grid{display:grid;gap:14px}.grid.c2{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}.grid.c3{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden;min-width:120px}.bar>i{display:block;height:100%;background:var(--accent);border-radius:4px}
.score{font-variant-numeric:tabular-nums;font-weight:700}
.quote{border-left:3px solid var(--accent);padding:6px 12px;margin:8px 0;color:var(--muted);font-style:italic;background:var(--accent-soft);border-radius:0 8px 8px 0}
.quote a{font-style:normal;font-size:12px;margin-left:6px}
details{margin:6px 0}summary{cursor:pointer;color:var(--accent);font-size:13px}
pre{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;white-space:pre-wrap;word-wrap:break-word;font-family:var(--mono);font-size:13px;line-height:1.55;margin:0}
.asset{position:relative}.asset .copy{position:absolute;top:10px;right:10px}
button.copy{font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}button.copy:hover{border-color:var(--accent)}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.tabs button{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}.tabs button[aria-selected=true]{background:var(--accent);border-color:var(--accent);color:#fff}
.panel{display:none}.panel[data-active]{display:block}
.persona{display:flex;flex-direction:column;gap:8px}.persona .head{display:flex;justify-content:space-between;align-items:baseline}.persona h3{margin:0;font-size:16px}
.persona .sub{color:var(--muted);font-size:12px}.chips{display:flex;gap:6px;flex-wrap:wrap}.chip{font-size:12px;padding:2px 8px;border-radius:6px;background:var(--accent-soft);color:var(--fg)}
ul.clean{margin:6px 0;padding-left:18px}ul.clean li{margin:3px 0}
.timeline{list-style:none;padding:0;margin:0}.timeline li{display:grid;grid-template-columns:70px 1fr;gap:12px;padding:8px 0;border-bottom:1px dashed var(--line)}.timeline .day{font-family:var(--mono);color:var(--muted);font-size:13px}
.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.kpi .card{padding:12px 14px}.kpi .n{font-size:26px;font-weight:700;letter-spacing:-.02em}.kpi .l{font-size:12px;color:var(--muted)}
footer{color:var(--muted);font-size:12px;margin:48px 0 24px;text-align:center}
.scene{display:grid;grid-template-columns:52px 60px 1fr 1fr;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}.scene .n{font-family:var(--mono);color:var(--muted)}.scene .vo{font-style:italic}
.small{font-size:13px;color:var(--muted)}
.delta{font-size:12px;color:var(--ok);margin-left:6px}.delta.neg{color:var(--bad)}
@media print{nav{display:none}.copy{display:none}.panel{display:block!important}}
`;
