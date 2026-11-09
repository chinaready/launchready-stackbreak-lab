# Netlify mainland China probe — 2026-11-09

- Generated: 2026-11-09T01:32:34Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.068009 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.649598 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.671504 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 2.874120 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 0.527940 | Reachable |
| Blobs | frontend | Function + Blobs stamp | 200 | 5.695030 | Blocked |
| Edge Functions | frontend | Edge Function banner | 200 | 1.530291 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.870173 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 1.213669 | Degraded |
| Forms | frontend | Form submission | 200 | 1.055122 | Degraded |
| Identity | frontend | Identity settings | 200 | 1.480608 | Degraded |
| Netlify API | backend | API current user | 401 | 1.999142 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 0.941561 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 0.409508 | Reachable |
| Netlify API | transport | REST API | 401 | 1.001121 | Degraded |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.791566 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 1.651128 | Degraded |
| DNS | transport | DNS netlify.app | dns | 0.070999 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.737009 | Reachable |
| DNS | transport | DNS site host | dns | 0.018518 | Reachable |
