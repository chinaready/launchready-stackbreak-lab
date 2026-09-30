# Stack Break Lab v2 — M2 Dual-Dimension Browsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the dual-dimension browsing experience — a By-category/By-service dual-tab catalog (with community targets visible), a matrix overview page, results-viewer tier display, navigation + submit CTAs, and SEO entries.

**Architecture:** Zero-build, progressive enhancement over the existing static site. The static curated catalog stays as the no-JS baseline; new `catalog.js` renders the "By service" dimension and community blocks client-side from the registries (`/probe/targets.json` + `/probe/targets-community.json`) and live verdicts (`/results/latest.json`, platform `*-latest.json`) — the same fetch pattern `home.js` has used since launch. `demos/matrix.html` is a new static skeleton (full SEO head, noscript notice) filled by `matrix.js`.

**Tech Stack:** Vanilla ES5-style browser JS (repo style: IIFE, `var`, no frameworks), CSS in `lab.css`, Playwright for UI smoke tests, no new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-09-29-v2-dual-taxonomy-reports-community-design.md` (§2 Site IA, M2 row of §7). M1 (registry v2 + community tier) is merged on main.

## Global Constraints

- No JS required for the existing experience: the four curated category blocks in `demos/index.html` stay static HTML; JS only adds tabs/re-orders/badges. If every fetch fails, the page renders exactly as it does today.
- No new npm dependencies; no build step; no third-party JS/CSS (CDN dependencies are what this lab measures — never add one).
- Repo JS style: IIFE, `var`, `function`, double quotes avoided (match `home.js`), 2-space indent.
- Every verdict chip reuses the `.verdict <Blocked|Degraded|Reachable>` CSS classes; every generated card reuses `.dep-card` markup so existing styles apply.
- New pages follow the SEO baseline: canonical, OG, Twitter, JSON-LD `WebPage` + `BreadcrumbList`, favicon block, `theme-color`.
- Nav links ship **with** their pages: this milestone links Matrix only (Trends/Reports links arrive in M3/M4 — linking to 404s now would be worse). Noted deviation from spec §2's nav list.
- `aria-selected`/`role="tab"` semantics on the catalog switcher; `hidden` attribute (not `display:none` styling) for the inactive panel.
- Community targets link to `/public/results/` (they have no demo page); curated targets link to `demoPath`.
- Cache: registry/verdict fetches use `cache: 'no-store'` (matches home.js and nginx's `.json$` no-store).
- Unit-testable logic lives testable; UI verified with Playwright against a locally served site (`python3 -m http.server 8080` from repo root works; docker compose also fine).

## File Structure

```
public/assets/catalog.js           CREATE  dual-tab + by-service render + community blocks
public/assets/matrix.js            CREATE  matrix overview renderer
demos/index.html                   MODIFY  tab bar + panels + submit CTA + footer nav link
demos/matrix.html                  CREATE  matrix overview skeleton (SEO head + containers + noscript)
public/results/index.html          MODIFY  CATEGORY_LABELS += payments; community tier badge in rows
public/assets/lab.css              APPEND  .catalog-tab*, community badge, matrix (.mx-*) styles
tests/playwright/catalog.spec.ts   CREATE  UI smoke tests for tabs/community/matrix
sitemap.xml                        MODIFY  + /demos/matrix.html
llms.txt                           MODIFY  + matrix link
```

---

### Task 1: Dual-tab catalog + community visibility (`catalog.js`)

**Files:**
- Create: `public/assets/catalog.js`
- Modify: `demos/index.html` (catalog section + script include)
- Append: `public/assets/lab.css`
- Test: `tests/playwright/catalog.spec.ts`

**Interfaces:**
- Consumes: `/probe/targets.json` `{meta.vendors, platforms[], services[]}`, `/probe/targets-community.json` `{services[]}` (tier=community), `/results/latest.json` `services[]` with `tier`+`vendor`, `/results/{firebase,netlify,vercel}-latest.json` `probes[]`.
- Produces: DOM — `#panel-service` (by-vendor grouping), `#community-picks` block appended inside `#panel-category`, tab switcher behavior on `[data-catalog-tab]` buttons.

- [ ] **Step 1: Write the failing Playwright spec**

