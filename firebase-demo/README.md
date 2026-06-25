<!-- Copyright (c) 2026 Chinaready. All rights reserved. -->

# Firebase China demo + probe kit

A self-contained "field reports" demo app and a probe kit that measures how the
Firebase stack behaves from **mainland China**. It backs the article
[Firebase alternatives for China, by function](https://chinaready.co/insights/firebase-alternatives-for-china/).

Everything runs from a single Alibaba Cloud ECS in `cn-beijing` and simulates the
two connection origins a real product has:

| Path | What it represents | Tool |
|---|---|---|
| **Frontend** | The user's browser / client SDK in mainland China | `curl` + Web API key / ID token (`probe/frontend.sh`) |
| **Backend** | The app's server in mainland China | `firebase-admin` service account (`probe/backend.mjs`) |
| **Transport** | Reachability of products we do not provision | `curl` host checks (`probe/transport.sh`) |

## The demo app: field reports

A mainland user signs in (Auth), posts a short report (Firestore), attaches a
photo (Storage), a callable function stamps it (Functions), peers get a push
(FCM), and a banner is toggled by Remote Config. Provisioned resources:

| Product | Resource |
|---|---|
| Auth | email/password + anonymous; one demo user for ID tokens |
| Firestore | `reports` collection seeded + `setup/firestore.rules` |
| Storage | `probes/field-report-sample.jpg` |
| Functions | `helloProbe` (HTTP) + `stampReport` (callable) — needs Blaze billing |
| Remote Config | `china_banner` parameter |
| FCM | server credentials (network-only evidence) |

## Quick start (on the ECS)

```bash
cd firebase-demo
cp .env.example ../.env   # repo-root .env is gitignored; fill in your values
npm install               # installs firebase-admin
npm run probe:all         # writes results/<date>/firebase.{md,json}
```

`probe:all` runs the frontend, backend, and transport probes and aggregates a
verdict table with environment provenance, mirroring the Stack Break Lab
`results/<date>/` convention.

## Provisioning

See [`setup/provision.md`](setup/provision.md) for the one-time steps to create
and seed the demo resources before probing.

## Verdicts

| Verdict | Meaning |
|---|---|
| **Blocked** | Connection timeout, TLS failure, or hard reset |
| **Degraded** | Connected but slower than `SLOW_THRESHOLD` (default 5s) |
| **Reachable** | Completed at acceptable latency (any HTTP status) |
