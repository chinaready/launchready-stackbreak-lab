# Stack Break Lab

**Which parts of a foreign web stack break first in mainland China — measured, not guessed.**

An open lab with tiny, single-dependency demo pages and reproducible network + browser checks from
**real mainland China infrastructure** (Alibaba Cloud behind `launchready.cn`). Each run produces a
machine-readable verdict — `Blocked`, `Degraded`, or `Reachable` — plus screenshots.

Maintained by [Chinaready](https://chinaready.co); evidence runs on
[launchready.cn](https://launchready.cn) mainland infrastructure.

- **Live site:** https://stackbreak.launchready.cn
- **Latest results:** https://stackbreak.launchready.cn/results/
- **Beijing view:** https://stackbreak.launchready.cn/demos/beijing-view.html
- **Companion article:** https://chinaready.co/insights/which-parts-of-your-stack-break-first/

[![license](https://img.shields.io/github/license/chinaready/launchready-stackbreak-lab)](LICENSE)
[![evidence](https://github.com/chinaready/launchready-stackbreak-lab/actions/workflows/evidence.yml/badge.svg)](https://github.com/chinaready/launchready-stackbreak-lab/actions/workflows/evidence.yml)

## What this is

Most teams treat "China access" as one big switch. It is not. A site that loads from London can fail
in a dozen small, independent ways from Shanghai: a blank login button, a hero with no typeface, a
checkout that silently stalls.

This lab isolates each failure. Every page under [`demos/`](demos/) loads **exactly one** third-party
integration the way a normal product would, then reports whether that dependency actually arrived.

| Category | Demos | Services |
|---|---|---|
| Fonts and icons | 3 | Google Fonts, Material Symbols, Adobe Fonts (Typekit) |
| Auth and identity | 3 | Google reCAPTCHA, Auth0, Google Sign-In |
| Analytics and tags | 2 | Google Tag Manager, Google Analytics 4 |
| Maps, media, embeds | 3 | YouTube, Google Maps, Vimeo |

The [Beijing view](demos/beijing-view.html) replays the latest mainland snapshot — same evidence for
every visitor, regardless of location or VPN.

## How evidence is collected

```text
GitHub (this repo)  --push-->  self-hosted runner on launchready.cn (mainland China)
                                  |
                                  +-- probe/china-dependency-probe.sh  (curl + dig)
                                  +-- Playwright  (Chromium, network capture + screenshots)
                                  |
                                  +-- writes results/<date>/ and results/latest.json
                                  +-- serves demos + /results/ via Docker (nginx)
```

1. **Network probe** (`curl` + `dig`) — domain reachability and latency.
2. **Browser checks** (Playwright) — what a real user sees: failed requests, blank players, spinners
   that never resolve — with screenshots.

Every verdict is stamped with test date, cloud region, and host. Results change with carrier, region,
and time; treat each run as a single-node snapshot, not a legal or compliance conclusion.

The [`evidence` workflow](.github/workflows/evidence.yml) runs **weekly** (Mondays 06:00 Asia/Shanghai)
on a mainland self-hosted runner and refreshes:

- `results/latest.json` — 11 single-dependency probes + Playwright screenshots
- `results/netlify-latest.json` — when Netlify site variables are configured
- `results/firebase-latest.json` — when Firebase is configured on the host (see [`deploy/env.example`](deploy/env.example))

You can also trigger a run manually from GitHub Actions → **evidence** → **Run workflow**.

## Quick start (local)

Outside China most demos succeed — that is the point of comparison with the mainland runs.

```bash
git clone https://github.com/chinaready/launchready-stackbreak-lab.git
cd launchready-stackbreak-lab

docker compose up --build
# http://localhost:8080/demos/  and  http://localhost:8080/results/

npm install
npx playwright install --with-deps chromium
npm test

./probe/china-dependency-probe.sh   # verdicts only meaningful from China
```

Copy [`.env.example`](.env.example) to `.env` for optional vendor test keys. Every value is optional
for a local build.

## Repository layout

```text
demos/         one HTML page per dependency + hub + Beijing view
probe/         targets.json + china-dependency-probe.sh
firebase-demo/ Firebase stack probe kit
netlify-demo/  Netlify stack probe kit
tests/         Playwright specs
results/       published evidence (latest.json + dated snapshots)
public/        /results/ viewer + shared assets
deploy/        host bootstrap + runner setup (maintainers)
```

## Whole-stack deep dives

Two kits deploy and probe an entire managed backend from the same mainland node:

- [`firebase-demo/`](firebase-demo/) — Auth, Firestore, Storage, Functions, FCM, Remote Config.
  Results: `/results/firebase.html`.
- [`netlify-demo/`](netlify-demo/) — Hosting/CDN, Image CDN, Functions, Edge Functions, Forms,
  Identity, Blobs. Results: `/results/netlify.html`.

## Contributing

**Open an issue first** to propose a dependency; maintainers confirm scope before you open a PR.
See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md) — report vulnerabilities privately

## License

Copyright 2026 Chinaready. Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE)
for attribution. Demos load third-party services for diagnostic purposes only; all trademarks belong to
their respective owners.