Create `tests/playwright/catalog.spec.ts`:

```ts
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const curated = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets.json'), 'utf8'));
const community = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets-community.json'), 'utf8'));
const vendorsWithContent = new Set([
  ...curated.services.map((s: any) => s.vendor),
  ...community.services.map((s: any) => s.vendor),
  ...curated.platforms.map((p: any) => p.vendor),
]);

test('catalog offers both tabs and keeps the static category panel by default', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-catalog-tab="category"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-category .cat-block').first()).toBeVisible();
  await expect(page.locator('#panel-service')).toBeHidden();
});

test('By-service tab groups every vendor with content', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await page.click('[data-catalog-tab="service"]');
  await expect(page.locator('#panel-service')).toBeVisible();
  await expect(page.locator('#panel-service')).not.toBeEmpty();
  for (const vendor of vendorsWithContent) {
    await expect(page.locator(`#panel-service [data-vendor-block="${vendor}"]`)).toBeVisible();
  }
});

test('community targets appear under their vendor with a community badge and in Community picks', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  for (const s of community.services) {
    await expect(page.locator(`#panel-service .dep-card[data-sid="${s.id}"] .dep-card--badge`)).toBeVisible();
    await expect(page.locator(`#community-picks .dep-card[data-sid="${s.id}"]`)).toBeVisible();
  }
});

test('community service cards link to the results viewer, curated cards to their demo', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await page.click('[data-catalog-tab="service"]');
  await expect(page.locator('#panel-service .dep-card[data-sid="stripe-js"]')).toHaveAttribute('href', '/public/results/');
  await expect(page.locator('#panel-service .dep-card[data-sid="google-fonts"]')).toHaveAttribute('href', '/demos/fonts-google.html');
});
```

- [ ] **Step 2: Run to verify failure**

Serve the site (`python3 -m http.server 8080` from repo root, background), then `npx playwright test tests/playwright/catalog.spec.ts`
Expected: FAIL — no `[data-catalog-tab]` elements exist.

- [ ] **Step 3: Edit `demos/index.html` catalog section**

Inside `<section class="block block--light" id="catalog">`, after the `.block__intro` paragraph, insert the tab bar, wrap the four existing `.cat-block` divs unchanged inside the category panel, and add the empty service panel + submit CTA:

```html
        <div class="catalog-tabs reveal" role="tablist" aria-label="Browse targets">
          <button class="catalog-tab" data-catalog-tab="category" id="tab-category" role="tab"
                  aria-selected="true" aria-controls="panel-category" type="button">By category</button>
          <button class="catalog-tab" data-catalog-tab="service" id="tab-service" role="tab"
                  aria-selected="false" aria-controls="panel-service" type="button">By service</button>
        </div>

        <div id="panel-category" role="tabpanel" aria-labelledby="tab-category">
          <!-- existing four .cat-block divs stay exactly here, unchanged -->
        </div>

        <div id="panel-service" role="tabpanel" aria-labelledby="tab-service" hidden>
          <noscript><p class="catalog-fallback">The by-service view needs JavaScript.
            <a href="../public/results/index.html">See the full verdict table instead.</a></p></noscript>
        </div>

        <p class="catalog-submit reveal">
          Missing a dependency you ship? <a class="btn btn--ghost" target="_blank" rel="noopener"
            href="https://github.com/chinaready/launchready-stackbreak-lab/issues/new?template=dependency-request.yml">Submit a target</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener"
            href="https://github.com/chinaready/launchready-stackbreak-lab/discussions/20">Vote: which SaaS next?</a>
        </p>
