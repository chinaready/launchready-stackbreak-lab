# Beijing View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `demos/beijing-view.html` — a single page that shows the 11 tracked dependencies exactly as observed from Beijing, identical for every visitor regardless of location or VPN.

**Architecture:** Hybrid "recorded snapshot replay". The page is plain static HTML + vanilla JS (no build step), served from the repo root by nginx. It `fetch`es `/results/latest.json` (the Beijing probe + Playwright snapshot) and renders one evidence card per service: a real Beijing screenshot plus an evidence panel (verdict, HTTP, timing, requests, expected symptom). Because every card is driven by recorded Beijing data — never by live loads in the visitor's browser — the page looks the same from anywhere. An optional per-card "Compare with my browser" loads the resource live to dramatize the contrast.

**Tech Stack:** Static HTML/CSS, vanilla ES5-style JS (matches `public/assets/home.js`), Chinaready Design System CSS (`chinaready.css` + `lab.css`), Playwright for tests, bash + jq for the probe.

**Scope:** Phase 1 only (the page + `symptom` data, no ops changes). Phase 2 (server-side heartbeat cron, visitor-region endpoint) is captured as an appendix for a future plan.

---

## File Structure

| File | Responsibility |
|---|---|
| `probe/targets.json` | EDIT — add `symptom` string to each of the 11 services (canonical source of the "expected China symptom" copy). |
| `probe/targets.schema.md` | EDIT — document the new `symptom` field. |
| `probe/china-dependency-probe.sh` | EDIT — pass `symptom` through into `results/latest.json` `services[]` so the served snapshot carries it. |
| `demos/beijing-view.html` | CREATE — page shell: head, hero, heartbeat strip container, gallery container, footer. |
| `public/assets/beijing-view.css` | CREATE — gallery / card / evidence-panel / heartbeat / compare styling, DS-aligned. |
| `public/assets/beijing-view.js` | CREATE — fetch `/results/latest.json`, join `services[]`+`browser[]`, render heartbeat + cards, handle compare + graceful failure. |
| `demos/index.html` | EDIT — add a link to the Beijing View page. |
| `tests/playwright/beijing-view.spec.ts` | CREATE — TDD specs; mock `/results/latest.json`, prove rendering is independent of the viewer's network. |

**Conventions to follow (already in the codebase):**
- Demo pages link CSS with a relative `../public/assets/...` path and a `?v=` cache-bust query; they fetch JSON with root-absolute `/results/...` paths. Match this.
- JS is IIFE, ES5-ish, no framework, uses `document.createElement` helpers (see `public/assets/home.js`).
- Verdict chips use `class="verdict Blocked|Degraded|Reachable"` (styled in `lab.css`).

**Local serving for tests:** the site uses root-absolute `/results/...` and `/demos/...` paths, so serving the repo root works. Use either `docker compose up --build` (→ `http://localhost:8080`) or, for a quick static server, `python3 -m http.server 8080` run from the repo root. Playwright's `baseURL` defaults to `http://localhost:8080`.

---

## Task 1: Add `symptom` data to targets + probe passthrough

**Files:**
- Modify: `probe/targets.json` (all 11 service objects)
- Modify: `probe/targets.schema.md`
- Modify: `probe/china-dependency-probe.sh:50-101`

- [ ] **Step 1: Add `symptom` to every service in `probe/targets.json`**

