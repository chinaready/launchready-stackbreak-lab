<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
# Building & deploying Stack Break Lab

This is a **pure static site with zero build step**: every page, stylesheet,
script, and data file in this repository is served exactly as committed. Git is
the single source of truth; the CDN origin (Alibaba OSS) is a distribution
copy kept in sync by a workflow. This document is the map for contributors and
for the CDN deployment.

## Architecture at a glance

```text
main branch (source of truth)
   │
   ├── push touching site paths ──> publish workflow ──ossutil sync──> OSS bucket ──CDN──> visitors
   │
   └── weekly cron (Mon 06:00 Beijing, self-hosted mainland runner)
        ├── probe/china-dependency-probe.sh   curl+dig, 13 targets   → results/<date>/probe.json
        ├── Playwright browser checks         Chromium + screenshots → results/<date>/browser.json
        ├── firebase/netlify/vercel kits      whole-stack probes     → results/<date>/<kit>.json
        ├── update-history / update-timeline  derived indexes        → results/{history,timeline}.json
        ├── generate-report                   DS toolchain           → results/<date>/report.{pdf,docx}
        ├── commit "[evidence] <date> mainland snapshot" + push
        └── incremental OSS upload of results/
```

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Home dashboard: verdict traffic lights, run-reports table (PDF downloads), test/verify/produce |
| `stack/` | Stack hub + 11 dependency pages + `beijing-view.html` |
| `product/` | Whole-stack deep dives (Firebase / Netlify / Vercel, official marks) |
| `trends/` | Verdict timelines (SVG stripes) + latency sparklines |
| `public/assets/` | Stylesheets (`chinaready.css` DS → `lab.css` legacy → `home.css` landing → **`theme.css` v2.3 refresh**), page JS, brand logos |
| `demos/` | Redirect stubs only (old URLs; superseded by CDN 301 rules) |
| `probe/` | Target registries (`targets.json` curated + `targets-community.json`), JSON Schema, the network probe |
| `results/` | Published evidence: dated runs, `latest.json`, `history.json`, `timeline.json`, kit files, `report.pdf/.docx` per run |
| `scripts/` | All tooling (see below) |
| `tests/` | `unit/` (node:test) + `playwright/` (browser specs) |
| `deploy/` | Runner setup + **`oss-cdn-checklist.md`** (the deployment runbook) |

## Styling system (and how to change it safely)

- `theme.css` is the **single file** carrying the current design (Sequence
  layout language × Chinaready DS tokens). The legacy sheets underneath are
  untouched — that is what makes the look revertable in one commit.
- Pages load stylesheets in cascade order and carry **cache-busting query
  versions**. After any CSS/JS edit, bump versions with:
  `node scripts/bump-theme.mjs v=OLD v=NEW` and `node scripts/bump-assets.mjs v=NEW`
  (both idempotent, cover every page — keep the file lists in sync with URL moves).
- Verify alignment after visual changes: `node scripts/audit-theme.mjs` must
  print `ALL ALIGNED` (computed-style assertions per page).

## Verdicts (three-tier time color code)

All collection points — main probe, kit probes, page resources — use the same
classification (implemented once in `scripts/reclassify.mjs`, mirrored in each
probe script):

| Verdict | Condition |
|---|---|
| Reachable | total request time **< 1s** (`REACHABLE_MAX_S`) |
| Degraded | **1s–3s** (`BLOCKED_MIN_S`) |
| Blocked | **> 3s** or connection failure / HTTP 000 |

Any HTTP status counts as connected. Every page carries the legend above the
footer (above the CTA band on stack/product). Reclassifying stored evidence
(derived verdict field only — raw metrics are never rewritten):
`node scripts/reclassify.mjs --dry-run` then `--apply`, then rebuild
`history.json` / `timeline.json` and regenerate reports.

## Weekly reports (DS toolchain)

`scripts/generate-report.mjs [--date YYYY-MM-DD]` is deterministic per date and
produces both artifacts: `report.docx` via the **vendored Chinaready OOXML
builder** (`report-ooxml.mjs` + `report-document.mjs`) and `report.pdf` via a
Chromium template using the same tokens. Copy lives in `report-copy.mjs`
(governance scan: no promise wording, disclaimers enforced). Backfilling a
date is just running the command; regenerating everything is a loop over
`results/20*`.

## Local development

```bash
npm install
npm run serve            # http://localhost:8080  (scripts/serve.mjs — zero deps)
npm run validate:targets # registry schema + cross-file rules
npm run test:unit        # node --test tests/unit/*.test.mjs
npx playwright install chromium   # once
npm test                 # Playwright suite (needs the server on :8080)
```

**Note:** local Playwright runs write into `results/<today>/` — after local
test runs, restore committed evidence with `git restore results/` (never
commit local browser noise; never commit local probe runs).

## Quality gates (what CI enforces)

- `validate-targets` workflow: registry schema, duplicate ids, vendor
  references, tier rules — blocks bad PRs.
- Unit: validators, history/timeline builders, report model + copy
  governance, DOCX content.
- Playwright: IA structure (nav, tabs, slugs), redirect stubs, trends rows,
  PDF download links, demo pages.
- `audit-theme.mjs`: site-wide computed-style alignment.

## CDN deployment (the transition this enables)

The site needs **no build for deployment** — only a sync. Full runbook:
[`deploy/oss-cdn-checklist.md`](deploy/oss-cdn-checklist.md). Summary:

1. OSS bucket with static-website hosting (`index.html` default) — mainland region.
2. CDN domain `stackbreak.launchready.cn`, origin = the bucket's static-site
   endpoint, HTTPS cert attached.
3. Cache rules: `*.json` 60s · `*.html` 60s · `/public/assets/*` 30d.
4. URI redirect rules (301) superseding the in-repo stubs:
   `/demos/→/stack/`, `/product.html|/product→/product/`, `/results/→/public/results/`,
   plus `/demos/<slug>.html→/stack/<slug>.html`.
5. GitHub secrets `OSS_ACCESS_KEY_ID`/`OSS_ACCESS_KEY_SECRET` (bucket-scoped)
   and vars `OSS_BUCKET`/`OSS_ENDPOINT` — from then on the `publish` workflow
   syncs the site on every merge and the evidence workflow uploads fresh
   `results/` weekly (both skip cleanly until configured).
6. First sync: run `publish` manually, spot-check URLs, then cut DNS over
   (CNAME to the CDN domain; the old nginx container keeps serving during
   propagation — zero downtime).
7. Decommission the old container; **keep the self-hosted runner** (it is the
   mainland evidence node and runs the OSS uploads).

What gets synced: `index.html`, `stack/`, `product/`, `trends/`, `demos/`
(stubs), `public/`, `probe/` (registries are fetched client-side), `results/`,
`robots.txt`, `sitemap.xml`, `llms.txt` — i.e. the whole repo minus dev files;
the workflow's path filter lists them explicitly.

## Operational recipes

- **Add a target**: approved issue → edit `probe/targets.json` (curated, needs
  demo page) or `probe/targets-community.json` (URL-only) → CI validates →
  next Monday's run probes it.
- **Change verdict thresholds**: set `REACHABLE_MAX_S`/`BLOCKED_MIN_S` (env or
  workflow), update `reclassify.mjs` defaults + schema docs, reclassify
  stored evidence, regenerate reports.
- **Manual evidence run**: Actions → `evidence` → Run workflow (~3 min, writes
  a dated snapshot + reports and publishes to OSS when configured).
- **Quarterly report**: Actions → `quarterly-report` (dispatch stub; real
  rollup lands once enough history accumulates).