```

Add before `</body>` (after the home.js include): `<script src="../public/assets/catalog.js?v=20260930a"></script>`.

- [ ] **Step 4: Implement `public/assets/catalog.js`**

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Stack Break Lab — dual-dimension catalog. "By category" is the static baseline
// (untouched HTML); "By service" is rendered here from the registries. Community
// targets appear under their vendor with a badge and in a Community picks block
// appended to the category panel. Degrades to the static page on any fetch failure.
(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function verdictChip(verdict, label, pending) {
    var span = document.createElement('span');
    span.className = 'verdict ' + verdict + (pending ? ' is-pending' : '');
    span.textContent = label || verdict;
    return span;
  }

  function serviceCard(svc, verdict) {
    var a = document.createElement('a');
    a.className = 'dep-card' + (svc.tier === 'community' ? ' dep-card--community' : '');
    a.setAttribute('data-sid', svc.id);
    a.href = svc.tier === 'community' ? '/public/results/' : (svc.demoPath || '/public/results/');
    a.appendChild(el('span', svc.name, 'dep-card__name'));
    a.appendChild(el('span', svc.domain, 'dep-card__host'));
    var foot = el('span', null, 'dep-card__foot');
    if (svc.tier === 'community') foot.appendChild(el('span', 'community', 'dep-card--badge'));
    foot.appendChild(verdictChip(verdict || 'Reachable', verdict ? null : 'awaiting run', !verdict));
    a.appendChild(foot);
    return a;
  }

  function el(tag, text, className) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (className) n.className = className;
    return n;
  }

  function platformCard(p, probes) {
    var total = (probes || []).length;
    var blocked = (probes || []).filter(function (x) { return x.verdict === 'Blocked'; }).length;
    var verdict = total === 0 ? null : (blocked === total ? 'Blocked' : (blocked > 0 ? 'Degraded' : 'Reachable'));
    var a = document.createElement('a');
    a.className = 'dep-card dep-card--platform';
    a.setAttribute('data-sid', p.id);
    a.href = p.resultsPath;
    a.appendChild(el('span', p.name, 'dep-card__name'));
    a.appendChild(el('span', 'whole-stack kit', 'dep-card__host'));
    var foot = el('span', null, 'dep-card__foot');
    foot.appendChild(verdictChip(verdict || 'Reachable', total ? blocked + ' / ' + total + ' blocked' : 'awaiting run', !total));
    a.appendChild(foot);
    return a;
  }

  function vendorBlock(vendorKey, vendorMeta, cards) {
    var block = el('section', null, 'cat-block');
    block.setAttribute('data-vendor-block', vendorKey);
    var label = el('h3', null, 'cat-block__label');
    label.appendChild(document.createTextNode(vendorMeta.name + ' '));
    label.appendChild(el('small', cards.length + (cards.length === 1 ? ' target' : ' targets'), null));
    block.appendChild(label);
    var grid = el('div', null, 'dep-grid');
    cards.forEach(function (c) { grid.appendChild(c); });
    block.appendChild(grid);
    return block;
  }

  function render(registry, community, latest, platformProbes) {
    var panel = $('#panel-service');
    var catPanel = $('#panel-category');
    if (!panel) return;

    var byId = {};
    ((latest && latest.services) || []).forEach(function (s) { byId[s.id] = s; });

    var services = ((registry && registry.services) || []).concat((community && community.services) || []);
    var vendors = (registry && registry.meta && registry.meta.vendors) || {};
    var platforms = (registry && registry.platforms) || [];

    var byVendor = {};
    services.forEach(function (s) {
      (byVendor[s.vendor] = byVendor[s.vendor] || []).push(serviceCard(s, byId[s.id] && byId[s.id].verdict));
    });
    platforms.forEach(function (p) {
      (byVendor[p.vendor] = byVendor[p.vendor] || []).push(platformCard(p, platformProbes[p.id]));
    });

    clear(panel);
    Object.keys(byVendor).forEach(function (key) {
      if (!vendors[key]) return; // undeclared vendor: validator's job to catch upstream
      panel.appendChild(vendorBlock(key, vendors[key], byVendor[key]));
    });

    // Community picks block appended to the static category panel.
    var communitySvcs = ((community && community.services) || []);
    if (communitySvcs.length && catPanel && !$('#community-picks')) {
      var picks = el('section', null, 'cat-block');
      picks.id = 'community-picks';
      var label = el('h3', null, 'cat-block__label');
      label.appendChild(document.createTextNode('Community picks '));
      label.appendChild(el('small', communitySvcs.length + ' network-probe targets', null));
      picks.appendChild(label);
      var grid = el('div', null, 'dep-grid');
      communitySvcs.forEach(function (s) {
        grid.appendChild(serviceCard(s, byId[s.id] && byId[s.id].verdict));
      });
      picks.appendChild(grid);
      catPanel.appendChild(picks);
    }
  }

  function initTabs() {
    var buttons = $all('[data-catalog-tab]');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          var active = b === btn;
          b.setAttribute('aria-selected', active ? 'true' : 'false');
          b.classList.toggle('is-active', active);
          var panel = document.getElementById('panel-' + b.getAttribute('data-catalog-tab'));
          if (panel) panel.hidden = !active;
        });
      });
    });
    var active = $('[data-catalog-tab].is-active') || buttons[0];
    if (active) active.classList.add('is-active');
  }

  function boot() {
    initTabs();
    Promise.all([
      fetchJson('/probe/targets.json'),
      fetchJson('/probe/targets-community.json'),
      fetchJson('/results/latest.json'),
      fetchJson('/results/firebase-latest.json'),
      fetchJson('/results/netlify-latest.json'),
      fetchJson('/results/vercel-latest.json')
    ]).then(function (r) {
      render(r[0], r[1], r[2], {
        firebase: (r[3] && r[3].probes) || [],
        netlify: (r[4] && r[4].probes) || [],
        vercel: (r[5] && r[5].probes) || []
      });
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
```

