# Project Status

Handoff snapshot for the next iteration. For what the project *is* and how to run it, see
[`README.md`](README.md); for how to add a dependency, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

Last updated: 2026-06-24.

## TL;DR

The lab is **live, branded, and self-collecting evidence**. Code is public, the site runs on the
launchready.cn mainland host, and a self-hosted runner re-measures every dependency weekly.

- Live site: https://stackbreak.launchready.cn — `/demos/` and `/results/`
- Repo: https://github.com/chinaready/launchready-stackbreak-lab (public)
- Companion article (Chinaready site): `which-parts-of-your-stack-break-first`

## Current state (done)

| Area | State | Notes |
|---|---|---|
| Repo + docs | Done | README, CONTRIBUTING, PR template, MIT license, `.env.example` |
| Demos | Done | 11 single-dependency pages + hub, on the Chinaready Design System |
| Branding | Done | DS vendored locally (same-origin): `chinaready.css`, self-hosted Inter/DM Sans, logo/favicon under `public/assets/` |
| Probe | Done | `probe/china-dependency-probe.sh` + `probe/targets.json`, verdicts Blocked/Degraded/Reachable |
| Browser checks | Done | Playwright data-driven from `targets.json`; 11/11 pass; screenshots captured |
| Results viewer | Done | `public/results/` reads `results/latest.json` |
| Docker deploy | Done | `Dockerfile` + `docker-compose.prod.yml`, Traefik on the shared `lunchready` network, `cloudflare` cert resolver, no host ports published |
| DNS / TLS | Done | `stackbreak.launchready.cn` → Cloudflare → Traefik origin |
| Self-hosted runner | Done | `launchready-cn-runner`, labels `self-hosted,linux,x64,mainland-china` |
| CI: deploy | Done | `.github/workflows/deploy.yml` rebuilds only the `stackbreak` service on push to main |
| CI: evidence | Done | `.github/workflows/evidence.yml` weekly + manual |
| First real run | Done | Published to live site and committed to `results/` (see below) |

## Latest measured snapshot

Alibaba Cloud Beijing node (`cn-beijing-h`), 2026-06-24, DNS 223.5.5.5. Single-node snapshot —
verdicts move with carrier, region, and time.

| Verdict | Services |
|---|---|
| Blocked | reCAPTCHA, Google Sign-In, YouTube, Google Maps, Vimeo |
| Degraded | Auth0 |
| Reachable | Google Fonts, Material Symbols, Adobe Typekit, Google Tag Manager, GA4 |

Raw data: `results/2026-06-24/` (`probe.json`, `probe.md`, `browser.json`, `screenshots/`) and
`results/latest.json`.

## How the evidence pipeline works

```text
push to main ─────────────► deploy.yml (mainland runner) ─► docker compose -f docker-compose.prod.yml up -d  (stackbreak only)
weekly cron / manual ─────► evidence.yml (mainland runner):
    1. probe (curl + dig)            → results/<date>/probe.*
    2. Playwright vs LIVE demos      → results/<date>/browser.json + screenshots
    3. Refresh deployed site LOCALLY → cp results into $DEPLOY_PATH/results (bind-mounted, no GitHub round-trip)
    4. Commit + push to GitHub       → over SSH-443 (ssh.github.com:443) with retries, best-effort
```

**Key design decision — the live site never depends on github.com.** The runner is inside mainland
China, where the path to github.com is itself one of the unreliable dependencies this lab measures.
So step 3 publishes to the live site by a local file copy on the host; step 4 mirrors to GitHub
separately. The first HTTPS push attempt failed with a GnuTLS reset (GFW), which is why the workflow
pushes over **SSH-443** via a repo deploy key (`~/.ssh/github_deploy` on the host, `ssh.github.com:443`).

## Operational notes

- **Host**: Ubuntu 24.04, `lunchready-prd`, 101.200.180.235 (internal 172.29.21.143). Shared production
  host — only the `stackbreak` service is ours; never touch other containers/Traefik/certs.
- **Deploy path on host**: `/opt/launchready-stackbreak-lab` (the live container bind-mounts
  `./results` read-only).
- **Secrets**: live only in the host-side `.env` and GitHub Actions; never committed. The reCAPTCHA
  *secret* key in particular stays out of the repo (client site keys are fine in demos).
- **base image**: pulled via `harbor.aicproxy.cn/dockerhub/library/nginx:alpine` because Docker Hub is
  blocked from the host.

## Next-iteration backlog

1. **Automate cache invalidation.** Cloudflare served a stale `lab.css` after a redeploy; today we
   bump a manual `?v=` query. Add a Cloudflare cache purge step (or content-hashed asset filenames) to
   `deploy.yml`.
2. **Calibrate `EXPECT_BLOCKED`.** The Playwright suite asserts demo invariants always; the
   known-blocked assertions (gated by `EXPECT_BLOCKED=1`) still need tuning so a "Reachable" result on
   a normally-blocked service doesn't fail the run spuriously, while still catching regressions.
3. **Multi-node / multi-carrier.** Today's verdict is a single Beijing node. Consider a second region
   or carrier to show variance, which strengthens the "single-node snapshot" narrative.
4. **Grow the catalog via PRs.** The contribution path is documented; seed a few "good first
   dependency" issues (e.g. Stripe.js, Intercom, Sentry, Cloudflare Turnstile) to invite prospects.
5. **Results history view.** The viewer shows `latest.json`; a small trend view over dated folders
   would make week-over-week change visible.
6. **Chinaready article publish.** The `which-parts-of-your-stack-break-first` rewrite links to the
   live lab; it is committed in the mvp-1 repo but publish/deploy of chinaready.co is a separate step.
