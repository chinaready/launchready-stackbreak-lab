<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
# Target registry schema (v2)

Two registry files define what the lab measures. Both the network probe and the Playwright suite
read them; CI validates them with `npm run validate:targets`
([`scripts/validate-targets.mjs`](../scripts/validate-targets.mjs)).

| File | Contents |
|---|---|
| `targets.json` | Curated targets (full demo pages), `meta.vendors`, `platforms` (whole-stack kits). |
| `targets-community.json` | Community-submitted targets — network-probe only, no demo page. |

[`targets.schema.json`](targets.schema.json) is the formal JSON Schema for the single-document
shape (editor support via `"$schema"`). Cross-file and tier rules below are enforced by the
validator, which is the CI source of truth.

## `services[]` fields

| Field | Curated | Community | Description |
|---|---|---|---|
| `id` | required | required | Stable kebab-case slug (e.g. `google-fonts`). Key in results. |
| `name` | required | required | Human-readable service name. |
| `category` | required | required | One of `fonts`, `auth`, `analytics`, `embeds`, `payments`. New categories are a deliberate schema+validator change — discuss in an issue first. |
| `categories` | optional | required | Non-empty array; `category` must be one of its members. Powers the "by category" browsing dimension. |
| `vendor` | required | required | Key into `meta.vendors` in `targets.json`. Powers the "by service" browsing dimension. |
| `tier` | required (`curated`) | required (`community`) | Which participation tier the target belongs to. |
| `domain` | required | required | Host whose reachability defines the verdict. |
| `url` | required | required | Concrete `https://` URL the probe requests with `curl`. |
| `demoPath` | required | **forbidden** | Path to the single-dependency demo page. Community targets are network-only. |
| `symptom` | yes | optional | What a mainland user sees when the dependency fails. Surfaced on the Beijing View page. |
| `submittedBy` | — | required | GitHub handle of the submitter (attribution). |
| `addedAt` | — | required | `YYYY-MM-DD` date the target was accepted. |

## `meta.vendors` (targets.json only)

Map of vendor key → `{ "name": "...", "url": "https://..." }`. Every `vendor` reference in either
file — including `platforms[]` — must be declared here. Adding a new SaaS means declaring its
vendor key here first.

## `platforms[]` (targets.json only)

Whole-stack kits (Firebase, Netlify, Vercel): `{ id, name, vendor, resultsPath, probesFile }`.
`resultsPath` is the public results page (`/results/...`); `probesFile` points at the
`results/*-latest.json` the kit refreshes. Probe counts are computed at render time from
`probesFile` — never stored, so they cannot go stale.

## Cross-file rules (validator-enforced)

1. `id` values are unique across both files **and** `platforms[]`.
2. Every `vendor` exists in `meta.vendors`.
3. Community entries never set `demoPath`; curated entries always do.
4. Community entries require `submittedBy` and `addedAt`.
5. `category` must be a member of `categories` when `categories` is present.

## Community entry example

```json
{
  "id": "stripe-js",
  "name": "Stripe.js",
  "category": "analytics",
  "categories": ["analytics"],
  "vendor": "stripe",
  "tier": "community",
  "domain": "js.stripe.com",
  "url": "https://js.stripe.com/v3/",
  "submittedBy": "octocat",
  "addedAt": "2026-09-29"
}
```

## Verdict definitions

Time-based three-tier color code (industry practice), computed from the total
request time; any HTTP status still counts as connected:

| Verdict | Condition |
|---|---|
| `Reachable` | Connected, total time **< 1s** (`REACHABLE_MAX_S`). |
| `Degraded` | Connected, total time **1s–3s** (`BLOCKED_MIN_S`). |
| `Blocked` | Connected but total time **> 3s**, or connection failed / timed out (curl error, HTTP `000`). |

Archived runs before 2026-10-01 used the legacy code (failure-only Blocked, 5s
degraded threshold); their verdict fields were reclassified from the stored raw
metrics by `scripts/reclassify.mjs` — timings, HTTP codes, and curl exits are
never rewritten.
