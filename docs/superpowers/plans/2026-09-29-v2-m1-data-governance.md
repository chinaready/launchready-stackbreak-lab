# Stack Break Lab v2 — M1 Data & Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the v2 data layer — target registry upgrade (vendor/tier/categories), community registry, JSON-Schema-backed validation with CI, structured issue forms, labels, and a two-tier CONTRIBUTING — so community targets can enter the weekly mainland probe.

**Architecture:** Extend the existing `probe/targets.json` registry in place (backward compatible), add a sibling `probe/targets-community.json` for URL-only community targets, and gate both behind a dependency-free Node validator (`scripts/validate-targets.mjs`) that encodes the formal `probe/targets.schema.json` rules plus the cross-file rules JSON Schema cannot express. The bash probe merges both files at run time; the Playwright suite filters to `demoPath`-bearing targets.

**Tech Stack:** Bash + jq (existing probe), Node ≥18 ESM with `node:test` (new unit tests), GitHub Actions (new `validate-targets` workflow), GitHub Issue Forms (YAML).

**Spec:** `docs/superpowers/specs/2026-09-29-v2-dual-taxonomy-reports-community-design.md` (§1 Data model, §4 Participation flow, M1 row of §7). This plan covers **M1 only** — M2/M3/M4 plans are written after each user review gate.

## Global Constraints

- Site stays static, no backend, **no new npm dependencies at all** (validator is pure Node).
- `"type": "module"`, Node `>=18` (repo `package.json`).
- New source files carry the repo header: `// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0` (docs use HTML comment form).
- Categories are exactly `fonts | auth | analytics | embeds`; adding one is a deliberate schema+validator change.
- No production secrets or customer domains in registries, demos, or issue templates.
- Weekly evidence workflow schedule and methodology untouched in M1.
- Local probe runs are format checks only (verdicts are meaningless outside mainland China) and must be cleaned out of `results/` afterward — never commit a local run.
- `$schema` pointers in both registry files point at `./targets.schema.json` (single-document shape); cross-file and tier rules live in the validator and in `targets.schema.md` documentation.

## File Structure

```
probe/targets.json               MODIFY  v2: meta.vendors, platforms, per-service vendor/categories/tier
probe/targets-community.json     CREATE  community registry (seeded empty)
probe/targets.schema.json        CREATE  formal JSON Schema (single-document shape, draft-07)
probe/targets.schema.md          REWRITE document v2 fields, community rules, cross-file rules
scripts/validate-targets.mjs     CREATE  validator + CLI (pure Node)
tests/unit/validate-targets.test.mjs     CREATE  unit tests for validator rules
tests/unit/registries-pass-validation.test.mjs  CREATE  dogfood: committed files must validate
tests/playwright/stack-break.spec.ts     MODIFY  filter to services with demoPath (1 line)
probe/china-dependency-probe.sh          MODIFY  merge community file; emit tier+vendor per service
.github/workflows/validate-targets.yml   CREATE  CI gate on PR/push touching registries
.github/ISSUE_TEMPLATE/dependency-request.yml  MODIFY  add tier + vendor fields
.github/ISSUE_TEMPLATE/propose-saas-stack.yml  CREATE  whole-kit proposal form
package.json                     MODIFY  add validate:targets + test:unit scripts
CONTRIBUTING.md                  MODIFY  two-tier contribution flow
README.md                        MODIFY  one-line participation mention
```

---

### Task 1: Registry validator (`scripts/validate-targets.mjs`)

**Files:**
- Create: `scripts/validate-targets.mjs`
- Test: `tests/unit/validate-targets.test.mjs`

