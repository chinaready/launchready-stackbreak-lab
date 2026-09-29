<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
# Stack Break Lab v2 — dual taxonomy, weekly PDF reports, community targets

**Date:** 2026-09-29
**Status:** Approved design (pending implementation plan)
**Branch:** `v2-dual-taxonomy-design`

## Goals

1. Reorganize the site around **two browsing dimensions**: tech-stack category × popular SaaS service.
2. Accumulate a **weekly PDF report per evidence run** as a durable data asset, feeding future
   periodic (quarterly/annual) analysis.
3. Make the site and the GitHub project **easier to participate in**: users can submit probe targets
   and SaaS products through a structured, low-friction flow.

Constraints: keep every existing capability (weekly mainland evidence pipeline, single-dependency
demos, whole-stack kits, Beijing view, SEO/GEO baseline); the site stays **static with no backend**;
no new runtime frameworks.

## Decisions (from brainstorming, all confirmed by maintainer)

| Topic | Decision |
|---|---|
| Dual-dimension UX | Dual-tab catalog (**By category / By service**) **plus** a separate matrix overview page |
| Participation depth | Two tiers — community (URL-only probes) + curated (full demo pages) — pure GitHub flow, no backend |
| PDF storage | Committed to git under `results/<date>/report.pdf`, full history in repo; EN body + Chinese summary page |
| Periodic analysis | Time-series data (`timeline.json`) + Trends page now; quarterly PDF workflow reserved (manual trigger) |
| Implementation path | Lightweight data-driven rendering: registry JSON + client-side JS (extends the existing `home.js` fetch pattern); **no** static-site-generator migration |

Rejected alternatives: SSG rebuild (migration risk vs. benefit), dynamic form backend (hosting/ops
cost, mainland reachability), hand-maintained HTML for community targets (does not scale).

## 1. Data model

### 1.1 `probe/targets.json` → v2

Backward compatible: existing fields and `category` stay; the probe script needs no change to read it.

```jsonc
{
  "id": "google-fonts",
  "name": "Google Fonts",
  "category": "fonts",               // kept for backward compatibility
  "categories": ["fonts"],            // NEW: multi-category
  "vendor": "google",                 // NEW: SaaS-service dimension key
  "tier": "curated",                  // NEW: curated | community
  "domain": "fonts.googleapis.com",
  "url": "https://fonts.googleapis.com/css2?...",
  "demoPath": "/demos/fonts-google.html",  // optional for community tier
  "symptom": "..."
}
```

Top-level `meta.vendors` map defines vendor keys once: `google → { name: "Google", url }`,
`adobe`, `auth0`, `vimeo`, … .

### 1.2 Community registry — `probe/targets-community.json`

Same schema; requires only `id`, `name`, `vendor`, `categories`, `domain`, `url`, plus
`submittedBy` (GitHub handle) and `addedAt`. No `demoPath`. Community targets run **network probes
only** (curl + dig) — no Playwright, no demo page — so weekly run time is unaffected.

### 1.3 Platform kits enter the registry

New `platforms` section registers the whole-stack kits (Firebase, Netlify, Vercel) with `vendor`,
`resultsPath`, and probe-count summary. The By-service tab and matrix page render them as
first-class rows alongside single dependencies.

### 1.4 `probe/targets.schema.json`

Formal JSON Schema (today only a markdown doc exists). CI validates both registry files; invalid
PRs are blocked. Local command: `npm run validate:targets`.

### 1.5 `results/timeline.json`

Updated each evidence run by `scripts/update-timeline.mjs`:

```jsonc
{ "generatedAt": "...", "targets": {
    "google-fonts": [ { "d": "2026-06-24", "v": "Reachable", "t": 0.19 }, ... ]
} }
```

Append per run (~600 rows/year — negligible). `--rebuild` mode reconstructs the full file from
`results/<date>/probe.json` history if it is ever lost or corrupted. This is the data base for the
Trends page and future quarterly PDFs.

## 2. Site information architecture

Navigation gains **Matrix · Trends · Reports** links (hero CTA row + footer).

| Page | Change | Rendering |
|---|---|---|
| Home catalog (`demos/index.html`) | **By category / By service** dual tab. By-service groups all probes of one SaaS together (Google ×7, Firebase kit, …); platforms render as kit cards. Community targets appear in a dedicated "Community picks" block with a badge. | Existing static curated cards are **kept as the no-JS baseline**; new `catalog.js` enhances/re-orders client-side from merged registry + `latest.json` (same fetch pattern as `home.js`) |
| Matrix overview (new `demos/matrix.html`) | Rows = services + platform kits, columns = categories, cells = verdict colors, click-through to demos/results. | Static skeleton (full SEO head + noscript notice linking `latest.json`) + JS fill |
| Trends (new `public/results/trends.html`) | Per-target verdict-change timeline (when blocked/recovered), latency percentile trends, "this quarter: N newly blocked / M recovered" summary. | Hand-drawn SVG stripes — **zero chart libraries** (self-contained, mainland-reachable — the lab must not fail its own test) |
| Reports index (new `public/results/reports.html`) | History table of weekly PDFs, latest pinned on top. | 100% static — regenerated by CI each evidence run from `results/*` (works without JS) |
| Submit entry points (home, matrix, results CTA) | "Submit a target" button → GitHub Issue Form links. | Plain links, no backend |
| Existing demo pages / Beijing view / result pages | Unchanged except footer nav links. | — |

