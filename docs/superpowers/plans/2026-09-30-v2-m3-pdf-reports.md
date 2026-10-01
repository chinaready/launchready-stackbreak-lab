# Stack Break Lab v2 — M3 Weekly PDF Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every evidence run produces a downloadable weekly PDF report (`results/<date>/report.pdf`, EN body + Chinese summary page) — committed to git, published to OSS by the existing steps, and surfaced as a download button in the homepage reports table.

**Architecture:** A dependency-free data builder derives a report model from the run's `probe.json` (+ previous run for the changes-since-last-week diff). A self-contained HTML template (inline CSS, site design tokens) is rendered to PDF by the repo's existing Playwright/Chromium in `scripts/generate-report.mjs`. The evidence workflow runs it after probing with failure isolation (`continue-on-error`); `update-history.mjs` records a `pdf` flag per run; `dashboard.js` swaps the row's "snapshot" link for a "PDF" download when present. Git keeps full history; the OSS publish step (already merged) ships PDFs with no extra work.

**Tech Stack:** Node ≥18 ESM, `node:test`, Playwright chromium (existing devDependency) — zero new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-29-v2-dual-taxonomy-reports-community-design.md` (§3 pipeline extension, M3 row of §7 + v2.1/v2.2 addenda). **Planned deviation from the original spec:** no separate `reports.html` index page — the v2.1 homepage dashboard already owns the reports table; PDF links land there instead.

## Global Constraints

- PDF generation must never block evidence: workflow step is `continue-on-error` + backfill via `--date`.
- Reports are deterministic given a date: `node scripts/generate-report.mjs --date YYYY-MM-DD` must be idempotent (re-running overwrites the same file).
- Self-contained template: inline `<style>`, no network fetches, no external assets (mainland-safe; must load under `file://`).
- PDF target size 2–4 MB (screenshots are already-compressed PNGs ~95 KB each).
- Language: English body + a Chinese summary page (中文摘要) at the end.
- No new npm dependencies; repo JS style (IIFE/`var` in browser, ESM exports in Node).
- The weekly Monday schedule and probe methodology stay untouched.
- Local runs of the generator write into `results/<date>/` — after **local** verification the artifacts must be either legitimately backfilled (real mainland data) or reverted; never fabricate evidence.

## File Structure

```
scripts/report-data.mjs        CREATE  model builder (pure functions, unit-tested)
scripts/report-template.html   CREATE  self-contained print template
scripts/generate-report.mjs    CREATE  CLI: date → model → HTML → PDF
tests/unit/report-data.test.mjs    CREATE  unit tests for the model/diff logic
tests/unit/update-history.test.mjs MODIFY  pdf flag coverage
scripts/update-history.mjs     MODIFY  record pdf:true per run
public/assets/dashboard.js     MODIFY  PDF download button in reports table
index.html                     MODIFY  reports section copy (PDFs now exist)
.github/workflows/evidence.yml MODIFY  generate-report step (continue-on-error)
tests/playwright/ia.spec.ts    MODIFY  homepage shows a PDF link for a run that has one
results/<date>/report.pdf      CREATE  backfilled for all 18 historical runs
```

---

### Task 1: Report model builder (`scripts/report-data.mjs`)

**Files:**
- Create: `scripts/report-data.mjs`, `tests/unit/report-data.test.mjs`

**Interfaces:**
- Produces (consumed by Task 2's renderer):
  - `buildReportModel({ probe, browser, prev })` →
    `{ generatedAt, environment: {cloudProvider, cloudRegion, runnerHost, dnsServer}, totals: {total, blocked, degraded, reachable}, changes: {newlyBlocked: [...names], recovered: [...names]}, services: [{name, tier, category, vendor, domain, verdict, httpCode, totalSec, dnsResolved}], browserFindings: [{name, verdict, failedCount}] }`
  - `diffVerdicts(prevServices, services)` → `{newlyBlocked, recovered}` keyed by id, name included.
  - `summarizeVerdicts(services)` → totals (reuse pattern from update-history).

- [ ] **Step 1: failing tests** — `tests/unit/report-data.test.mjs`:

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportModel, diffVerdicts } from '../../scripts/report-data.mjs';

