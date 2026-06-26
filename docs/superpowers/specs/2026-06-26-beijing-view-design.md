# Beijing View — design spec

**Date:** 2026-06-26
**Status:** Approved design, ready for implementation planning
**Owner:** Stack Break Lab (chinaready / launchready.cn)

## Problem

Every `demos/*.html` page (and the homepage catalog) loads its one third-party
dependency **live, in the visitor's own browser**. The verdict a visitor sees therefore
reflects *their* network and location — not Beijing's. With a VPN on, all 11 dependencies
load fine; with it off (or from outside China) the picture changes again. None of these
states is "what a user in Beijing actually sees."

We want a single page that shows **the real state of these dependencies as observed from
Beijing**, identical for every visitor regardless of their location or VPN.

## Core principle and honesty boundary

A visitor's browser can only ever load resources over *its own* network path — this is a
physical fact and cannot be bypassed from client-side JavaScript. Therefore the Beijing
state cannot be produced live in the visitor's browser; it must be **collected on a Beijing
node and replayed**.

- **Page body = a recorded Beijing snapshot** (screenshot + per-request success/timing +
  verdict). Identical for everyone.
- **"Live heartbeat" = a server-side Beijing probe** that periodically tests top-level
  domain reachability and writes a small JSON. The visitor only `fetch`es that JSON. It is
  "Beijing's most recent probe," explicitly **not** a measurement made by the visitor's
  browser (which cannot measure the GFW).

