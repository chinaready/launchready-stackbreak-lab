# Provisioning the field-reports demo on Netlify

One-time setup before running the probes. The site must be **deployed** for the
frontend probes to mean anything. Run scripted steps from `netlify-demo/` with the
repo-root `.env` populated.

## 0. Prerequisites

- A Netlify account.
- A **personal access token**: Netlify dashboard -> User settings -> Applications
  -> *Personal access tokens* -> *New access token*. Put it in `.env` as
  `NETLIFY_AUTH_TOKEN`. It is a secret; the repo-root `.env` is gitignored.
- Node >= 18 and the Netlify CLI (used via `npx --yes netlify-cli@latest`, no global
  install required).
- `cp .env.example ../.env` and fill in values; `npm install` in `netlify-demo/`.

## 1. Create + link the site

```bash
export NETLIFY_AUTH_TOKEN=...        # or rely on ../.env
npx --yes netlify-cli@latest sites:create --name stackbreak-netlify --manual
npx --yes netlify-cli@latest link --name stackbreak-netlify
```

`sites:create` prints the **Site ID** and the default URL
(`https://stackbreak-netlify.netlify.app`). Copy them into `.env` as
`NETLIFY_SITE_ID` and `NETLIFY_SITE_URL`. (If the name is taken, pick another and
update `.env` to match.)

## 2. Deploy (builds functions + edge functions, publishes `site/`)

```bash
npm run deploy        # npx netlify-cli deploy --build --prod
```

This uploads `site/`, bundles `netlify/functions/*` and `netlify/edge-functions/*`,
and applies `netlify.toml` (redirects, headers, the `/banner` edge route). Netlify
Blobs requires no setup — `getStore("field-reports")` provisions on first write.

## 3. Enable Identity (console)

Netlify dashboard -> your site -> *Identity* -> **Enable Identity**. This turns on
`/.netlify/identity/*` (GoTrue). Optionally, under *Identity -> Registration*, set
*Open* so the probe can reach `/.netlify/identity/settings` without invitation.
Create the demo user (matches `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`) under
*Identity -> Invite users* or via signup.

> Note: Netlify Identity is a supported authentication option (Feb-2026 reversal of
> the earlier deprecation). New client code should use `@netlify/identity`; this demo
> loads the classic widget for a zero-build illustration.

## 4. Confirm Forms detection

The `field-report` form in `site/index.html` has `data-netlify="true"`, so Netlify
detects it at deploy time. Verify under your site -> *Forms*. A probe POST to the
site root with `form-name=field-report` will appear there.

## 5. Record the site coordinates

After deploy, confirm `.env` has:

```bash
NETLIFY_SITE_ID=...                  # from sites:create
NETLIFY_SITE_URL=https://stackbreak-netlify.netlify.app
```

## Done

From a mainland China node:

```bash
npm run probe:all
```

Writes `results/<date>/netlify.{md,json}` and `results/netlify-latest.json`.

## Not provisioned (by design)

- **Large Media** — deprecated by Netlify; not configurable on new sites.
- **Netlify Analytics** — paid, server-side only; no client endpoint to probe.