const svc = (id, name, verdict) => ({ id, name, verdict, tier: 'curated', category: 'auth', vendor: 'google', domain: 'x.com', url: 'https://x.com', httpCode: '200', totalSec: 0.5, dnsResolved: true });

test('diffVerdicts finds newly blocked and recovered by id', () => {
  const prev = [svc('a', 'A', 'Reachable'), svc('b', 'B', 'Blocked'), svc('c', 'C', 'Reachable')];
  const now = [svc('a', 'A', 'Blocked'), svc('b', 'B', 'Reachable'), svc('c', 'C', 'Reachable')];
  const d = diffVerdicts(prev, now);
  assert.deepEqual(d.newlyBlocked.map(s => s.name), ['A']);
  assert.deepEqual(d.recovered.map(s => s.name), ['B']);
});

test('new targets in the current run are not "newly blocked"', () => {
  const d = diffVerdicts([], [svc('n', 'New', 'Blocked')]);
  assert.deepEqual(d.newlyBlocked, []);
});

test('buildReportModel assembles totals, changes, and ordering', () => {
  const probe = { generatedAt: '2026-09-30T04:57:48Z',
    environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
    services: [svc('a', 'A', 'Blocked'), svc('b', 'B', 'Reachable')] };
  const m = buildReportModel({ probe, browser: null, prev: { services: [svc('a', 'A', 'Reachable')] } });
  assert.equal(m.totals.total, 2);
  assert.equal(m.totals.blocked, 1);
  assert.deepEqual(m.changes.newlyBlocked.map(s => s.name), ['A']);
  assert.equal(m.services[0].verdict, 'Blocked'); // blocked first for the table
});
```

- [ ] **Step 2:** run `node --test tests/unit/report-data.test.mjs` → FAIL (module missing).
- [ ] **Step 3:** implement `scripts/report-data.mjs` (pure functions, `readFileSync` NOT used — data passed in):

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
// Pure report-model builder: no I/O, fully unit-testable.

export function summarizeVerdicts(services) {
  const t = { total: services.length, blocked: 0, degraded: 0, reachable: 0 };
  for (const s of services) {
    if (s.verdict === 'Blocked') t.blocked += 1;
    else if (s.verdict === 'Degraded') t.degraded += 1;
    else t.reachable += 1;
  }
  return t;
}

export function diffVerdicts(prevServices = [], services = []) {
  const prevById = new Map(prevServices.map(s => [s.id, s]));
  const newlyBlocked = [], recovered = [];
  for (const s of services) {
    const p = prevById.get(s.id);
    if (!p) continue;
    if (p.verdict !== 'Blocked' && s.verdict === 'Blocked') newlyBlocked.push(s);
    if (p.verdict === 'Blocked' && s.verdict !== 'Blocked' && s.verdict !== 'Degraded') recovered.push(s);
  }
  return { newlyBlocked, recovered };
}

const VERDICT_ORDER = { Blocked: 0, Degraded: 1, Reachable: 2 };

export function buildReportModel({ probe, browser, prev }) {
  const services = (probe.services || []).slice()
    .sort((a, b) => (VERDICT_ORDER[a.verdict] ?? 3) - (VERDICT_ORDER[b.verdict] ?? 3));
  return {
    generatedAt: probe.generatedAt,
    environment: probe.environment || {},
    totals: summarizeVerdicts(probe.services || []),
    changes: diffVerdicts(prev && prev.services, probe.services || []),
    services,
    browserFindings: (browser || []).map(f => ({
      name: f.name, verdict: f.verdict, failedCount: (f.failedRequests || []).length
    }))
  };
}
```

- [ ] **Step 4:** tests PASS. **Step 5:** commit `feat(report): report model builder with verdict diffing`.

### Task 2: Template + generator (`scripts/generate-report.mjs`)

**Files:**
- Create: `scripts/report-template.html`, `scripts/generate-report.mjs`

**Interfaces:**
- Consumes: Task 1 model; reads `results/<date>/probe.json`, `browser.json` (optional), previous dated `probe.json` for the diff; `results/<date>/screenshots/*.png` for the appendix.
- Produces: `results/<date>/report.pdf`. CLI: `node scripts/generate-report.mjs [--date YYYY-MM-DD]` (default: latest dated dir). Prints the output path + size; exits 1 with a clear message when the date has no probe.json.

