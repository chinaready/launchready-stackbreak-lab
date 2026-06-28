# Vercel China demo + probe kit

A field-reports demo **site on Vercel** and a probe kit that measures how the Vercel stack
behaves from **mainland China**. Counterpart to [`../firebase-demo/`](../firebase-demo/) and
[`../netlify-demo/`](../netlify-demo/).

Vercel only tells the truth once a **real site is deployed**. This kit deploys a site that exercises
as many Vercel products as possible, then probes it from a `cn-beijing` node:

| Path | What it represents | Tool |
|---|---|---|
| **Frontend** | Browser in mainland China hitting `*.vercel.app` | `curl` (`probe/frontend.sh`) |
| **Backend** | App server in mainland China calling the Vercel API + Storage REST | `fetch` + token (`probe/backend.mjs`) |
| **Transport** | Platform host reachability | `curl` + `dig` (`probe/transport.sh`) |
| **Resources** | Asset weight, TTFB, edge region | `curl -w` + `/__where` (`probe/resources.sh`) |

## Quick start

```bash
cd vercel-demo
cp .env.example ../.env     # repo-root .env is gitignored
npm install

# One-time: see setup/provision.md
npm run deploy
npm run probe:all           # writes results/<date>/vercel.{md,json}
```

`probe:all` also runs `probe:resources` and writes `results/vercel-latest.json` (read by
`/results/vercel.html`) and `results/vercel-resources-latest.json`.

## Provisioning

[`setup/provision.md`](setup/provision.md) — create the project, attach Blob + KV, deploy.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Blocked** | Connection timeout, TLS failure, or hard reset (HTTP `000`) |
| **Degraded** | Connected but slower than `SLOW_THRESHOLD` (default 5s) |
| **Reachable** | Host answered at acceptable latency (any HTTP status) |
