# Contributing

Thanks for helping make this lab more useful. The goal is a growing, trustworthy catalog of
third-party dependencies and how they behave for real users in mainland China.

**The rule of thumb: one dependency per pull request.**

## Add a dependency demo

Want a service you rely on measured from mainland China? Open a PR with these four pieces.

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

Add one object to the `services` array:

```json
{
  "id": "stripe-js",
  "name": "Stripe.js",
  "category": "auth",
  "domain": "js.stripe.com",
  "url": "https://js.stripe.com/v3/",
  "demoPath": "/demos/stripe-js.html"
}
```

`category` must be one of: `fonts`, `auth`, `analytics`, `embeds`. Need a new category? Open an
issue first.

### 3. Playwright test — `tests/playwright/stack-break.spec.ts`

The suite is data-driven from `targets.json`, so most dependencies need **no new code** — adding
the target above is enough. Add a bespoke `test(...)` only if your dependency needs a special
assertion (for example, checking a specific element stays blank).

### 4. Hub link — `demos/index.html`

Add a card/link under the matching category so people can find your demo.

## What maintainers will check

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

## Code of conduct

Be respectful and constructive. This is a public, vendor-neutral diagnostic resource — keep
claims factual and reproducible.
