# Netlify China demo + probe kit

A field-reports demo **site on Netlify** and a probe kit that measures how the Netlify stack
behaves from **mainland China**. Counterpart to [`../firebase-demo/`](../firebase-demo/); backs
[Does Netlify work in China, feature by feature](https://chinaready.co/insights/).

Netlify only tells the truth once a **real site is deployed**. This kit deploys a site that exercises
as many Netlify products as possible, then probes it from a `cn-beijing` node:

| Path | What it represents | Tool |
|---|---|---|
| **Frontend** | Browser in mainland China hitting `*.netlify.app` | `curl` (`probe/frontend.sh`) |
| **Backend** | App server in mainland China calling the Netlify API | `fetch` + token (`probe/backend.mjs`) |
| **Transport** | Platform host reachability | `curl` + `dig` (`probe/transport.sh`) |
| **Resources** | Asset weight, TTFB, edge region | `curl -w` + `/__where` (`probe/resources.sh`) |

## Quick start

```bash
cd netlify-demo
cp .env.example ../.env     # repo-root .env is gitignored
npm install

npm run deploy              # see setup/provision.md for one-time steps
npm run probe:all           # writes results/<date>/netlify.{md,json}
```

`probe:all` also runs `probe:resources` and writes `results/netlify-latest.json` (read by
`/results/netlify.html`) and `results/netlify-resources-latest.json` (homepage latency block).

## Provisioning

[`setup/provision.md`](setup/provision.md) — create the site, enable Identity + Forms, deploy.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Blocked** | Connection timeout, TLS failure, or hard reset (HTTP `000`) |
| **Degraded** | Connected but slower than `SLOW_THRESHOLD` (default 5s) |
| **Reachable** | Host answered at acceptable latency (any HTTP status) |
