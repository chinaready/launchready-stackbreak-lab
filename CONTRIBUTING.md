# Contributing

Thanks for helping make this lab more useful. The goal is a growing, trustworthy catalog of
third-party dependencies and how they behave for real users in mainland China.

## Before you code

1. **Open an issue** describing the dependency you want measured — service name, domain, category,
   and why it matters to your stack.
2. Wait for a maintainer to confirm scope (one dependency, category, slug). We may suggest changes
   before you invest in a PR.
3. **Pull requests without a linked, maintainer-approved issue will not be reviewed.**

## One dependency per pull request

Keep each PR focused on a single third-party service. Do not bundle multiple dependencies, unrelated
fixes, or drive-by refactors in the same change.

## Add a dependency demo

Once your issue is approved, open a PR with these four pieces.

### 1. Demo page — `demos/<slug>.html`

- Load **exactly one** third-party integration, the normal way a product would (a `<script>`,
  `<link>`, or `<iframe>`).
- Start from any existing page in [`demos/`](demos/) as a template. Reuse `../public/assets/lab.css`
  and the standard header/footer so the page matches the rest of the lab.
- Set the two data attributes the tests rely on:
  - `data-service` — human-readable name, e.g. `Stripe.js`
  - `data-domain` — the host the dependency loads from, e.g. `js.stripe.com`
- Show the visitor: the service name, the expected symptom in China, and a link to `/results/`.
- **No production API keys.** Use the vendor's public test/sandbox key, or a placeholder. The
  network request to the dependency's domain is what we measure — a placeholder key is fine.

### 2. Probe target — `probe/targets.json`

Add one object to the `services` array (see [`probe/targets.schema.md`](probe/targets.schema.md)):

```json
{
  "id": "stripe-js",
  "name": "Stripe.js",
  "category": "auth",
  "domain": "js.stripe.com",
  "url": "https://js.stripe.com/v3/",
  "demoPath": "/demos/stripe-js.html",
  "symptom": "Checkout button stays disabled while the payment SDK never loads."
}
```

`category` must be one of: `fonts`, `auth`, `analytics`, `embeds`. Need a new category? Discuss in
your issue first.

### 3. Playwright test — `tests/playwright/stack-break.spec.ts`

The suite is data-driven from `targets.json`, so most dependencies need **no new code** — adding
the target above is enough. Add a bespoke `test(...)` only if your dependency needs a special
assertion (for example, checking a specific element stays blank).

### 4. Hub link — `demos/index.html`

Add a card/link under the matching category so people can find your demo.

## What maintainers will check

- Linked issue with maintainer approval.
- Single dependency only — no pages that load several unrelated trackers.
- No secrets, no customer domains, no personal data, no screenshots containing PII.
- Category maps to an existing group.
- The demo loads cleanly outside China (so we know a mainland failure is about access, not a bug).

After your PR merges to `main`, the weekly evidence workflow picks up the new target on its next
run and your dependency shows up at https://stackbreak.launchready.cn/results/.

## Local check before you push

```bash
docker compose up --build       # visit http://localhost:8080/demos/
npm install && npm test         # Playwright (demos should load locally)
./probe/china-dependency-probe.sh
```

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License, Version 2.0](LICENSE).

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Please be respectful and
constructive. This is a public, vendor-neutral diagnostic resource — keep claims factual and
reproducible.
