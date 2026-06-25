# Stack Break Lab

**Which parts of a foreign web stack break first in mainland China — measured, not guessed.**

This is an open lab that hosts tiny, single-dependency demo pages and runs reproducible
network + browser checks against them from **real mainland China infrastructure**
(an Alibaba Cloud node behind `launchready.cn`). Each run produces a machine-readable
verdict — `Blocked`, `Degraded`, or `Reachable` — plus screenshots, so the failure of a
third-party service is something you can see, not something you have to take on faith.

Maintained by [Chinaready](https://chinaready.co); execution runs on
[launchready.cn](https://launchready.cn) mainland infrastructure.

- **Live site:** https://stackbreak.launchready.cn
- **Latest results:** https://stackbreak.launchready.cn/results/
- **Companion article:** https://chinaready.co/insights/which-parts-of-your-stack-break-first/

<!-- Evidence workflow badge becomes live once the repo and self-hosted runner are wired:
[![evidence](https://github.com/chinaready/launchready-stackbreak-lab/actions/workflows/evidence.yml/badge.svg)](https://github.com/chinaready/launchready-stackbreak-lab/actions/workflows/evidence.yml)
-->

## What this is

Most teams treat "China access" as one big switch. It is not. A site that loads perfectly
from London can fail in a dozen small, independent ways from Shanghai: a blank login button,
a hero with no typeface, a checkout that silently stalls.

This lab isolates each failure. Every page under [`demos/`](demos/) loads **exactly one**
third-party integration the way a normal product would, then reports whether that dependency
actually arrived.

| Category | Demos | Services |
|---|---|---|
| Fonts and icons | 3 | Google Fonts, Material Symbols, Adobe Fonts (Typekit) |
| Auth and identity | 3 | Google reCAPTCHA, Auth0, Google Sign-In |
| Analytics and tags | 2 | Google Tag Manager, Google Analytics 4 |
| Maps, media, embeds | 3 | YouTube, Google Maps, Vimeo |

## How evidence is collected

```text
GitHub (this repo)  --push-->  self-hosted runner on launchready.cn (mainland China)
                                  |
                                  +-- probe/china-dependency-probe.sh  (curl + dig)
                                  +-- Playwright  (real Chromium, network capture + screenshots)
                                  |
                                  +-- writes results/<date>/ and results/latest.json
                                  +-- serves demos + /results/ via Docker (nginx)
```

Two complementary signals:

1. **Network probe** (`curl` + `dig`) proves whether a domain is reachable and how slow it is.
2. **Browser checks** (Playwright) prove what a real user sees — failed requests, blank players,
   spinners that never resolve — and capture screenshots.

Every verdict is stamped with the test date, cloud region, and host so results are honest and
reproducible. Results change with carrier, region, and time; treat each run as a single-node
snapshot, not a legal or compliance conclusion.

## Quick start (local)

You can run the whole lab locally. Outside China most demos will succeed — that is the point of
comparison with the mainland runs.

```bash
# 1. Serve the demos (Docker)
docker compose up --build
# open http://localhost:8080/demos/  and  http://localhost:8080/results/

# 2. Run the network probe (works anywhere; verdicts only meaningful from China)
./probe/china-dependency-probe.sh

# 3. Run the browser checks
npm install
npx playwright install --with-deps chromium
npm test
```

Copy [`.env.example`](.env.example) to `.env` and fill in optional vendor test keys. Every value
is optional for a local build — blank keys fall back to public vendor test keys or render the
service's own "no key" error state, which is itself useful evidence.

## Repository layout

```text
demos/         one HTML page per third-party dependency + index hub
probe/         targets.json (canonical URL list) + china-dependency-probe.sh
firebase-demo/ Firebase field-reports demo + frontend/backend/transport probe kit
netlify-demo/  Netlify field-reports demo site + frontend/backend/transport probe kit
tests/         Playwright specs that assert China failure symptoms
results/       published evidence (latest.json + dated snapshots, per-stack *-latest.json)
public/        /results/ viewer + shared CSS
deploy/        Docker host + self-hosted runner runbooks
.github/       deploy + evidence workflows, PR template
```

## Whole-stack deep dives

Beyond the single-dependency demos, two kits deploy and probe an entire managed
backend end to end from the same mainland node:

- [`firebase-demo/`](firebase-demo/) — the Firebase stack (Auth, Firestore, Storage,
  Functions, FCM, Remote Config). Results: `/results/firebase.html`.
- [`netlify-demo/`](netlify-demo/) — a real Netlify site exercising Hosting/CDN, Image
  CDN, Functions, Edge Functions, Background/Scheduled Functions, Forms, Identity, and
  Blobs. Results: `/results/netlify.html`.

## Contributing

Running a product for China users? Open a PR to add a minimal demo page for a third-party
service you depend on. Maintainers run weekly evidence collection from mainland infrastructure
and publish the results. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE). Demos load third-party services for diagnostic purposes only; all trademarks
belong to their respective owners.
