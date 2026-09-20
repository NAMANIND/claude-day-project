import type { RunBundle } from "../schemas/bundle.ts";
import { CSS } from "./styles.ts";
import { CLIENT_JS } from "./client.ts";
import * as S from "./sections.ts";

export function renderReport(bundle: RunBundle): string {
  const json = JSON.stringify(bundle).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${S.esc(bundle.brief.name)} — LaunchJury report</title>
<style>${CSS}</style>
</head>
<body>
${S.nav()}
<main>
${S.hero(bundle)}
${S.product(bundle)}
${S.validation(bundle)}
${S.research(bundle)}
${S.jury(bundle)}
${S.revisions(bundle)}
${S.distribution(bundle)}
${S.assets(bundle)}
${S.footer(bundle)}
</main>
<script type="application/json" id="bundle">${json}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}
