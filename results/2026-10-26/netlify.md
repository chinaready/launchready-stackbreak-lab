# Netlify mainland China probe — 2026-10-26

- Generated: 2026-10-25T23:58:38Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.457376 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.134418 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.632622 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.580639 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 1.050706 | Degraded |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.711692 | Degraded |
| Edge Functions | frontend | Edge Function banner | 200 | 1.664063 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.643561 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 0.490052 | Reachable |
| Forms | frontend | Form submission | 200 | 1.122025 | Degraded |
| Identity | frontend | Identity settings | 200 | 0.868971 | Reachable |
| Netlify API | backend | API current user | 401 | 1.188879 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 0.918234 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 0.510374 | Reachable |
| Netlify API | transport | REST API | 401 | 0.929901 | Reachable |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.864586 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 0.999675 | Reachable |
| DNS | transport | DNS netlify.app | dns | 0.073326 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.709976 | Reachable |
| DNS | transport | DNS site host | dns | 0.018743 | Reachable |