**Interfaces:**
- Produces (consumed by Task 2's dogfood test, the Task 5 CI workflow, and `npm run validate:targets`):
  - `validateRegistries(curated: object, community: object) => string[]` — list of human-readable errors; `[]` = valid.
  - `loadRegistries(root?: string) => { curated: object, community: object }` — reads `probe/targets.json` + `probe/targets-community.json` under root (default repo root), throws on missing/unparseable files.
  - CLI mode when run directly: exit 0 + `OK: N curated, M community, K platforms, V vendors`; exit 1 + `error: …` per line.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/validate-targets.test.mjs`:

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistries } from '../../scripts/validate-targets.mjs';

const vendors = { google: { name: 'Google' }, stripe: { name: 'Stripe' } };
const curatedBase = () => ({
  meta: { vendors },
  platforms: [{ id: 'firebase', name: 'Firebase', vendor: 'google',
    resultsPath: '/results/firebase.html', probesFile: 'firebase-latest.json' }],
  services: [{ id: 'google-fonts', name: 'Google Fonts', category: 'fonts',
    categories: ['fonts'], vendor: 'google', tier: 'curated',
    domain: 'fonts.googleapis.com', url: 'https://fonts.googleapis.com/css2',
    demoPath: '/demos/fonts-google.html', symptom: 'fallback typeface' }],
});
const communityBase = () => ({ services: [{ id: 'stripe-js', name: 'Stripe.js',
  category: 'analytics', categories: ['analytics'], vendor: 'stripe',
  tier: 'community', domain: 'js.stripe.com', url: 'https://js.stripe.com/v3/',
  submittedBy: 'octocat', addedAt: '2026-09-29' }] });

test('valid registries produce no errors', () => {
  assert.deepEqual(validateRegistries(curatedBase(), communityBase()), []);
});

test('curated service without demoPath fails', () => {
  const c = curatedBase(); delete c.services[0].demoPath;
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('demoPath')));
});

test('community service with demoPath fails', () => {
  const cm = communityBase(); cm.services[0].demoPath = '/demos/stripe.html';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('demoPath')));
});

test('community service missing submittedBy or addedAt fails', () => {
  const cm = communityBase(); delete cm.services[0].submittedBy; delete cm.services[0].addedAt;
  const errs = validateRegistries(curatedBase(), cm);
  assert.ok(errs.some(e => e.includes('submittedBy')));
  assert.ok(errs.some(e => e.includes('addedAt')));
});

test('duplicate id across the two files fails', () => {
  const cm = communityBase(); cm.services[0].id = 'google-fonts';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('duplicate id')));
});

test('unknown vendor fails (service and platform)', () => {
  const c = curatedBase(); c.services[0].vendor = 'googl';
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('unknown vendor "googl"')));
  const c2 = curatedBase(); c2.platforms[0].vendor = 'nope';
  assert.ok(validateRegistries(c2, communityBase()).some(e => e.includes('unknown vendor "nope"')));
});

test('http url, bad slug, bad category, category not in categories all fail', () => {
  const c = curatedBase();
  Object.assign(c.services[0], { url: 'http://x', id: 'Bad_Slug', category: 'payments' });
  const errs = validateRegistries(c, communityBase());
  assert.ok(errs.some(e => e.includes('https://')));
  assert.ok(errs.some(e => e.includes('slug')));
  assert.ok(errs.some(e => e.includes('category "payments"')));
});

test('empty meta.vendors fails; platform missing field fails; bad resultsPath fails', () => {
  const c = curatedBase(); delete c.meta;
  assert.ok(validateRegistries(c, communityBase()).some(e => e.includes('meta.vendors')));
  const c2 = curatedBase(); delete c2.platforms[0].probesFile;
  assert.ok(validateRegistries(c2, communityBase()).some(e => e.includes('probesFile')));
  const c3 = curatedBase(); c3.platforms[0].resultsPath = '/demos/x.html';
  assert.ok(validateRegistries(c3, communityBase()).some(e => e.includes('/results/')));
});

test('community file entry cannot set tier curated', () => {
  const cm = communityBase(); cm.services[0].tier = 'curated';
  assert.ok(validateRegistries(curatedBase(), cm).some(e => e.includes('tier')));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/unit/`
Expected: FAIL — cannot find module `../../scripts/validate-targets.mjs`

- [ ] **Step 3: Implement the validator**

Create `scripts/validate-targets.mjs`:

```js
#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Validates probe/targets.json + probe/targets-community.json (registry v2).
// targets.schema.json covers single-document shape for editor support; this
// validator is the CI source of truth and additionally enforces cross-file
// rules (id uniqueness, vendor existence) and tier-specific requirements.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CATEGORIES = ['fonts', 'auth', 'analytics', 'embeds'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS = /^https:\/\//;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateService(svc, where, vendors, errors, seenIds, defaultTier) {
  const label = `${where} "${svc?.id ?? '<missing id>'}"`;
  for (const f of ['id', 'name', 'category', 'domain', 'url', 'vendor']) {
    if (typeof svc?.[f] !== 'string' || svc[f].trim() === '') errors.push(`${label}: ${f} is required`);
  }
  if (typeof svc?.id === 'string' && SLUG.test(svc.id)) {
    if (seenIds.has(svc.id)) errors.push(`${label}: duplicate id "${svc.id}" (already used in this registry set)`);
    else seenIds.add(svc.id);
  } else {
    errors.push(`${label}: id must be a kebab-case slug (lowercase letters/digits/hyphens)`);
  }
  if (!CATEGORIES.includes(svc?.category)) errors.push(`${label}: category "${svc?.category}" not in [${CATEGORIES.join(', ')}]`);
  if (!HTTPS.test(svc?.url ?? '')) errors.push(`${label}: url must start with https://`);
  if (!vendors.has(svc?.vendor)) errors.push(`${label}: unknown vendor "${svc?.vendor}" (declare it in targets.json meta.vendors first)`);
  if (Array.isArray(svc?.categories)) {
    if (svc.categories.length === 0 || !svc.categories.every(c => CATEGORIES.includes(c)))
      errors.push(`${label}: categories must be a non-empty subset of [${CATEGORIES.join(', ')}]`);
    else if (!svc.categories.includes(svc.category))
      errors.push(`${label}: category "${svc.category}" must appear in categories [${svc.categories.join(', ')}]`);
  }
  const tier = svc?.tier ?? defaultTier;
  if (tier === 'curated') {
    if (!svc?.demoPath) errors.push(`${label}: curated targets require demoPath`);
  } else if (tier === 'community') {
    if (svc?.demoPath) errors.push(`${label}: community targets must not set demoPath (network-probe only)`);
    if (typeof svc?.submittedBy !== 'string' || svc.submittedBy.trim() === '') errors.push(`${label}: community targets require submittedBy (GitHub handle)`);
    if (!DATE_RE.test(svc?.addedAt ?? '')) errors.push(`${label}: community targets require addedAt as YYYY-MM-DD`);
  } else {
    errors.push(`${label}: tier must be "curated" or "community"`);
  }
}