The page states this provenance clearly ("Collected by the launchready.cn Beijing node ·
as of HH:MM"), preserving the lab's "measured, not guessed" stance.

This was chosen over two alternatives:

- **Pure live proxy from Beijing** (rewrite every resource request through a Beijing proxy):
  rejected — iframes/JS fan out to dozens of domains; faithfully proxying an entire page is
  extremely complex and fragile, and it can never reproduce client-side embed behavior.
- **Pure snapshot with no live signal**: rejected in favor of the hybrid, which adds a light
  heartbeat so the page does not feel like stale data.

## Scope

All **11** dependencies in `probe/targets.json` (fonts ×3, auth ×3, analytics ×2,
maps/media/embeds ×3). The 2 analytics tags (GTM, GA4) are `Reachable` from Beijing and
have no visible symptom — they are kept as a deliberate "reachable" contrast and to keep the
page in lockstep with `targets.json`. The page is **fully data-driven** from `targets.json`
so adding a dependency requires only a data change, not page code.

## Architecture (hybrid: recorded snapshot + lightweight live heartbeat)

```text
Beijing node (launchready.cn, Alibaba Cloud cn-beijing)
  ├─ Phase 1 (existing pipeline, reused)
  │    probe (curl+dig)   → results/latest.json  services[]   (verdict, http, timings, dns)
  │    Playwright         → results/latest.json  browser[]    (failedRequests, screenshotPath)
  │                       → results/<date>/screenshots/<id>.png  (fullPage, incl. blocked = blank/fallback)
  │
  └─ Phase 2 (new, optional ops)
       heartbeat timer (~5 min) → results/heartbeat.json   { generatedAt, domains:[{domain,reachable,ms}] }
       CF-IPCountry endpoint    → best-effort visitor-region label

Any visitor (anywhere, VPN or not)
  └─ GET /demos/beijing-view.html
       fetch results/latest.json     → render cards from the Beijing snapshot
       fetch results/heartbeat.json  → heartbeat strip (falls back to snapshot timestamp if absent/stale)
```

## Data sources

The new page introduces **no new data pipeline**; it joins existing artifacts by service `id`.

| Card field | Source (existing unless noted) |
|---|---|
| Verdict (Blocked/Degraded/Reachable) | `results/latest.json` → `services[].verdict` |
| HTTP code, connect/total seconds, curl exit, DNS resolved | `results/latest.json` → `services[]` |
| Failed/OK request URLs, `screenshotPath` | `results/latest.json` → `browser[]` (join on `id`) |
| Real Beijing screenshot | `results/<date>/screenshots/<id>.png` (Playwright `fullPage`) |
| Name / category / domain / url / demoPath | `probe/targets.json` |
| "Expected symptom in China" copy | **NEW** `symptom` field on each `targets.json` object |

### New data: `symptom` on `targets.json`

Today the symptom text lives scattered in each demo's `data-symptom` attribute. We add a
`symptom` string to every service object in `targets.json` (sourced from the matching demo's
`data-symptom`) so the new page is fully data-driven and extensible. This is additive and
does not affect the probe or existing tests.

### Screenshot completeness

The existing Playwright spec already captures a `fullPage` screenshot for **all** 11 demos,
including blocked ones (a blocked page screenshots as the blank/fallback symptom — exactly
what we want to show). The local repo currently contains only 6 screenshots from a partial
historical run; a real mainland run repopulates all 11. Implementation must verify the
Beijing run produces all 11 screenshots and that `browser[]` carries an entry per service.

## Page structure (layout direction 1: "Beijing-view gallery")

New file `demos/beijing-view.html`, reusing `chinaready.css` + `lab.css`, with new
`public/assets/beijing-view.css` and `public/assets/beijing-view.js`. Top to bottom:

1. **Hero** — title "You are viewing from Beijing's perspective ↓"; subcopy makes the framing
   explicit ("Wherever you are, VPN on or off, everything below is what Beijing sees").
   Optional best-effort visitor-region label ("Your location: Japan · but below is Beijing's
   view") via Cloudflare `CF-IPCountry` exposed through a tiny endpoint; if unavailable, show
   only the fixed framing copy. **Never blocks render.**

2. **Beijing heartbeat strip** — `● Beijing node · as of HH:MM` plus verdict counts
   (`5 Blocked · 1 Degraded · 5 Reachable`). If `heartbeat.json` is present, show "X minutes
   ago" and auto-refresh on an interval; if absent/stale, fall back to the snapshot's
   `generatedAt`.

3. **Card gallery** — grouped by the 4 categories. Each card is the **C format**:
   - Left: the real Beijing **screenshot** (blocked services show as blank/fallback).
   - Right: **evidence panel** — verdict chip, domain, HTTP code, connect/total time, timeout
     duration, `0/1 requests arrived`, and the one-line expected-symptom copy.
   - Click to **expand**: enlarged request timeline, plus an optional "Compare with my
     browser" that live-loads the same resource in the visitor's browser and shows
     side-by-side **Your browser vs Beijing** (this folds layout direction 2 in as an opt-in).

4. **Footer** — reuse existing footer; reiterate the single-node-snapshot disclaimer.

### Degradation and honesty

- Missing screenshot → render the evidence panel plus a placeholder note.
- `latest.json` fetch fails → friendly error (same pattern as `public/results/index.html`).
- Provenance is always visible so a snapshot is never mistaken for a live client measurement.

## Phasing

- **Phase 1 (core, no ops changes):** the page itself — hero, heartbeat strip backed by the
  snapshot timestamp, category gallery of C-format cards, optional per-card "compare with my
  browser" expansion, plus the `symptom` field added to `targets.json`. Ships entirely on the
  existing data pipeline and deploy flow.
- **Phase 2 (nice-to-have, ops changes):** the real-time heartbeat (Beijing host timer +
  `results/heartbeat.json`) and the `CF-IPCountry` visitor-region endpoint. The page is
  designed to light these up when present and degrade cleanly when absent, so core value is
  never blocked on ops.

## Files

| File | Change |
|---|---|
| `demos/beijing-view.html` | NEW — the page |
| `public/assets/beijing-view.js` | NEW — fetch + join + render cards, heartbeat, compare |
| `public/assets/beijing-view.css` | NEW — card/evidence-panel/gallery styling (DS-aligned) |
| `probe/targets.json` | EDIT — add `symptom` to each service |
| `probe/targets.schema.md` | EDIT — document the `symptom` field |
| `demos/index.html` | EDIT — link to the Beijing-view page from the catalog/hero |
| `results/heartbeat.json` | NEW (Phase 2) — heartbeat artifact |
| Beijing host timer + `deploy/` runbook | NEW (Phase 2) — heartbeat probe schedule |
| Visitor-region endpoint | NEW (Phase 2) — best-effort `CF-IPCountry` |

## Non-goals

- No live proxying of third-party resources from Beijing.
- No attempt to measure the GFW from the visitor's browser.
- No change to the existing live demo pages' behavior (they remain the live-from-your-network
  comparison).

## Open questions / assumptions

- Heartbeat frequency assumed ~5 min; final cadence is a Phase 2 ops detail.
- Visitor-region detection assumed via Cloudflare `CF-IPCountry`; if the origin/CDN setup
  makes this awkward, the label is simply omitted.
```