- [ ] **Step 5: Append styles to `public/assets/lab.css`**

```css
/* ===== v2 dual-dimension catalog (2026-09-30) ===== */
.catalog-tabs { display: flex; gap: 8px; margin: 8px 0 24px; }
.catalog-tab {
  font: inherit; font-size: 14px; font-weight: 600; letter-spacing: 0.02em;
  padding: 8px 16px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(12, 30, 62, 0.18); background: transparent; color: inherit;
}
.catalog-tab.is-active { background: #0C1E3E; border-color: #0C1E3E; color: #fff; }
.catalog-fallback { font-style: italic; opacity: 0.8; }
.catalog-submit { margin-top: 28px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.dep-card--community .dep-card__name::after { content: ''; }
.dep-card--badge {
  display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 2px 8px; border-radius: 999px;
  background: rgba(109, 40, 217, 0.12); color: #5B21B6; border: 1px solid rgba(109, 40, 217, 0.35);
}
```

- [ ] **Step 6: Run the spec**

Run: `npx playwright test tests/playwright/catalog.spec.ts`
Expected: 4 PASS.

- [ ] **Step 7: Commit**

```bash
git add public/assets/catalog.js public/assets/lab.css demos/index.html tests/playwright/catalog.spec.ts
git commit -m "feat(catalog): By category / By service dual tab with community visibility"
```

---

### Task 2: Matrix overview page (`demos/matrix.html` + `matrix.js`)

**Files:**
- Create: `demos/matrix.html`, `public/assets/matrix.js`
- Append: `public/assets/lab.css`
- Test: extend `tests/playwright/catalog.spec.ts`

**Interfaces:**
- Consumes: same six JSON endpoints as Task 1.
- Produces: `#mx-table` — `<table>` with `thead` category columns + "Whole-stack kits" column, one `tbody` row per vendor (`tr[data-vendor]`), cells `td[data-cat]` containing verdict chips; each chip links to `demoPath` (curated) or `/public/results/` (community) or `resultsPath` (platforms).

- [ ] **Step 1: Write the failing test (append to catalog.spec.ts)**

```ts
test('matrix page renders one row per vendor and chips link correctly', async ({ page }) => {
  await page.goto('/demos/matrix.html', { waitUntil: 'domcontentloaded' });
  for (const vendor of vendorsWithContent) {
    await expect(page.locator(`#mx-table tr[data-vendor="${vendor}"]`)).toBeVisible();
  }
  await expect(page.locator('#mx-table td[data-cat="payments"] .mx-chip[data-sid="stripe-js"]')).toBeVisible();
  await expect(page.locator('#mx-table td[data-cat="analytics"] .mx-chip[data-sid="gtm"]')).toHaveAttribute('href', '/demos/gtm.html');
  await expect(page.locator('#mx-table td[data-cat="whole"] .mx-chip[data-sid="firebase"]')).toHaveAttribute('href', '/results/firebase.html');
});