export function validateRegistries(curated, community) {
  const errors = [];
  const vendors = new Map(Object.entries(curated?.meta?.vendors ?? {}));
  if (vendors.size === 0) errors.push('targets.json: meta.vendors must define at least one vendor');
  for (const [key, v] of vendors) {
    if (typeof v?.name !== 'string' || v.name.trim() === '') errors.push(`targets.json: meta.vendors.${key}.name is required`);
  }

  const seenIds = new Set();
  const svcs = Array.isArray(curated?.services) ? curated.services : (errors.push('targets.json: services must be an array'), []);
  svcs.forEach((s, i) => validateService(s, `targets.json services[${i}]`, vendors, errors, seenIds, 'curated'));

  const platforms = curated?.platforms;
  if (platforms !== undefined && !Array.isArray(platforms)) errors.push('targets.json: platforms must be an array');
  for (const [i, p] of (Array.isArray(platforms) ? platforms : []).entries()) {
    const label = `targets.json platforms[${i}]`;
    for (const f of ['id', 'name', 'vendor', 'resultsPath', 'probesFile'])
      if (typeof p?.[f] !== 'string' || p[f].trim() === '') errors.push(`${label}: ${f} is required`);
    if (SLUG.test(p?.id ?? '')) {
      if (seenIds.has(p.id)) errors.push(`${label}: duplicate id "${p.id}"`);
      else seenIds.add(p.id);
    }
    if (!vendors.has(p?.vendor)) errors.push(`${label}: unknown vendor "${p?.vendor}"`);
    if (typeof p?.resultsPath === 'string' && !/^\/results\//.test(p.resultsPath)) errors.push(`${label}: resultsPath must start with /results/`);
  }

  const csvcs = Array.isArray(community?.services) ? community.services : (errors.push('targets-community.json: services must be an array'), []);
  csvcs.forEach((s, i) => validateService(s, `targets-community.json services[${i}]`, vendors, errors, seenIds, 'community'));
  csvcs.forEach((s, i) => { if (s?.tier !== undefined && s.tier !== 'community') errors.push(`targets-community.json services[${i}]: tier must be "community"`); });
  return errors;
}

export function loadRegistries(root = ROOT) {
  const read = (f) => JSON.parse(readFileSync(join(root, 'probe', f), 'utf8'));
  return { curated: read('targets.json'), community: read('targets-community.json') };
}

const ranDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ranDirectly) {
  try {
    const { curated, community } = loadRegistries();
    const errors = validateRegistries(curated, community);
    if (errors.length > 0) {
      for (const e of errors) console.error(`error: ${e}`);
      process.exit(1);
    }
    console.log(`OK: ${curated.services.length} curated, ${community.services.length} community, ` +
      `${(curated.platforms ?? []).length} platforms, ${Object.keys(curated.meta.vendors).length} vendors`);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/unit/`
Expected: all PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-targets.mjs tests/unit/validate-targets.test.mjs
git commit -m "feat(registry): add dependency-free validator for v2 target registries"
```

---

### Task 2: Registry v2 upgrade + community seed + formal schema

**Files:**
- Modify: `probe/targets.json` (full rewrite, same services + new fields)
- Create: `probe/targets-community.json`
- Create: `probe/targets.schema.json`
- Rewrite: `probe/targets.schema.md`
- Test: `tests/unit/registries-pass-validation.test.mjs`

**Interfaces:**
- Consumes: `loadRegistries` / `validateRegistries` from Task 1.
- Produces: the v2 data model that Task 3 (probe merge) and M2 (site rendering) read:
  - curated service fields: `id, name, category, categories[], vendor, tier:"curated", domain, url, demoPath, symptom`
  - community service fields: `id, name, category, categories[], vendor, tier:"community", domain, url, submittedBy, addedAt` (no demoPath)
  - `meta.vendors`: `{ <key>: { name, url } }`
  - `platforms[]`: `{ id, name, vendor, resultsPath, probesFile }` (probe counts are computed at render time from `probesFile`, never stored — avoids stale counts)

- [ ] **Step 1: Write the failing dogfood test**

Create `tests/unit/registries-pass-validation.test.mjs`:

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistries, validateRegistries, CATEGORIES } from '../../scripts/validate-targets.mjs';

test('committed registries pass validation', () => {
  const { curated, community } = loadRegistries();
  assert.deepEqual(validateRegistries(curated, community), []);
});

test('registry v2 invariants hold', () => {
  const { curated, community } = loadRegistries();
  assert.ok(curated.services.length >= 11, 'curated services survive the v2 migration');
  for (const s of curated.services) {
    assert.equal(s.tier, 'curated');
    assert.ok(CATEGORIES.includes(s.category));
    assert.ok(curated.meta.vendors[s.vendor], `vendor ${s.vendor} declared`);
  }
  for (const s of community.services) assert.equal(s.tier, 'community');
  for (const p of curated.platforms) assert.match(p.resultsPath, /^\/results\//);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/unit/registries-pass-validation.test.mjs`
Expected: FAIL — `targets-community.json` not found, `meta.vendors` undefined

- [ ] **Step 3: Write `probe/targets.schema.json` (formal single-document schema)**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://stackbreak.launchready.cn/schemas/targets-v2.json",
  "title": "Stack Break Lab target registry v2",
  "description": "Single-document shape for probe/targets.json and probe/targets-community.json. Cross-file rules (id uniqueness across files, vendor existence, tier-specific fields) are enforced by scripts/validate-targets.mjs.",
  "type": "object",
  "required": ["services"],
  "properties": {
    "$schema": { "type": "string" },
    "description": { "type": "string" },
    "meta": {
      "type": "object",
      "properties": {
        "vendors": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["name"],
            "properties": {
              "name": { "type": "string", "minLength": 1 },
              "url": { "type": "string", "pattern": "^https://" }
            }
          }
        }
      }
    },
    "platforms": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "vendor", "resultsPath", "probesFile"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "name": { "type": "string", "minLength": 1 },
          "vendor": { "type": "string", "minLength": 1 },
          "resultsPath": { "type": "string", "pattern": "^/results/" },
          "probesFile": { "type": "string", "minLength": 1 }
        }
      }
    },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "category", "domain", "url", "vendor"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "name": { "type": "string", "minLength": 1 },
          "category": { "enum": ["fonts", "auth", "analytics", "embeds"] },
          "categories": { "type": "array", "minItems": 1, "items": { "enum": ["fonts", "auth", "analytics", "embeds"] } },
          "vendor": { "type": "string", "minLength": 1 },
          "tier": { "enum": ["curated", "community"] },
          "domain": { "type": "string", "minLength": 1 },
          "url": { "type": "string", "pattern": "^https://" },
          "demoPath": { "type": "string" },
          "symptom": { "type": "string" },
          "submittedBy": { "type": "string", "minLength": 1 },
          "addedAt": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Rewrite `probe/targets.json` to v2**

