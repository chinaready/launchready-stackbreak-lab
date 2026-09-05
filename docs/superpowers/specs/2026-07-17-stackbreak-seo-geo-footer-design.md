<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
# Stack Break Lab — SEO / GEO / Footer alignment

**Date:** 2026-07-17  
**Updated:** 2026-09-05 — footer IA aligned with utility-landing footer template  
**Status:** Implemented

## Goals

1. Align site footer IA with the utility landing footer template (gfonts / fd-cdn / wp-cdn)
2. Full SEO + GEO baseline for all public pages under `demos/*` and `public/results/*`

## Footer

Four-column navy footer (`cr-footer-*` styles in `lab.css`), matching
`mvp-1/docs/superpowers/specs/2026-09-04-utility-landing-footer-design.md`:

| Column | Content |
|--------|---------|
| Brand | Chinaready reverse logo → chinaready.co; Stack Break Lab note + Operated by Chinaready; domain + Alibaba Cloud mainland meta |
| Learn | Landscape, Insights, Blog |
| Chinaready | Contact, Start Assessment, Book a Call, All Services |
| Utilities | Google Fonts, Frontend CDN, WordPress CDN, Docker Hub Mirror, Network Diagnostics |
| Bottom | Centered ICP + PSB filing badges (`京ICP备2026030642号-1` / `京公网安备11011502040161号`) |

No StackBreak demo deep-links in the Utilities column.

## SEO (per page)

- `canonical`, `robots` (index, follow, max-snippet/image-preview)
- Open Graph + Twitter Card
- JSON-LD `WebPage`; hub pages also `BreadcrumbList`
- Unique `title` + `description` on every page (fill gaps on single-dependency demos)

Base URL: `https://stackbreak.launchready.cn`

## GEO (site-level)

| File | Purpose |
|------|---------|
| `/robots.txt` | Allow all + Sitemap |
| `/sitemap.xml` | All public HTML URLs |
| `/llms.txt` | Project summary + key URLs for AI crawlers |

## Out of scope

- `netlify-demo/` and `vercel-demo/` sub-apps
- Custom OG images / FAQ schema

## Implementation approach

Static HTML inlining (no JS-injected footer). Shared CSS in `lab.css`.
