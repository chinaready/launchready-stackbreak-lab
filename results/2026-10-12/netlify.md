# Netlify mainland China probe — 2026-10-12

- Generated: 2026-10-12T01:07:10Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.212954 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.118190 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.603904 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.567150 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 0.934405 | Reachable |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.679868 | Degraded |
| Edge Functions | frontend | Edge Function banner | 200 | 1.625210 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.578840 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 0.848484 | Reachable |
| Forms | frontend | Form submission | 200 | 0.741926 | Reachable |
| Identity | frontend | Identity settings | 200 | 0.499356 | Reachable |
| Netlify API | backend | API current user | 401 | 1.177686 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 0.717465 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 0.406945 | Reachable |
| Netlify API | transport | REST API | 401 | 0.916208 | Reachable |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.868216 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 1.014580 | Degraded |
| DNS | transport | DNS netlify.app | dns | 0.066057 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.741619 | Reachable |
| DNS | transport | DNS site host | dns | 0.018090 | Reachable |