Keep the existing `description` and all 11 service objects **with their current values**, and add per service: `categories: [<same as category>]`, `vendor`, `tier: "curated"`. Vendor mapping for the 11: `google-fonts→google, material-symbols→google, adobe-typekit→adobe, recaptcha→google, auth0→auth0, google-signin→google, gtm→google, ga4→google, youtube→google, google-maps→google, vimeo→vimeo`. Change `"$schema"` to `"./targets.schema.json"` and add at top level:

```jsonc
  "meta": {
    "vendors": {
      "google": { "name": "Google", "url": "https://www.google.com" },
      "adobe": { "name": "Adobe", "url": "https://www.adobe.com" },
      "auth0": { "name": "Auth0", "url": "https://auth0.com" },
      "vimeo": { "name": "Vimeo", "url": "https://vimeo.com" },
      "netlify": { "name": "Netlify", "url": "https://www.netlify.com" },
      "vercel": { "name": "Vercel", "url": "https://vercel.com" }
    }
  },
  "platforms": [
    { "id": "firebase", "name": "Firebase", "vendor": "google", "resultsPath": "/results/firebase.html", "probesFile": "firebase-latest.json" },
    { "id": "netlify", "name": "Netlify", "vendor": "netlify", "resultsPath": "/results/netlify.html", "probesFile": "netlify-latest.json" },
    { "id": "vercel", "name": "Vercel", "vendor": "vercel", "resultsPath": "/results/vercel.html", "probesFile": "vercel-latest.json" }
  ],
```

