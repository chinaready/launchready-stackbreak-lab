## Linked issue

Closes #<!-- issue number — required; PRs without an approved issue will not be reviewed -->

## Dependency under test

- **Service name:**
- **Category:** fonts | auth | analytics | embeds
- **Domain it loads from:**
- **Why it matters to your stack:**

## Checklist

- [ ] Issue was opened and approved by a maintainer before this PR
- [ ] `demos/<slug>.html` added (loads a single dependency only)
- [ ] `data-service` and `data-domain` attributes set on the page
- [ ] `probe/targets.json` updated with the new target (including `symptom`)
- [ ] `demos/index.html` updated with a link under the right category
- [ ] No production secrets (vendor test/sandbox key or placeholder only)
- [ ] Demo loads cleanly outside China
