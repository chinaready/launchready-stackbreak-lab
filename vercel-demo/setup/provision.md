# Provisioning the field-reports demo on Vercel

One-time setup before running the probes. The site must be **deployed** for the
frontend probes to mean anything. Run scripted steps from `vercel-demo/` with the
repo-root `.env` populated.

## 0. Prerequisites

- A Vercel account (Hobby tier is enough for Hosting, Functions, Edge Middleware,
  Cron, Blob, and KV within free limits).
- A **personal access token**: [Vercel dashboard → Account Settings → Tokens](https://vercel.com/account/tokens)
  → *Create*. Put it in `.env` as `VERCEL_TOKEN`. It is a secret; the repo-root
  `.env` is gitignored.
- Node >= 18 and the Vercel CLI (used via `npx --yes vercel@latest`, no global
  install required).
- `cp .env.example ../.env` and fill in values; `npm install` in `vercel-demo/`.

## 1. Create + link the project

```bash
cd vercel-demo
export VERCEL_TOKEN=...        # or rely on ../.env
npx --yes vercel@latest link
```

When prompted:

- Select your scope (personal account or team) — note the **Team/User ID** for
  `VERCEL_ORG_ID`.
- Create a new project (e.g. `stackbreak-vercel`) or link an existing one — note
  the **Project ID** for `VERCEL_PROJECT_ID`.

You can also read IDs from the dashboard: Project → Settings → General.

Add to repo-root `.env`:

```bash
VERCEL_ORG_ID=team_xxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxx
```

## 2. Create Storage (Blob + KV)

Vercel Dashboard → your project → **Storage**:

1. **Create a public Blob store** and connect it to this project. Copy
   `BLOB_READ_WRITE_TOKEN` and `BLOB_STORE_ID` from the Connect tab. Public storage
   matches the demo’s `access: 'public'` uploads in `api/stamp-report.js`.
2. **Add Upstash Redis** from [Vercel Marketplace → Storage](https://vercel.com/marketplace?category=storage&search=redis)
   → connect to this project. Copy `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` from the Connect tab.

Confirm all variables appear under Project → Settings → Environment Variables for
**Production**.

Copy the same values into `vercel-demo/.env` (and the mainland runner host `.env`) so
backend probes can hit Storage REST directly:

```bash
BLOB_STORE_ID=store_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Optional legacy aliases `pub_STORE_ID` / `pub_READ_WRITE_TOKEN` and `KV_REST_API_*`
are still read by `lib/storage-env.mjs` if you prefer those names locally.

## 3. Deploy

```bash
npm run deploy    # npx vercel deploy --prod
```

The CLI prints the production URL (e.g. `https://stackbreak-vercel.vercel.app`).
Set it in `.env`:

```bash
VERCEL_SITE_URL=https://stackbreak-vercel.vercel.app
```

This deploys:

- `public/` — static site
- `api/*.js` — Serverless Functions (hello, stamp-report, kv-ping, cron-ping)
- `middleware.js` — Edge Middleware on `/banner` and `/__where`
- `vercel.json` — redirects, rewrites, headers, cron schedule

## 4. Verify Cron

Dashboard → Project → **Cron Jobs** should list `/api/cron-ping` on schedule
`0 5 * * *` (from `vercel.json`). Frontend probes only test endpoint reachability,
not whether the schedule fired.

## 5. Smoke-test endpoints

From any network (plumbing check):

```bash
curl -s "$VERCEL_SITE_URL/api/hello" | jq .
curl -s "$VERCEL_SITE_URL/banner" | jq .
curl -s "$VERCEL_SITE_URL/__where" | jq .
curl -s -X POST "$VERCEL_SITE_URL/api/stamp-report" \
  -H 'content-type: application/json' -d '{"text":"provision check"}' | jq .
curl -s "$VERCEL_SITE_URL/api/kv-ping" | jq .
```

Blob and KV smoke tests fail until Storage is connected and env vars are set on
the Vercel project.

## 6. Run probes from mainland China

```bash
npm run probe:all
```

Writes `results/<date>/vercel.{md,json}`, `results/vercel-latest.json`, and
`results/vercel-resources-latest.json`.

Probes are only meaningful evidence from a mainland node (e.g. the
`launchready.cn` self-hosted runner). Running outside China is useful for
plumbing checks only.

## GitHub Actions (weekly evidence)

Add to the repo (see root `deploy/env.example`):

| Name | Type | Value |
|---|---|---|
| `VERCEL_TOKEN` | Secret | Personal access token |
| `VERCEL_ORG_ID` | Variable | Team/user ID |
| `VERCEL_PROJECT_ID` | Variable | Project ID |
| `VERCEL_SITE_URL` | Variable | Production URL |
| `BLOB_STORE_ID` | Variable | Public Blob store ID |
| `BLOB_READ_WRITE_TOKEN` | Secret | Public Blob token |
| `UPSTASH_REDIS_REST_URL` | Secret | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Upstash REST token |
| `pub_*` / `KV_REST_API_*` | Secret (optional) | Aliases still read by probes |

The `evidence` workflow skips the Vercel probe when `VERCEL_SITE_URL` is unset.

## Token rotation

If `VERCEL_TOKEN` or Storage tokens expire or are revoked, backend probes will
show **Blocked** for API/Storage paths. Regenerate in the Vercel dashboard, update
`.env` and GitHub secrets/variables, then redeploy if Storage tokens changed.

## Not provisioned (by design)

- **Vercel Postgres** — out of scope for v1.
- **Analytics / Speed Insights SDK** — paid/extra integration; transport probe
  optionally checks `vitals.vercel-insights.com` host reachability only.
- **Auth** — Vercel has no built-in Identity/Forms equivalent.

## Done

From a mainland China node:

```bash
npm run probe:all
```
