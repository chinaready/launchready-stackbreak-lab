# Firebase China demo + probe kit

A field-reports demo app and probe kit that measures how the Firebase stack behaves from **mainland
China**. Backs [Firebase alternatives for China, by function](https://chinaready.co/insights/firebase-alternatives-for-china/).

Runs from an Alibaba Cloud ECS in `cn-beijing` and simulates the two connection origins a real
product has:

| Path | What it represents | Tool |
|---|---|---|
| **Frontend** | Browser / client SDK in mainland China | `curl` + Web API key (`probe/frontend.sh`) |
| **Backend** | App server in mainland China | `firebase-admin` service account (`probe/backend.mjs`) |
| **Transport** | Reachability of products not provisioned | `curl` host checks (`probe/transport.sh`) |

## Quick start

```bash
cd firebase-demo
cp .env.example ../.env
npm install
npm run probe:all           # writes results/<date>/firebase.{md,json}
```

Results land in `results/firebase-latest.json`, read by `/results/firebase.html`.

When the mainland self-hosted runner is configured (see [`../deploy/env.example`](../deploy/env.example)),
the weekly [`evidence` workflow](../.github/workflows/evidence.yml) refreshes this snapshot
automatically alongside the single-dependency probes.

## Provisioning

[`setup/provision.md`](setup/provision.md) — one-time Auth, Firestore, Storage, Functions, Remote
Config, and FCM setup.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Blocked** | Connection timeout, TLS failure, or hard reset |
| **Degraded** | Connected but slower than `SLOW_THRESHOLD` (default 5s) |
| **Reachable** | Completed at acceptable latency (any HTTP status) |
