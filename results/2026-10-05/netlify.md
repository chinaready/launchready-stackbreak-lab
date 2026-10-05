# Netlify mainland China probe — 2026-10-05

- Generated: 2026-10-05T00:34:41Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.329135 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.145878 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.635691 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.555801 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 1.049670 | Degraded |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.742513 | Degraded |
| Edge Functions | frontend | Edge Function banner | 200 | 1.591189 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.929637 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 0.557217 | Reachable |
| Forms | frontend | Form submission | 200 | 0.742420 | Reachable |
| Identity | frontend | Identity settings | 200 | 0.868002 | Reachable |
| Netlify API | backend | API current user | 401 | 1.133342 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 0.957938 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 0.386700 | Reachable |
| Netlify API | transport | REST API | 401 | 0.982056 | Reachable |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.652616 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 1.082501 | Degraded |
| DNS | transport | DNS netlify.app | dns | 0.065601 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.602152 | Reachable |
| DNS | transport | DNS site host | dns | 0.018416 | Reachable |