- [ ] **Step 5: Create `probe/targets-community.json`**

```json
{
  "$schema": "./targets.schema.json",
  "description": "Community-submitted probe targets. Network-only (curl + dig, no Playwright, no demo page). Merged into the weekly mainland probe automatically after CI validation.",
  "services": []
}
```

- [ ] **Step 6: Rewrite `probe/targets.schema.md`**

Document: v2 field reference (all fields above); the two files and their tier rules; that `meta.vendors`/`platforms` live only in `targets.json`; the cross-file rules the validator enforces; one complete community example (Stripe.js from the unit-test fixture); how to run `npm run validate:targets`.

- [ ] **Step 7: Run tests + CLI**

Run: `node --test tests/unit/ && node scripts/validate-targets.mjs`
Expected: all tests PASS; CLI prints `OK: 11 curated, 0 community, 3 platforms, 6 vendors`

- [ ] **Step 8: Commit**

```bash
git add probe/targets.json probe/targets-community.json probe/targets.schema.json probe/targets.schema.md tests/unit/registries-pass-validation.test.mjs
git commit -m "feat(registry): upgrade targets to v2 (vendor/tier/categories), seed community registry, formal JSON Schema"
```

---

### Task 3: Probe script merges community targets

**Files:**
- Modify: `probe/china-dependency-probe.sh:19` (new `COMMUNITY_TARGETS` var), `:49-58` (tier/vendor extraction), `:93-104` (service object fields + merged source stream)

