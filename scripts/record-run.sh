#!/usr/bin/env bash
# Copy a finished run into the offline demo fixtures and the GitHub Pages folder.
# Usage: scripts/record-run.sh <slug>   (reads out/<slug>/)
set -euo pipefail
slug="${1:?usage: record-run.sh <slug>}"
src="out/$slug"
[ -f "$src/report.html" ] || { echo "no report at $src/report.html"; exit 1; }
rm -rf fixtures/sample-run && mkdir -p fixtures/sample-run docs
cp "$src"/*.json fixtures/sample-run/
cp "$src/report.html" fixtures/sample-run/report.html
cp "$src/report.html" docs/index.html
cp -R "$src/assets" docs/assets
cp "$src"/{distribution,validation,jury}.md docs/
echo "recorded $src → fixtures/sample-run and docs/"
