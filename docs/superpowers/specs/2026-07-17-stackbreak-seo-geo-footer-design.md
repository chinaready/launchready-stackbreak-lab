# Stack Break Lab — SEO / GEO / Footer alignment

**Date:** 2026-07-17  
**Status:** Implemented (2026-07-17)

## Goals

1. Align site footer structure/visual language with https://landscape.chinaready.co/
2. Full SEO + GEO baseline for all public pages under `demos/*` and `public/results/*`

## Footer

Three-column navy footer (`cr-footer-*` styles in `lab.css`):

| Column | Content |
|--------|---------|
| Brand | Chinaready white logo → chinaready.co; Stack Break Lab description |
| Chinaready | Start Assessment, Book a Call, All Services |
| Landscape | Explore, Guide, GitHub (chinaready-landscape) |
| Bottom | Left: snapshot disclaimer; Right: Source on GitHub |

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