**Interfaces:**
- Consumes: `probe/targets.json` + `probe/targets-community.json` (Task 2).
- Produces: `results/<date>/probe.json` / `results/latest.json` services now carry `tier` (`"curated"|"community"`) and `vendor` string on every entry. `probe.md` table gains a `Tier` column.

- [ ] **Step 1: Edit the script**

After `TARGETS=...` (line 19) add:

```bash
COMMUNITY_TARGETS="$SCRIPT_DIR/targets-community.json"
```

In the read loop, after the `symptom=` line add:

```bash
  tier="$(echo "$row" | jq -r '.tier // "curated"')"
  vendor="$(echo "$row" | jq -r '.vendor // ""')"
```

Extend `service_obj` jq args (`--arg tier "$tier" --arg vendor "$vendor"`) and the object literal (`tier:$tier, vendor:$vendor` alongside `symptom:$symptom`).

Replace the loop source (line 104) with a merged stream:

```bash
if [ -f "$COMMUNITY_TARGETS" ]; then
  target_stream="$(jq -s '.[0].services + .[1].services' "$TARGETS" "$COMMUNITY_TARGETS")"
else
  target_stream="$(jq -c '.services' "$TARGETS")"
fi
```

(the `else` branch keeps the old single-file path for robustness), and change the loop trailer to `done < <(jq -c '.[]' <<<"$target_stream")`.

In the `probe.md` table header/rows add a Tier column: header `| Service | Tier | Category | Verdict | HTTP | Total (s) | DNS |` and row format `\(.name) | \(.tier) | …` (keep the existing column order otherwise).

- [ ] **Step 2: Local format verification + cleanup (never commit local runs)**

Run:

```bash
./probe/china-dependency-probe.sh
jq '.services[0] | {id, tier, vendor}' "results/$(date +%F)/probe.json"
git status --porcelain results/        # expect: local run modified latest.json + created results/<today>/
git restore results/latest.json 2>/dev/null || true
rm -rf "results/$(date +%F)"          # only if untracked (it is, unless today is a Monday evidence day)
git status --porcelain results/        # expect: empty
```

Expected: first `jq` shows `"tier": "curated", "vendor": "google"`; final status clean.

- [ ] **Step 3: Commit**

```bash
git add probe/china-dependency-probe.sh
git commit -m "feat(probe): merge community registry and emit tier+vendor per service"
```

---

### Task 4: Playwright suite skips demo-less targets

**Files:**
- Modify: `tests/playwright/stack-break.spec.ts:60` (the `for (const t of targets.services …)` loop header)

**Interfaces:**
- Consumes: Task 2 registry (curated file only — suite keeps reading `probe/targets.json`).
- Produces: no behavior change today (all 11 curated have `demoPath`); future URL-only curated entries are skipped instead of generating a broken test.

- [ ] **Step 1: Edit the loop**

```ts
// Community/URL-only targets have no demo page; only demoPath-bearing services get browser checks.
for (const t of (targets.services as Array<any>).filter((s) => s.demoPath)) {
```

- [ ] **Step 2: Run the suite**

Run: `npm test`
Expected: PASS with the same 11 generated per-service tests (plus existing suites).

- [ ] **Step 3: Commit**

```bash
git add tests/playwright/stack-break.spec.ts
git commit -m "test(playwright): skip registry targets without a demo page"
```

---

### Task 5: `validate:targets` npm scripts + CI workflow

**Files:**
- Modify: `package.json` (scripts block)
- Create: `.github/workflows/validate-targets.yml`

**Interfaces:**
- Consumes: Task 1 validator, Task 2 registries, Task 1 tests.
- Produces: `npm run validate:targets` and `npm run test:unit` commands; CI gate that blocks registry PRs on validation failure.

- [ ] **Step 1: Add npm scripts**

In `package.json` `scripts`, after `"probe"`:

```json
    "validate:targets": "node scripts/validate-targets.mjs",
    "test:unit": "node --test tests/unit/*.test.mjs",
```

- [ ] **Step 2: Create the workflow**

```yaml
name: validate-targets

# Dependency-free validation (pure Node) — safe on GitHub-hosted runners.
on:
  push:
    paths:
      - 'probe/targets.json'
      - 'probe/targets-community.json'
      - 'probe/targets.schema.json'
      - 'probe/targets.schema.md'
      - 'scripts/validate-targets.mjs'
      - 'tests/unit/**'
      - '.github/workflows/validate-targets.yml'
  pull_request:
    paths:
      - 'probe/targets.json'
      - 'probe/targets-community.json'
      - 'probe/targets.schema.json'
      - 'probe/targets.schema.md'
      - 'scripts/validate-targets.mjs'
      - 'tests/unit/**'
      - '.github/workflows/validate-targets.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate registries
        run: npm run validate:targets
      - name: Unit tests
        run: npm run test:unit
```

- [ ] **Step 3: Verify locally then on CI**

Run: `npm run validate:targets && npm run test:unit` → both succeed. Push the branch, then `gh run watch` (or `gh run list --workflow validate-targets`) → workflow green.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/validate-targets.yml
git commit -m "ci: gate registry changes behind validate-targets workflow"
```

---

### Task 6: Issue forms + labels

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/dependency-request.yml` (add Tier dropdown + SaaS vendor input)
- Create: `.github/ISSUE_TEMPLATE/propose-saas-stack.yml`

**Interfaces:**
- Consumes: Task 2 registry vocabulary (categories, vendors, tier names).
- Produces: structured submissions whose fields map 1:1 onto `targets-community.json` entries; labels `target-request, saas-request, approved, needs-info, community-tier` exist on the repo.

- [ ] **Step 1: Extend `dependency-request.yml`**

Insert after the `category` dropdown:

```yaml
  - type: dropdown
    id: tier
    attributes:
      label: Tier
      description: Community = network probe only (fastest, no code needed). Curated = full single-dependency demo page.
      options:
        - community (URL probe only — no demo page needed)
        - curated (full single-dependency demo page)
    validations:
      required: true

  - type: input
    id: vendor
    attributes:
      label: SaaS vendor
      description: The product family it belongs to (e.g. Stripe, Sentry, Algolia) — used for the "by service" browsing dimension
      placeholder: Stripe
    validations:
      required: true
```

Also update the intro markdown to mention: community-tier requests need no PR — a maintainer adds roughly ten lines to `probe/targets-community.json` and the next Monday run picks them up.

- [ ] **Step 2: Create `propose-saas-stack.yml`**

```yaml
name: SaaS stack deep-dive request
description: Propose a whole platform to probe end-to-end from mainland China (like the Firebase / Netlify / Vercel kits)
title: "[saas-stack] "
labels:
  - saas-request
body:
  - type: markdown
    attributes:
      value: |
        Whole-stack kits are a heavy lift: a deployed demo project plus probe scripts, maintained by the team.
        Use this form to make the case; community voting in Discussions helps prioritization.
  - type: input
    id: platform
    attributes:
      label: Platform name
      placeholder: Supabase
    validations:
      required: true
  - type: input
    id: site
    attributes:
      label: Vendor site
      placeholder: https://supabase.com
    validations:
      required: true
  - type: textarea
    id: capabilities
    attributes:
      label: Which capabilities matter
      description: e.g. auth, database, storage, functions, realtime, CDN
    validations:
      required: true
  - type: textarea
    id: why
    attributes:
      label: Why this platform for China-bound products
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      label: Acknowledgements
      options:
        - label: I understand kit acceptance and timeline are at maintainer discretion
          required: true
        - label: I will not include production secrets or customer domains
          required: true
```

- [ ] **Step 3: Verify YAML parses**

Run: `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in ['.github/ISSUE_TEMPLATE/dependency-request.yml','.github/ISSUE_TEMPLATE/propose-saas-stack.yml']]; print('YAML OK')"`
Expected: `YAML OK`

