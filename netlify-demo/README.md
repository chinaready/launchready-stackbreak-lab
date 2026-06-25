<!-- Copyright (c) 2026 Chinaready. All rights reserved. -->

# Netlify China demo + probe kit

A self-contained "field reports" demo **site on Netlify** and a probe kit that
measures how the Netlify stack behaves from **mainland China**. It is the Netlify
counterpart to [`../firebase-demo/`](../firebase-demo/) and backs the article
[Does Netlify work in China, feature by feature](https://chinaready.co/insights/).

Unlike a pure-API service, Netlify only tells the truth once a **real site is
deployed**. So this kit deploys an actual site that turns on as many Netlify
products as possible, then probes that live site from a `cn-beijing` node across
the two connection origins a real product has:

| Path | What it represents | Tool |
|---|---|---|
| **Frontend** | The user's browser in mainland China hitting `*.netlify.app` | `curl` (`probe/frontend.sh`) |
| **Backend** | The app's server in mainland China calling the Netlify API | `fetch` + access token (`probe/backend.mjs`) |
| **Transport** | Reachability of platform hosts (dashboard, API, edge, DNS) | `curl` + `dig` (`probe/transport.sh`) |
| **Resources** | Weight + load latency of page assets and the serving edge region | `curl -w` + `/__where` (`probe/resources.sh`) |

## The demo app: field reports

A mainland user opens the site (Hosting/CDN), loads a photo (Image CDN), submits
a report (Forms), signs in (Identity), and stamps a report that a Function writes
to Blobs; an Edge Function computes a per-request banner. Wired features:

| Product | How it is exercised |
|---|---|
| Static hosting / CDN | `site/index.html` served at the site root |
| Image CDN | `/.netlify/images?url=/photo.png&w=160` |
| Redirects & rewrites | `/old-report` (301) and `/api/hello` (200 rewrite) in `netlify.toml` |
| Custom headers | `X-Stackbreak-Probe` via `netlify.toml` + `site/_headers` |
| Functions | `netlify/functions/hello.js` |
| Functions + Blobs | `netlify/functions/stamp-report.js` |
| Background Functions | `netlify/functions/report-background.js` (202) |
| Scheduled Functions | `netlify/functions/scheduled-ping.js` (`@hourly`) |
| Edge Functions | `netlify/edge-functions/banner.js` at `/banner` |
| Forms | `field-report` form in `site/index.html` |
| Identity (GoTrue) | widget in `site/index.html`; `/.netlify/identity/*` |

**Not included:** Large Media (deprecated by Netlify), and paid Netlify Analytics
(server-side logs, no client-probeable endpoint).

## Quick start

```bash
cd netlify-demo
cp .env.example ../.env     # repo-root .env is gitignored; fill in your values
npm install                 # installs @netlify/blobs (used by the function)

# 1. Deploy the real site (see setup/provision.md for the one-time steps)
npm run deploy              # npx netlify-cli deploy --build --prod

# 2. Probe it from a mainland China node
npm run probe:all           # writes results/<date>/netlify.{md,json}
```

`probe:all` runs the frontend, backend, and transport probes and aggregates a
verdict table with environment provenance, mirroring the Stack Break Lab
`results/<date>/` convention. It writes `results/netlify-latest.json`, which the
live results viewer reads (parallel to `results/firebase-latest.json`). It then
runs `probe:resources`, which measures each page asset's HTTP code, bytes, TTFB,
total time, and throughput, records the Netlify edge `serverRegion` from
`/__where`, and writes `results/<date>/netlify-resources.{md,json}` plus
`results/netlify-resources-latest.json` for the latency block on the homepage and
the "Page-resource latency & edge region" section of the results pages. Run it on
its own with `npm run probe:resources`.

## Provisioning

See [`setup/provision.md`](setup/provision.md) for the one-time steps to create
the site, enable Identity + Forms, and deploy before probing.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Blocked** | Connection timeout, TLS failure, or hard reset (HTTP `000`) |
| **Degraded** | Connected but slower than `SLOW_THRESHOLD` (default 5s) |
| **Reachable** | The host answered at acceptable latency (any HTTP status) |