SEO: every new page follows the existing canonical/OG/JSON-LD baseline; `sitemap.xml` and
`llms.txt` gain the new entries once at launch (page set is small; no automation needed).

## 3. Evidence pipeline extension

The existing weekly flow (Monday cron → mainland self-hosted runner → curl/dig + Playwright →
commit `results/`) is unchanged; three steps append after probing:

```
probe (reads merged curated + community registry)
  ├─ curated targets: curl/dig + Playwright            (unchanged)
  ├─ community targets: curl/dig only, verdicts tagged tier in latest.json
  1. scripts/update-timeline.mjs        → append run to results/timeline.json
  2. PDF render                          → results/<date>/report.pdf
  3. single [evidence] commit + push     (data + timeline + PDF together)
```

### PDF report structure (`scripts/report-template.html` → Playwright `page.pdf()`)

Cover (date, node environment, verdict counts) → executive summary (changes vs. previous run:
newly blocked / recovered) → full target table (verdict, DNS/connect/total) → platform-kit
summaries → selected screenshots appendix → **Chinese summary page**. Target size 2–4 MB per week
(screenshots compressed before embedding), in line with the accepted repo-growth budget.

### Failure isolation

- PDF generation runs with `continue-on-error`; evidence data always commits. `scripts/generate-report.mjs --date YYYY-MM-DD` backfills any past run.
- A community target whose curl exit ≠ 0 and verdict = Blocked for 4 consecutive runs is flagged "unreachable" in the report; maintainers decide removal and ping the submitter on the source issue.

## 4. GitHub participation flow

```
Site "Submit a target" button
  → GitHub Issue Forms (YAML forms, structured fields — not bare markdown):
     ├─ propose-target.yml    (service name, official URL, category, why it matters)
     └─ propose-saas-stack.yml (whole-kit proposal — heavy; maintainer evaluated)
  → maintainer labels: approved / needs-info
  → two merge paths:
     a) maintainer commits to probe/targets-community.json directly (≤10 lines, fastest)
     b) contributor PRs it following CONTRIBUTING (for attribution)
  → CI validate-targets workflow: schema + duplicate-id + URL-format checks block bad PRs
  → next weekly run picks it up (or manual dispatch for immediate effect)
  → site renders it automatically (client-side; no HTML edits)
```

- Labels: `target-request`, `saas-request`, `approved`, `needs-info`, `community-tier`.
- Discussions category **"Which SaaS next?"** for lightweight voting (also the fallback channel
  when GitHub itself is slow from the mainland — accepted constraint for contributors, who are
  developers).
- `CONTRIBUTING.md` rewrite: the two tiers, schema, `npm run validate:targets`, expectation that
  approved targets appear on the next Monday run.
- Abuse control is the human merge gate; no extra machinery.

## 5. Error handling & degradation

| Scenario | Behavior |
|---|---|
| Client-side JSON fetch fails | Home keeps the full static curated catalog (JS is enhancement-only). Matrix/Trends degrade to a noscript notice + link to `latest.json`. Reports page is fully static, unaffected. |
| PDF generation fails | Warning only; evidence still commits; backfill script available. |
| `timeline.json` lost/corrupt | `update-timeline.mjs --rebuild` from dated probe history. |
| Community target dies | 4-run unreachable flag → maintainer removal decision. |
| Registry invalid | CI blocks the PR before main. |
| Repo growth | Accepted (~2–4 MB/week). Semi-annual review; Releases archiving reserved as a fallback, not built now. |

## 6. Testing (zero new runtime dependencies)

- **Unit (node:test):** schema validator (valid/invalid fixtures), timeline append idempotence +
  rebuild, registry merge logic.
- **Playwright smoke (extend `tests/`, reuse existing harness):** dual-tab switch renders card
  counts matching the registry; matrix rows/columns complete; Trends SVG non-empty; reports links
  resolve.
- **PDF:** run generator against fixture data locally; assert non-empty artifact; visual review of
  issue #1 by maintainer.
- **CI:** new `validate-targets` workflow (on PR); one manual `evidence` dispatch as regression
  before merging pipeline changes.

## 7. Milestones (each independently shippable and revertible)

| # | Scope | User-visible effect |
|---|---|---|
| M1 Data & governance | targets v2 schema, community registry, JSON Schema + validate CI, Issue Forms, labels, CONTRIBUTING rewrite | Participation channel open; community targets can enter probing |
| M2 Dual-dimension browsing | `catalog.js` dual-tab catalog (community block), matrix page, vendors meta, nav + CTAs, sitemap/llms | Site redesign live: both dimensions + community targets visible |
| M3 Weekly PDF reports | report template + generator, PDF pipeline step only (failure-isolated), static `reports.html` index refreshed by CI, backfill script | A downloadable weekly data asset |
| M4 Trends | timeline update pipeline step + updater (`--rebuild`), Trends page (hand-drawn SVG), sitemap/llms entry for the Trends page, quarterly-PDF `workflow_dispatch` stub | Data-asset showcase complete |

Dependencies: M3 needs M1's registry fields; M2 and M3 are parallelizable; M4 needs M3's timeline
semantics defined first.

## Out of scope (explicit)

- Any dynamic backend / API / auth (Cloudflare Worker or otherwise).
- Static-site-generator migration (revisit only if page count grows an order of magnitude).
- Automated quarterly/annual PDF generation (manual dispatch stub only until data accumulates).
- Releases-based PDF archiving, bot-automated issue-to-PR flows.
- Changes to the mainland probe methodology or the weekly schedule.