- [ ] **Step 4: Create labels (repo settings — via gh)**

```bash
gh label create target-request  --color 0E8A16 --description "Probe target proposal (community or curated)"
gh label create saas-request    --color 5319E7 --description "Whole-stack SaaS deep-dive proposal"
gh label create approved        --color BFD4F2 --description "Maintainer approved; ready for registry entry or PR"
gh label create needs-info      --color FBCA04 --description "Waiting on submitter details"
gh label create community-tier  --color D4C5F9 --description "Accepted as community (URL-only) target"
```

(Any that already exist will error harmlessly — skip and continue.)

- [ ] **Step 5: Maintainer manual step — Discussions (documented, not automatable in-repo)**

Enable Discussions and create a "Which SaaS next?" ideas category: repo Settings → General → Features → Discussions; then New discussion → choose category "Ideas", pin one starter thread. Do this at review time if desired; it needs no repo files.

- [ ] **Step 6: Commit**

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "feat(participation): tier+vendor fields on dependency requests, SaaS deep-dive form"
```

---

### Task 7: CONTRIBUTING + README participation rewrite

**Files:**
- Modify: `CONTRIBUTING.md`
- Modify: `README.md` (Contributing section only)

**Interfaces:**
- Consumes: Tasks 1–6 (file names, commands, labels, tiers).
- Produces: documented two-tier flow that submitters and maintainers follow.

- [ ] **Step 1: Rewrite the front of `CONTRIBUTING.md`**

Replace the current "Before you code" + intro with a "Two ways to add a target" structure (keep "One dependency per pull request", the demo-page guide for curated tier, "What maintainers will check", license/CoC sections unchanged; update "Local check" to add `npm run validate:targets`):

```markdown
## Two ways to add a target

### Community tier — fastest (no code)

1. Open a [Dependency request](…) issue; pick tier **community**.
2. On approval, either you or a maintainer adds ~10 lines to
   [`probe/targets-community.json`](probe/targets-community.json):

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
     "submittedBy": "your-github-handle",
     "addedAt": "2026-09-29"
   }
   ```

   (New vendors must also be declared in `meta.vendors` of `probe/targets.json`.)
3. Community targets are network-probe only (curl + dig, no demo page, no Playwright).
4. After merge, the **next Monday run** picks them up and they appear in `/results/`
   flagged as community.

### Curated tier — full demo page

The original flow, unchanged: approved issue → PR with demo page + `probe/targets.json`
entry (+ Playwright test only if needed) + hub link. Every curated target keeps its own
single-dependency page under [`demos/`](demos/).

## Local check before you push

```bash
npm run validate:targets   # registry schema + cross-file rules
npm run test:unit          # validator unit tests
docker compose up --build  # visit http://localhost:8080/demos/
npm install && npm test    # Playwright (demos should load locally)
./probe/china-dependency-probe.sh   # format check only outside mainland China — do not commit local runs
```
```

- [ ] **Step 2: README touch**

In the Contributing section, after "Open an issue first…", add one sentence: *"Community-tier targets (URL probe only, no code required) are the fast path — see [CONTRIBUTING.md](CONTRIBUTING.md)."*

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md README.md
git commit -m "docs: two-tier contribution flow (community URL probes + curated demos)"
```

---

### Task 8: M1 verification + USER REVIEW GATE — stop here

**Files:** none (verification only)

- [ ] **Step 1: Full local suite**

Run: `npm run validate:targets && npm run test:unit && npm test`
Expected: all green.

- [ ] **Step 2: Push branch + CI green**

Run: `git push -u origin v2-dual-taxonomy-design && gh run list --workflow validate-targets --limit 1`
Expected: workflow completed successfully.

- [ ] **Step 3: Present M1 for review — STOP and wait**

Present to the user: what shipped (registry v2 diff summary, validator, CI, issue forms, labels, docs), how a community target now travels from issue → registry → Monday run, and open questions for them to confirm (e.g. seed community targets to launch with, Discussions category creation, label colors). **Do not start M2.** After sign-off (and any added requirements), write the M2 plan via writing-plans.