- [ ] **Step 1: template** — `scripts/report-template.html` with `{{PLACEHOLDER}}` tokens: cover (title/date/environment/totals tiles), executive summary (newly blocked / recovered lines), full verdict table (name/tier/category/vendor/domain/http/total), browser findings table, screenshots appendix (one blocked-service screenshot per `<figure>`, embedded as `{{SHOT:<file>}}` → replaced with file:// paths by the generator), 中文摘要页 (总结数字 + 变化 + 环境信息). Inline `<style>` with the site palette (#0C1E3E navy, verdict colors #B42318/#B54708/#067647), `@page { size: A4; margin: 18mm }`, page-break rules per section, `.cn-page { page-break-before: always }`.
- [ ] **Step 2: generator** — read model files, build model, fill template (simple string replace of `__TOKEN__` markers), inject screenshot paths, write `report.tmp.html` next to the template, then:

```js
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + tmpHtmlPath, { waitUntil: 'load' });
await page.pdf({ path: outPath, format: 'A4', printBackground: true });
await browser.close();
```

- [ ] **Step 3: verify against real mainland data** — `node scripts/generate-report.mjs --date 2026-09-30` → PDF exists, 1–5 MB, opens (check `%PDF-` magic bytes + page count via file size sanity). Convert page 1 + 中文摘要页 to PNG (open the tmp HTML in chromium + screenshot, or `npx playwright screenshot` of the tmp file) for the review gate.
- [ ] **Step 4:** commit `feat(report): HTML template + Playwright PDF generator with --date backfill`.

### Task 3: history pdf flag + homepage download button

**Files:**
- Modify: `scripts/update-history.mjs`, `public/assets/dashboard.js`, `index.html`, tests.

- [ ] **Step 1:** `summarizeRun` gains `pdf: existsSync(join(resultsDir, date, 'report.pdf'))` — pass `resultsDir` in (adjust signature `summarizeRun(date, probeDoc, resultsDir)`; update existing unit test call sites). New unit test: run with a dummy `report.pdf` present in a tmp dir → `pdf: true`.
- [ ] **Step 2:** `dashboard.js` renderReports: last cell becomes a PDF link when `r.pdf` (`<a href="/results/<date>/report.pdf" download>PDF</a>` + a secondary "snapshot" link), else the current "snapshot" link.
- [ ] **Step 3:** `index.html` reports intro copy: "downloadable PDF reports arrive with the next milestone" → "Every run ships a downloadable PDF report."
- [ ] **Step 4:** ia.spec: regenerate `results/history.json` locally, assert the homepage reports table contains at least one `a[href$="/report.pdf"]` after the backfill in Task 5 (wire the test to today's run).

### Task 4: evidence workflow integration

**Files:**
- Modify: `.github/workflows/evidence.yml`

- [ ] After the "Install deps and browser checks" step, before "Verify live results bind mount":

```yaml
      - name: Generate weekly PDF report
        continue-on-error: true
        run: |
          node scripts/generate-report.mjs || echo "::warning::PDF generation failed; evidence still commits"
```

  (browser.json is written by the Playwright step before it — report includes browser findings; a failed browser pass still yields a network-only PDF.)
- [ ] **Step 2:** YAML parse check + commit `ci(evidence): generate weekly PDF with failure isolation`.

### Task 5: Backfill all historical runs

- [ ] Loop `for d in results/20*; do node scripts/generate-report.mjs --date $(basename $d) || true; done`; verify all 18 runs have `report.pdf`; `node scripts/update-history.mjs`; sizes sane (`du -sh results/*/report.pdf | sort -h | tail`). Total repo growth budget ≈ 40–70 MB — if any single PDF exceeds 6 MB, compress its screenshots section first (template scales images to 320px width; verify).
- [ ] **Step 2:** commit `feat(report): backfill weekly PDFs for all archived runs`.

### Task 6: Full verification + USER REVIEW GATE — stop

- [ ] `npm run validate:targets && npm run test:unit && npx playwright test` — all green; restore `results/` from any local-test noise except the legitimately backfilled PDFs + regenerated history.json.
- [ ] Push branch; CI green. Present: sample PDF (2026-09-30) first page + 中文摘要页 renders, homepage table with PDF buttons screenshot, backfill stats. **STOP — do not merge without sign-off; M4 plan comes after this gate.**