test('matrix page noscript fallback is present without JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/demos/matrix.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mx-noscript')).toBeVisible();
  await ctx.close();
});
```

- [ ] **Step 2: Run to verify failure** — `npx playwright test tests/playwright/catalog.spec.ts` → the two new tests FAIL (page missing).

- [ ] **Step 3: Create `demos/matrix.html`**

Full SEO head copied from the `demos/index.html` pattern with: title `Stack Break Lab matrix — every dependency × every SaaS, latest China verdicts`; canonical `https://stackbreak.launchready.cn/demos/matrix.html`; matching OG/Twitter/JSON-LD (`WebPage` + `BreadcrumbList` Home → Matrix); same favicon block, `theme-color`, `chinaready.css` + `lab.css` includes; `site-header` + `site-footer` copied verbatim from `demos/index.html` (footer gains the Matrix link in Task 4, keep it consistent). Body:

```html
  <main>
    <section class="block block--light">
      <div class="home-wrap">
        <p class="block__eyebrow">Matrix</p>
        <h1 class="block__title">Every dependency × every SaaS<span class="period">.</span></h1>
        <p class="block__intro">
          One row per SaaS, one column per stack category. Cells carry the latest Beijing verdict —
          click through to the demo or the deep-dive results. Verdicts refresh weekly from the mainland node.
        </p>
        <p id="mx-noscript" class="catalog-fallback">This matrix needs JavaScript —
          but the same evidence is available in the <a href="../public/results/index.html">full verdict table</a>.</p>
        <div class="mx-scroll"><table id="mx-table" class="mx-table"><thead></thead><tbody></tbody></table></div>
        <p class="catalog-submit">
          <a class="btn btn--ghost" target="_blank" rel="noopener"
             href="https://github.com/chinaready/launchready-stackbreak-lab/issues/new?template=dependency-request.yml">Submit a target</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener"
             href="https://github.com/chinaready/launchready-stackbreak-lab/discussions/20">Vote: which SaaS next?</a>
        </p>
      </div>
    </section>
  </main>
  <script src="../public/assets/matrix.js?v=20260930a"></script>
```