Add a `symptom` key to each object. Use this exact copy (sourced from each demo's `data-symptom`, condensed):

```json
"google-fonts":     "Fallback typeface and layout shift while the page waits for fonts that never arrive.",
"material-symbols":  "Icon glyphs render as empty boxes or raw ligature text when the icon font never loads.",
"adobe-typekit":     "Text falls back to system fonts; branded type and weights never apply.",
"recaptcha":         "The CAPTCHA widget never renders, so forms and sign-up cannot be submitted.",
"auth0":             "The login widget stalls or loads slowly, delaying or blocking sign-in.",
"google-signin":     "The Google sign-in button never appears, locking out that login path.",
"gtm":               "Tag Manager fails to load, so downstream tags and events never fire.",
"ga4":               "Analytics never initializes; pageviews and events go uncollected.",
"youtube":           "The video area stays blank/black — player chrome and thumbnail never load.",
"google-maps":       "The map collapses into an empty grey box with no tiles or controls.",
"vimeo":             "The Vimeo player stays blank — the embed iframe never finishes loading."
```

Apply by editing each object, e.g. for `google-fonts`:

```json
    {
      "id": "google-fonts",
      "name": "Google Fonts",
      "category": "fonts",
      "domain": "fonts.googleapis.com",
      "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
      "demoPath": "/demos/fonts-google.html",
      "symptom": "Fallback typeface and layout shift while the page waits for fonts that never arrive."
    },
```

Do the same for the other 10 objects, using the matching copy above.

- [ ] **Step 2: Document the field in `probe/targets.schema.md`**

Add a row/line describing it (match the file's existing style):

```markdown
- `symptom` (string, required): one-line description of what a user in mainland China sees when this dependency fails. Surfaced on the Beijing View page.
```

- [ ] **Step 3: Pass `symptom` through the probe into `latest.json`**

In `probe/china-dependency-probe.sh`, read the field and include it in the service object.

After line 56 (`demo="$(echo "$row" | jq -r '.demoPath')"`) add:

```bash
  symptom="$(echo "$row" | jq -r '.symptom // ""')"
```

Then change the `service_obj` builder (lines 91-99) to thread it through:

```bash
  service_obj="$(jq -n \
    --arg id "$id" --arg name "$name" --arg category "$category" --arg domain "$domain" \
    --arg url "$url" --arg demoPath "$demo" --arg symptom "$symptom" \
    --arg httpCode "$http_code" --argjson connectSec "${connect_s:-0}" --argjson sslSec "${ssl_s:-0}" \
    --argjson totalSec "${total_s:-0}" --argjson curlExit "$curl_exit" \
    --argjson dnsResolved "$dns_resolved" --arg verdict "$verdict" \
    '{id:$id,name:$name,category:$category,domain:$domain,url:$url,demoPath:$demoPath,symptom:$symptom,
      httpCode:$httpCode,connectSec:$connectSec,sslSec:$sslSec,totalSec:$totalSec,
      curlExit:$curlExit,dnsResolved:$dnsResolved,verdict:$verdict}')"
```

- [ ] **Step 4: Verify targets.json is valid JSON and the probe emits `symptom`**

Run:
```bash
jq -e '.services | length == 11 and all(.[]; has("symptom") and (.symptom | length > 0))' probe/targets.json
```
Expected: prints `true`.

If `curl`, `dig`, and `jq` are available, also run the probe and confirm passthrough (verdicts will be "Reachable" outside China — that's fine, we only check the field exists):
```bash
./probe/china-dependency-probe.sh >/dev/null && jq -e '.services[0] | has("symptom")' results/latest.json
```
Expected: prints `true`. (If `dig`/`curl` aren't installed locally, skip this sub-check; the `jq` check on targets.json is the gate.)

- [ ] **Step 5: Commit**

```bash
git add probe/targets.json probe/targets.schema.md probe/china-dependency-probe.sh
git commit -m "probe: add per-service symptom copy and thread it into latest.json"
```

---

## Task 2: Page shell (HTML) + base styles

**Files:**
- Create: `demos/beijing-view.html`
- Create: `public/assets/beijing-view.css`
- Test: `tests/playwright/beijing-view.spec.ts`

- [ ] **Step 1: Write the failing test for the shell**

Create `tests/playwright/beijing-view.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('beijing-view shell renders hero, heartbeat and gallery containers', async ({ page }) => {
  await page.goto('/demos/beijing-view.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bv-hero')).toBeVisible();
  await expect(page.locator('#bv-heartbeat')).toBeAttached();
  await expect(page.locator('#bv-gallery')).toBeAttached();
  await expect(page).toHaveTitle(/Beijing/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (start a server first in another terminal: `python3 -m http.server 8080` from repo root):
```bash
npx playwright test beijing-view.spec.ts -g "shell renders" --project=chromium
```
Expected: FAIL — navigation 404s / locators not found (page does not exist yet).

- [ ] **Step 3: Create `demos/beijing-view.html`**

```html
<!-- Copyright (c) 2026 Chinaready. All rights reserved. -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Beijing View — Stack Break Lab</title>
  <meta name="description" content="See these foreign web dependencies exactly as a browser in Beijing sees them — identical from anywhere, VPN or not. Recorded on a mainland China node." />
  <link rel="icon" href="../public/assets/brand/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="../public/assets/brand/mark.svg" />
  <link rel="apple-touch-icon" href="../public/assets/brand/apple-touch-icon.png" />
  <link rel="manifest" href="../public/assets/brand/site.webmanifest" />
  <meta name="theme-color" content="#0C1E3E" />
  <link rel="stylesheet" href="../public/assets/chinaready.css?v=20260624a" />
  <link rel="stylesheet" href="../public/assets/lab.css?v=20260625b" />
  <link rel="stylesheet" href="../public/assets/beijing-view.css?v=20260626a" />
</head>
<body class="bv">
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="./index.html">
        <img class="brand__logo" src="../public/assets/brand/logo-horizontal.svg" alt="Chinaready" width="140" height="28" />
        <span class="brand__sep" aria-hidden="true"></span>
        <span class="brand__lab">Stack Break Lab</span>
      </a>
      <p class="tagline">Executed on launchready.cn mainland China infrastructure</p>
    </div>
  </header>

  <main>
    <section class="bv-hero">
      <div class="wrap">
        <p class="eyebrow">Beijing view</p>
        <h1>You are seeing this from Beijing<span class="period">.</span></h1>
        <p class="lede">
          Wherever you are, VPN on or off, everything below is what a browser in
          <strong>Beijing</strong> actually sees for these dependencies — recorded on a mainland
          China node, not loaded from your network.
        </p>
        <div id="bv-heartbeat" class="bv-hb" role="group" aria-label="Beijing snapshot status"></div>
      </div>
    </section>

    <section class="wrap">
      <div id="bv-gallery"></div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <img class="site-footer__logo" src="../public/assets/brand/logo-horizontal-white.svg" alt="Chinaready" width="130" height="26" />
      <p class="disclaimer">
        Single-node snapshot from a Beijing node. Results vary by carrier, region, and time, and
        do not constitute a legal or compliance conclusion.
      </p>
      <p class="site-footer__links">
        <a href="./index.html">All demos</a> &middot;
        <a href="../public/results/index.html">Latest results</a> &middot;
        <a href="https://github.com/chinaready/launchready-stackbreak-lab">GitHub</a>
      </p>
    </div>
  </footer>

  <script src="../public/assets/beijing-view.js?v=20260626a"></script>
</body>
</html>
```

- [ ] **Step 4: Create `public/assets/beijing-view.css` (base shell styles)**

```css
/* Stack Break Lab — Beijing View page. Builds on chinaready.css + lab.css tokens. */

.bv-hero {
  background: var(--cr-primary);
  color: #fff;
  padding: var(--cr-space-9) 0 var(--cr-space-7);
}
.bv-hero .eyebrow { color: var(--cr-accent, #7CF5C6); }
.bv-hero h1 { color: #fff; margin: var(--cr-space-3) 0; }
.bv-hero .lede { color: rgba(255,255,255,0.82); max-width: 60ch; }

/* Heartbeat strip */
.bv-hb {
  display: flex; flex-wrap: wrap; gap: var(--cr-space-4);
  align-items: center; justify-content: space-between;
  margin-top: var(--cr-space-6);
  padding: var(--cr-space-4) var(--cr-space-5);
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--cr-radius-card, 12px);
  font-size: 0.95rem;
}
.bv-hb__node { display: inline-flex; align-items: center; gap: var(--cr-space-2); color: rgba(255,255,255,0.9); }
.bv-hb__counts { display: inline-flex; gap: var(--cr-space-4); }
.bv-hb__count { display: inline-flex; align-items: center; gap: var(--cr-space-2); }
.bv-hb__num { font-weight: var(--cr-fw-bold, 700); }
```

(`.live-dot` already exists in the DS/home styles; if it does not render here, it is added in Task 3 CSS.)

- [ ] **Step 5: Run the shell test to verify it passes**

Run:
```bash
npx playwright test beijing-view.spec.ts -g "shell renders" --project=chromium
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add demos/beijing-view.html public/assets/beijing-view.css tests/playwright/beijing-view.spec.ts
git commit -m "beijing-view: page shell (hero + heartbeat + gallery containers)"
```

---

## Task 3: Render heartbeat + cards from the snapshot (core JS), independent of viewer network

This is the heart of the feature: cards must render purely from recorded data, so the page is identical from anywhere.

**Files:**
- Create: `public/assets/beijing-view.js`
- Modify: `public/assets/beijing-view.css` (card/gallery styles)
- Test: `tests/playwright/beijing-view.spec.ts` (add cases)

- [ ] **Step 1: Add failing tests (data-driven rendering + network independence)**

Append to `tests/playwright/beijing-view.spec.ts`:

```ts
// A compact fixture matching results/latest.json shape (11 services + browser[]).
function fixture() {
  const defs = [
    ['google-fonts', 'Google Fonts', 'fonts', 'fonts.googleapis.com', 'Reachable', '200', 0.42, 0],
    ['material-symbols', 'Material Symbols', 'fonts', 'fonts.googleapis.com', 'Reachable', '200', 0.14, 0],
    ['adobe-typekit', 'Adobe Fonts (Typekit)', 'fonts', 'use.typekit.net', 'Reachable', '404', 1.15, 0],
    ['recaptcha', 'Google reCAPTCHA', 'auth', 'www.google.com', 'Blocked', '000', 10.0, 28],
    ['auth0', 'Auth0', 'auth', 'cdn.auth0.com', 'Degraded', '200', 6.52, 0],
    ['google-signin', 'Google Sign-In', 'auth', 'accounts.google.com', 'Blocked', '000', 10.0, 28],
    ['gtm', 'Google Tag Manager', 'analytics', 'www.googletagmanager.com', 'Reachable', '200', 0.24, 0],
    ['ga4', 'Google Analytics 4', 'analytics', 'www.googletagmanager.com', 'Reachable', '200', 0.26, 0],
    ['youtube', 'YouTube embed', 'embeds', 'www.youtube.com', 'Blocked', '000', 10.0, 28],
    ['google-maps', 'Google Maps', 'embeds', 'maps.googleapis.com', 'Blocked', '000', 10.0, 28],
    ['vimeo', 'Vimeo embed', 'embeds', 'player.vimeo.com', 'Blocked', '000', 10.0, 28],
  ] as const;
  // A served local image so screenshots load even with external requests blocked.
  const shot = '/results/2026-06-24/screenshots/google-fonts.png';
  return {
    generatedAt: '2026-06-24T14:42:13Z',
    environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
    services: defs.map(([id, name, category, domain, verdict, httpCode, totalSec, curlExit]) => ({
      id, name, category, domain, url: `https://${domain}/probe-${id}`, demoPath: `/demos/${id}.html`,
      symptom: `Expected symptom for ${name}.`, httpCode, connectSec: 0, sslSec: 0, totalSec, curlExit,
      dnsResolved: true, verdict,
    })),
    browser: defs.map(([id]) => ({ id, demoPath: `/demos/${id}.html`, failedRequests: [], verdict: 'Blocked', screenshotPath: shot })),
  };
}

async function mountWithFixture(page: import('@playwright/test').Page) {
  await page.route('**/results/latest.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture()) }));
  // Block ALL external (non-localhost) requests to prove the page does not depend on the viewer's network.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
    return route.abort();
  });
  await page.goto('/demos/beijing-view.html', { waitUntil: 'networkidle' });
}

test('renders one card per service, independent of the viewer network', async ({ page }) => {
  await mountWithFixture(page);
  await expect(page.locator('.bv-card')).toHaveCount(11);
});

test('heartbeat shows verdict counts and the Beijing snapshot time', async ({ page }) => {
  await mountWithFixture(page);
  const hb = page.locator('#bv-heartbeat');
  await expect(hb).toContainText('cn-beijing-h');
  await expect(hb.locator('.verdict.Blocked')).toContainText('Blocked');
  // 5 Blocked, 1 Degraded, 5 Reachable in the fixture.
  await expect(hb).toContainText('5');
});

test('a blocked card shows its verdict chip and screenshot', async ({ page }) => {
  await mountWithFixture(page);
  const card = page.locator('.bv-card', { hasText: 'Google reCAPTCHA' });
  await expect(card.locator('.verdict.Blocked')).toBeVisible();
  await expect(card.locator('.bv-card__shot img')).toHaveAttribute('src', /screenshots/);
});
```

- [ ] **Step 2: Run to verify the new tests fail**

Run:
```bash
npx playwright test beijing-view.spec.ts --project=chromium
```
Expected: the 3 new tests FAIL (`.bv-card` count 0; heartbeat empty), shell test still PASSES.

- [ ] **Step 3: Create `public/assets/beijing-view.js`**

```js
// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Beijing View — renders the recorded Beijing snapshot (results/latest.json) so every
// visitor, anywhere, sees what a browser in Beijing sees. Cards are built purely from
// recorded data; nothing here depends on the visitor reaching the third-party hosts.
(function () {
  var CATEGORY_LABELS = {
    fonts: 'Fonts and icons', auth: 'Auth and identity',
    analytics: 'Analytics and tags', embeds: 'Maps, media, embeds'
  };
  var CATEGORY_ORDER = ['fonts', 'auth', 'analytics', 'embeds'];
  var VERDICT_ORDER = ['Blocked', 'Degraded', 'Reachable'];

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function verdictChip(v) { return el('span', v, 'verdict ' + v); }

  function fmtTime(iso) {
    try { return new Date(iso).toISOString().replace('T', ' ').replace(/\..*/, ' UTC'); }
    catch (e) { return iso || 'unknown'; }
  }
  function fmtSec(n) { n = Number(n) || 0; return (n.toFixed(2).replace(/\.?0+$/, '') || '0'); }

  function renderHeartbeat(data) {
    var env = data.environment || {};
    var services = data.services || [];
    var counts = { Blocked: 0, Degraded: 0, Reachable: 0 };
    services.forEach(function (s) { counts[s.verdict] = (counts[s.verdict] || 0) + 1; });

    var strip = document.getElementById('bv-heartbeat');
    if (!strip) return;
    clear(strip);

    var node = el('span', null, 'bv-hb__node');
    node.appendChild(el('span', null, 'live-dot'));
    node.appendChild(document.createTextNode(
      ' Beijing node (' + (env.cloudRegion || 'unknown') + ') · as of ' + fmtTime(data.generatedAt)));
    strip.appendChild(node);

    var right = el('span', null, 'bv-hb__counts');
    VERDICT_ORDER.forEach(function (v) {
      if (!counts[v]) return;
      var item = el('span', null, 'bv-hb__count');
      item.appendChild(el('span', String(counts[v]), 'bv-hb__num'));
      item.appendChild(verdictChip(v));
      right.appendChild(item);
    });
    strip.appendChild(right);
  }

  function renderCard(s, b) {
    var card = el('article', null, 'bv-card ' + s.verdict);

    var shot = el('div', null, 'bv-card__shot');
    if (b && b.screenshotPath) {
      var img = el('img');
      img.src = b.screenshotPath;
      img.alt = 'What Beijing sees: ' + s.name;
      img.loading = 'lazy';
      shot.appendChild(img);
    } else {
      shot.appendChild(el('div', 'screenshot pending', 'bv-card__shot-missing'));
    }
    card.appendChild(shot);

    var ev = el('div', null, 'bv-card__evidence');
    var head = el('div', null, 'bv-card__head');
    head.appendChild(el('h3', s.name));
    head.appendChild(verdictChip(s.verdict));
    ev.appendChild(head);
    ev.appendChild(el('p', s.domain, 'bv-card__host'));

    var dl = el('dl', null, 'bv-card__metrics');
    function row(k, v) { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); }
    row('HTTP', s.httpCode || '—');
    row('Total', fmtSec(s.totalSec) + 's' + (Number(s.curlExit) === 28 ? ' (timeout)' : ''));
    row('Requests arrived', s.verdict === 'Blocked' ? '0' : 'ok');
    row('DNS', s.dnsResolved ? 'resolved' : 'no');
    ev.appendChild(dl);

    if (s.symptom) ev.appendChild(el('p', s.symptom, 'bv-card__symptom'));
    card.appendChild(ev);
    return card;
  }

  function render(data) {
    renderHeartbeat(data);
    var services = data.services || [];
    var browserById = {};
    (data.browser || []).forEach(function (b) { browserById[b.id] = b; });

    var byCat = {};
    services.forEach(function (s) { (byCat[s.category] = byCat[s.category] || []).push(s); });

    var root = document.getElementById('bv-gallery');
    if (!root) return;
    clear(root);

    CATEGORY_ORDER.forEach(function (cat) {
      var list = byCat[cat];
      if (!list || !list.length) return;
      var section = el('section', null, 'bv-cat');
      var h = el('h2', CATEGORY_LABELS[cat] || cat, 'bv-cat__label');
      h.appendChild(el('small', ' ' + list.length + (list.length > 1 ? ' dependencies' : ' dependency')));
      section.appendChild(h);
      var grid = el('div', null, 'bv-grid');
      list.forEach(function (s) { grid.appendChild(renderCard(s, browserById[s.id])); });
      section.appendChild(grid);
      root.appendChild(section);
    });
  }

  function fail(msg) {
    var root = document.getElementById('bv-gallery');
    if (root) { clear(root); root.appendChild(el('p', 'Could not load the Beijing snapshot: ' + msg)); }
  }

  function boot() {
    fetch('/results/latest.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(function (e) { fail(e.message); });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
```

- [ ] **Step 4: Add card/gallery styles to `public/assets/beijing-view.css`**

Append:

```css
/* Gallery + cards */
.bv-cat { margin: var(--cr-space-7) 0; }
.bv-cat__label { display: flex; align-items: baseline; gap: var(--cr-space-3); }
.bv-cat__label small { color: var(--cr-text-secondary); font-weight: var(--cr-fw-regular, 400); font-size: 0.85rem; }

.bv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--cr-space-5); }

.bv-card {
  display: grid; grid-template-columns: 1.2fr 1fr;
  border: 1px solid var(--cr-border, #e2e8f0);
  border-radius: var(--cr-radius-card, 12px);
  overflow: hidden; background: var(--cr-surface, #fff);
}
.bv-card.Blocked  { border-color: var(--cr-error, #d64545); }
.bv-card.Degraded { border-color: var(--cr-warning, #d99e00); }

.bv-card__shot { background: var(--cr-primary); min-height: 140px; display: flex; }
.bv-card__shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.bv-card__shot-missing { margin: auto; color: rgba(255,255,255,0.7); font-size: 0.85rem; }

.bv-card__evidence { padding: var(--cr-space-4); display: flex; flex-direction: column; gap: var(--cr-space-2); }
.bv-card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--cr-space-2); }
.bv-card__head h3 { margin: 0; font-size: 1rem; }
.bv-card__host { color: var(--cr-text-secondary); font-size: 0.8rem; margin: 0; }
.bv-card__metrics { display: grid; grid-template-columns: auto 1fr; gap: 2px var(--cr-space-3); margin: var(--cr-space-2) 0 0; font-size: 0.85rem; }
.bv-card__metrics dt { color: var(--cr-text-secondary); }
.bv-card__metrics dd { margin: 0; font-weight: var(--cr-fw-semibold, 600); }
.bv-card__symptom { font-size: 0.85rem; color: var(--cr-text-secondary); margin: var(--cr-space-2) 0 0; }

@media (max-width: 560px) { .bv-card { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:
```bash
npx playwright test beijing-view.spec.ts --project=chromium
```
Expected: all 4 tests PASS (shell + 3 new). The "independent of the viewer network" test passing proves cards render with every external request aborted.

- [ ] **Step 6: Commit**

```bash
git add public/assets/beijing-view.js public/assets/beijing-view.css tests/playwright/beijing-view.spec.ts
git commit -m "beijing-view: render heartbeat + evidence cards from the Beijing snapshot"
```

---

## Task 4: "Compare with my browser" per-card expansion

Adds the opt-in contrast (layout direction 2 folded in): load the same resource live in the visitor's browser and show pass/fail next to Beijing's verdict.

**Files:**
- Modify: `public/assets/beijing-view.js`
- Modify: `public/assets/beijing-view.css`
- Test: `tests/playwright/beijing-view.spec.ts`

- [ ] **Step 1: Add a failing test for the compare toggle**

Append to `tests/playwright/beijing-view.spec.ts`:

```ts
test('compare button reveals a my-browser result and toggles off', async ({ page }) => {
  await mountWithFixture(page);
  const card = page.locator('.bv-card', { hasText: 'Google Fonts' });
  const btn = card.locator('.bv-card__compare');
  await expect(btn).toHaveText(/Compare with my browser/i);
  await btn.click();
  // External requests are aborted in the fixture, so the live load resolves to a failure state.
  await expect(card.locator('.bv-card__live')).toBeVisible();
  await expect(card.locator('.bv-card__live .bv-live-fail')).toBeVisible({ timeout: 12000 });
  await btn.click();
  await expect(card.locator('.bv-card__live')).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
npx playwright test beijing-view.spec.ts -g "compare button" --project=chromium
```
Expected: FAIL — no `.bv-card__compare` button exists.

- [ ] **Step 3: Add the compare button + live loader to `public/assets/beijing-view.js`**

In `renderCard`, before `card.appendChild(ev);`, add the button:

```js
    var btn = el('button', 'Compare with my browser', 'bv-card__compare');
    btn.type = 'button';
    btn.addEventListener('click', function () { toggleCompare(card, s, btn); });
    ev.appendChild(btn);
```

Then add these two functions inside the IIFE (e.g. just above `function render(data)`):

```js
  function loadLive(s, box) {
    var done = false, TIMEOUT = 8000;
    function settle(ok) {
      if (done) return; done = true;
      clear(box);
      box.appendChild(el('span', ok ? '\u2713 loaded in YOUR browser' : '\u2717 failed in YOUR browser',
        ok ? 'bv-live-ok' : 'bv-live-fail'));
    }
    clear(box);
    box.appendChild(el('span', 'loading\u2026', 'bv-live-pending'));

    var isFrame = s.category === 'embeds';
    var isStyle = s.category === 'fonts' || /\.css(\?|$)/.test(s.url || '');
    if (isFrame) {
      var ifr = document.createElement('iframe');
      ifr.src = s.url; ifr.title = 'live ' + s.name;
      ifr.style.cssText = 'width:100%;height:120px;border:0;background:#000';
      ifr.onload = function () { settle(true); };
      ifr.onerror = function () { settle(false); };
      clear(box); box.appendChild(ifr);
    } else if (isStyle) {
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = s.url;
      link.onload = function () { settle(true); };
      link.onerror = function () { settle(false); };
      document.head.appendChild(link);
    } else {
      var sc = document.createElement('script');
      sc.src = s.url; sc.async = true;
      sc.onload = function () { settle(true); };
      sc.onerror = function () { settle(false); };
      document.head.appendChild(sc);
    }
    setTimeout(function () { settle(false); }, TIMEOUT);
  }

  function toggleCompare(card, s, btn) {
    var open = card.querySelector('.bv-card__live');
    if (open) { open.parentNode.removeChild(open); btn.textContent = 'Compare with my browser'; return; }
    btn.textContent = 'Hide my-browser comparison';
    var live = el('div', null, 'bv-card__live');
    live.appendChild(el('p', 'Your browser, loading ' + s.domain + ' live:', 'bv-card__live-label'));
    var box = el('div', null, 'bv-card__live-box');
    live.appendChild(box);
    card.appendChild(live);
    loadLive(s, box);
  }
```

- [ ] **Step 4: Add compare styles to `public/assets/beijing-view.css`**

Append:

```css
.bv-card__compare {
  margin-top: var(--cr-space-3); align-self: flex-start;
  font: inherit; font-size: 0.8rem; cursor: pointer;
  padding: 6px 12px; border-radius: 999px;
  border: 1px solid var(--cr-border, #cbd5e1);
  background: transparent; color: var(--cr-text-primary);
}
.bv-card__compare:hover { background: var(--cr-surface-subtle, #f1f5f9); }
.bv-card__live { grid-column: 1 / -1; padding: var(--cr-space-4); border-top: 1px solid var(--cr-border, #e2e8f0); }
.bv-card__live-label { margin: 0 0 var(--cr-space-2); font-size: 0.8rem; color: var(--cr-text-secondary); }
.bv-live-ok { color: var(--cr-success-text, #137a4b); font-weight: 600; }
.bv-live-fail { color: var(--cr-error-text, #b42318); font-weight: 600; }
.bv-live-pending { color: var(--cr-text-secondary); }
```

- [ ] **Step 5: Run the compare test (and the full file)**

Run:
```bash
npx playwright test beijing-view.spec.ts --project=chromium
```
Expected: all tests PASS, including the compare toggle.

- [ ] **Step 6: Commit**

```bash
git add public/assets/beijing-view.js public/assets/beijing-view.css tests/playwright/beijing-view.spec.ts
git commit -m "beijing-view: add opt-in 'compare with my browser' per card"
```

---

## Task 5: Link the page from the demos hub

**Files:**
- Modify: `demos/index.html` (hero CTA area, around lines 47-50)

- [ ] **Step 1: Add a link in the hero CTA**

In `demos/index.html`, in the `.hero__cta` block (currently two buttons), add a third button:

```html
        <div class="hero__cta reveal" data-delay="3">
          <a class="btn btn--primary" href="../public/results/index.html">See live verdicts</a>
          <a class="btn btn--ghost" href="./beijing-view.html">See the Beijing view</a>
          <a class="btn btn--ghost" href="#how">How the lab works</a>
        </div>
```

- [ ] **Step 2: Verify the link works**

With a server running, run:
```bash
npx playwright test beijing-view.spec.ts -g "shell renders" --project=chromium
```
Then manually confirm `http://localhost:8080/demos/` shows the "See the Beijing view" button linking to the page. (No new automated test required; this is a one-line navigation link.)

- [ ] **Step 3: Commit**

```bash
git add demos/index.html
git commit -m "home: link the Beijing view page from the hero"
```

---

## Task 6: Full regression + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the whole Playwright suite**

Ensure a server is running, then:
```bash
npx playwright test --project=chromium
```
Expected: existing demo specs PASS (outside China they may report Reachable — that is fine; `EXPECT_BLOCKED` is unset locally) and all `beijing-view.spec.ts` tests PASS.

- [ ] **Step 2: Manual smoke with real data**

Open `http://localhost:8080/demos/beijing-view.html`. Confirm: heartbeat shows the snapshot time + counts; cards render per category; blocked cards show "(timeout)" and "0" requests arrived; "Compare with my browser" expands and resolves. (Locally, with no VPN restrictions, the compare may show ✓ — that is the expected teaching contrast.)

- [ ] **Step 3: Confirm graceful failure**

Temporarily rename results, reload, confirm the friendly "Could not load the Beijing snapshot" message appears, then restore:
```bash
mv results/latest.json results/latest.json.bak && echo "reload page now, then:" ; sleep 5 ; mv results/latest.json.bak results/latest.json
```

- [ ] **Step 4: No commit needed** (verification task). If any fix was required, commit it with a descriptive message.

---

## Phase 2 (future plan — not implemented here)

Out of scope for this plan; capture as a separate plan when the Beijing host work is scheduled.

1. **Live heartbeat probe.** A lightweight scheduled job on the launchready.cn Beijing host (systemd timer or cron, ~5 min) that tests only top-level domain reachability and writes `results/heartbeat.json` (`{ generatedAt, domains: [{ domain, reachable, ms }] }`). The page would `fetch` it, show "X minutes ago", auto-refresh, and fall back to the snapshot timestamp when absent/stale. Requires a `deploy/` runbook entry and the bind-mounted `results/` path.
2. **Visitor-region label.** Expose Cloudflare `CF-IPCountry` via a tiny endpoint so the hero can show "Your location: X · but below is Beijing's view". Best-effort; the page omits the label when unavailable.

---

## Self-Review

- **Spec coverage:** core principle/honesty boundary → hero copy + provenance in heartbeat (Task 2/3); data sources & `symptom` → Task 1; screenshot completeness → relies on existing Playwright capture, noted; layout direction 1 gallery + C-format cards → Task 3; compare expansion (direction 2 opt-in) → Task 4; all 11 data-driven → Task 3 renders from `services[]`; degradation/honesty → `fail()` + missing-screenshot placeholder (Task 3) and smoke (Task 6); phasing → Phase 1 tasks ship without ops, Phase 2 appendix. No gaps.
- **Placeholder scan:** every code step contains complete content; no TBD/TODO.
- **Type/name consistency:** `renderCard`/`renderHeartbeat`/`render`/`fail`/`boot`/`loadLive`/`toggleCompare` defined once and referenced consistently; CSS classes (`.bv-card`, `.bv-card__shot`, `.bv-card__evidence`, `.bv-card__compare`, `.bv-card__live`, `.bv-hb`, `#bv-heartbeat`, `#bv-gallery`) match between HTML, JS, CSS, and tests; fixture field names match the probe output shape (`httpCode`, `curlExit`, `totalSec`, `dnsResolved`, `verdict`, `symptom`, `screenshotPath`).
```