Note: the noscript fallback uses the `hidden`-then-shown trick — without JS the paragraph stays visible because nothing unhides it; with JS, `matrix.js` sets `#mx-noscript` `hidden = true` on boot. (A `<noscript>` tag cannot be asserted by Playwright's JS-enabled check in reverse, so we invert it.)

- [ ] **Step 4: Implement `public/assets/matrix.js`**

```js
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Matrix overview: rows = SaaS vendors, columns = stack categories + whole-stack kits.
// Renders from the registries + latest evidence; degrades to a visible fallback notice.
(function () {
  var CATEGORY_LABELS = { fonts: 'Fonts & icons', auth: 'Auth & identity',
    analytics: 'Analytics & tags', embeds: 'Maps, media, embeds', payments: 'Payments' };
  var CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

  function el(tag, text, className) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (className) n.className = className;
    return n;
  }
  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function chip(href, name, verdict, community) {
    var a = el('a', null, 'mx-chip verdict ' + (verdict || 'Reachable'));
    if (community) a.classList.add('mx-chip--community');
    a.setAttribute('data-sid', name.id);
    a.href = href;
    a.appendChild(el('span', name.name, 'mx-chip__name'));
    a.appendChild(el('span', verdict ? verdict : '—', 'mx-chip__v'));
    return a;
  }

  function render(registry, community, latest, platformProbes) {
    var table = document.getElementById('mx-table');
    if (!table) return;
    var byId = {};
    ((latest && latest.services) || []).forEach(function (s) { byId[s.id] = s; });

    var services = ((registry && registry.services) || []).concat((community && community.services) || []);
    var platforms = (registry && registry.platforms) || [];
    var vendors = (registry && registry.meta && registry.meta.vendors) || {};

    var rows = {};
    services.forEach(function (s) {
      var r = rows[s.vendor] = rows[s.vendor] || {};
      (r[s.category] = r[s.category] || []).push({
        svc: s, verdict: byId[s.id] && byId[s.id].verdict,
        href: s.tier === 'community' ? '/public/results/' : (s.demoPath || '/public/results/')
      });
    });

    var thead = table.tHead; thead.appendChild(el('tr', null, null));
    thead.rows[0].appendChild(el('th', 'SaaS', 'mx-th mx-th--first'));
    CATEGORY_ORDER.forEach(function (c) { thead.rows[0].appendChild(el('th', CATEGORY_LABELS[c], 'mx-th')); });
    thead.rows[0].appendChild(el('th', 'Whole-stack kits', 'mx-th'));

    var tbody = table.tBodies[0];
    Object.keys(rows).concat(Object.keys(vendors).filter(function (v) {
      return platforms.some(function (p) { return p.vendor === v; }) && !rows[v];
    })).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).forEach(function (v) {
      if (!vendors[v]) return;
      var tr = el('tr', null, null);
      tr.setAttribute('data-vendor', v);
      tr.appendChild(el('th', vendors[v].name, 'mx-rowhead'));
      CATEGORY_ORDER.forEach(function (c) {
        var td = el('td', null, null); td.setAttribute('data-cat', c);
        (rows[v][c] || []).forEach(function (e) {
          td.appendChild(chip(e.href, e.svc, e.verdict, e.svc.tier === 'community'));
        });
        if (!td.firstChild) td.appendChild(el('span', '—', 'mx-none'));
        tr.appendChild(td);
      });
      var tdw = el('td', null, null); tdw.setAttribute('data-cat', 'whole');
      platforms.filter(function (p) { return p.vendor === v; }).forEach(function (p) {
        var probes = platformProbes[p.id] || [];
        var blocked = probes.filter(function (x) { return x.verdict === 'Blocked'; }).length;
        tdw.appendChild(chip(p.resultsPath, p, probes.length ? (blocked === probes.length ? 'Blocked' : (blocked ? 'Degraded' : 'Reachable')) : null, false));
      });
      if (!tdw.firstChild) tdw.appendChild(el('span', '—', 'mx-none'));
      tr.appendChild(tdw);
      tbody.appendChild(tr);
    });
  }

  function boot() {
    var notice = document.getElementById('mx-noscript');
    if (notice) notice.hidden = true;
    Promise.all([
      fetchJson('/probe/targets.json'),
      fetchJson('/probe/targets-community.json'),
      fetchJson('/results/latest.json'),
      fetchJson('/results/firebase-latest.json'),
      fetchJson('/results/netlify-latest.json'),
      fetchJson('/results/vercel-latest.json')
    ]).then(function (r) {
      render(r[0], r[1], r[2], {
        firebase: (r[3] && r[3].probes) || [],
        netlify: (r[4] && r[4].probes) || [],
        vercel: (r[5] && r[5].probes) || []
      });
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
```

- [ ] **Step 5: Append matrix styles to `lab.css`**

```css
/* ===== v2 matrix overview (2026-09-30) ===== */
.mx-scroll { overflow-x: auto; border: 1px solid rgba(12, 30, 62, 0.14); border-radius: 12px; }
.mx-table { border-collapse: collapse; width: 100%; font-size: 14px; min-width: 860px; }
.mx-table th, .mx-table td { padding: 10px 12px; border-bottom: 1px solid rgba(12, 30, 62, 0.08); text-align: left; vertical-align: top; }
.mx-table tr:last-child td { border-bottom: none; }
.mx-th { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; }
.mx-th--first, .mx-rowhead { position: sticky; left: 0; background: inherit; font-weight: 700; }
.mx-rowhead { white-space: nowrap; }
.mx-chip { display: inline-flex; flex-direction: column; gap: 2px; text-decoration: none;
  padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(12, 30, 62, 0.12); margin: 2px 4px 2px 0; min-width: 92px; }
.mx-chip:hover { border-color: rgba(12, 30, 62, 0.4); }
.mx-chip .mx-chip__name { font-weight: 600; color: inherit; }
.mx-chip .mx-chip__v { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.mx-chip.verdict.Blocked .mx-chip__v { color: #B42318; }
.mx-chip.verdict.Degraded .mx-chip__v { color: #B54708; }
.mx-chip.verdict.Reachable .mx-chip__v { color: #067647; }
.mx-chip--community { border-style: dashed; }
.mx-none { opacity: 0.3; }
```

- [ ] **Step 6: Run the spec** — `npx playwright test tests/playwright/catalog.spec.ts` → 6 PASS.

- [ ] **Step 7: Commit**

```bash
git add demos/matrix.html public/assets/matrix.js public/assets/lab.css tests/playwright/catalog.spec.ts
git commit -m "feat(matrix): vendor × category overview page"
```

---

### Task 3: Results viewer — payments label + community badge

**Files:**
- Modify: `public/results/index.html` (inline JS + row markup)

**Interfaces:**
- Consumes: `latest.json` services now include `tier` + `category: "payments"`.
- Produces: correct heading for the payments group; a `community` chip next to community service names.

- [ ] **Step 1: Edit `CATEGORY_LABELS`** (inline script, ~line 288):

```js
      var CATEGORY_LABELS = {
        fonts: 'Fonts and icons',
        auth: 'Auth and identity',
        analytics: 'Analytics and tags',
        embeds: 'Maps, media, embeds',
        payments: 'Payments and checkout'
      };
```

- [ ] **Step 2: Badge community rows** — in `renderServices`, replace `tr.appendChild(el('td', s.name));` with:

```js
            var nameTd = el('td');
            nameTd.appendChild(document.createTextNode(s.name));
            if (s.tier === 'community') nameTd.appendChild(el('span', 'community', 'dep-card--badge'));
            tr.appendChild(nameTd);
```
- [ ] **Step 3: Verify manually + via existing suite**

Run: `npx playwright test` (full) → all pass; then visit `http://localhost:8080/public/results/` and confirm a "Payments and checkout" group containing Stripe.js with a community badge and Sentry under Analytics.

- [ ] **Step 4: Commit**

```bash
git add public/results/index.html
git commit -m "feat(results): payments category label and community tier badge"
```

---

### Task 4: Navigation, CTAs, sitemap, llms.txt

**Files:**
- Modify: `demos/index.html` (hero CTA + footer), `demos/matrix.html` (footer), `demos/beijing-view.html` + 11 demo pages + `public/results/index.html` (footer Matrix link only)
- Modify: `sitemap.xml`, `llms.txt`

**Interfaces:**
- Produces: "Matrix view" CTA in the hero; `Matrix` link in every `cr-footer` "Learn" column; `https://stackbreak.launchready.cn/demos/matrix.html` in sitemap + llms.txt.

- [ ] **Step 1:** In `demos/index.html` hero CTA row, after the "See the Beijing view" button add `<a class="btn btn--ghost" href="./matrix.html">Matrix view</a>`.
- [ ] **Step 2:** In every page footer's Learn column, add `<li><a href="/demos/matrix.html" class="cr-footer-link">Matrix overview</a></li>` — pages: `demos/index.html`, `demos/matrix.html`, `demos/beijing-view.html`, the 11 demo pages, `public/results/index.html`, `public/results/{firebase,netlify,vercel}.html`.
- [ ] **Step 3:** `sitemap.xml` — add the matrix URL entry (same format as existing entries). `llms.txt` — add `- [Matrix overview](https://stackbreak.launchready.cn/demos/matrix.html): All dependencies × all SaaS vendors, latest verdicts` under Key pages.
- [ ] **Step 4: Verify + commit**

Run full `npx playwright test` (footer link assertions can be a quick `expect` added to catalog.spec.ts: hero CTA visible on `/demos/`).

```bash
git add -A
git commit -m "feat(ia): matrix navigation, submit CTAs, sitemap and llms entries"
```

---

### Task 5: Full verification + USER REVIEW GATE — stop here

- [ ] **Step 1:** `npm run validate:targets && npm run test:unit && npx playwright test` — all green. Clean any local run artifacts from `results/` (`git restore results/latest.json; rm -rf results/$(date +%F)`).
- [ ] **Step 2:** Capture review screenshots for the user: `npx playwright screenshot http://localhost:8080/demos/ /tmp/m2-home.png` and `.../demos/matrix.html /tmp/m2-matrix.png` (run with the static server up). Push branch; confirm `validate-targets` CI green.
- [ ] **Step 3:** Present M2 for review — screenshots, what shipped, how the dual tabs degrade without JS — and STOP. Do not start M3 until sign-off.
