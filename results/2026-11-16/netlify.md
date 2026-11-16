# Netlify mainland China probe — 2026-11-16

- Generated: 2026-11-16T01:40:02Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.057344 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.130352 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.592843 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.648690 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 1.028935 | Degraded |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.667022 | Degraded |
| Edge Functions | frontend | Edge Function banner | 200 | 1.739792 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.910564 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 0.833981 | Reachable |
| Forms | frontend | Form submission | 200 | 0.749606 | Reachable |
| Identity | frontend | Identity settings | 200 | 0.485375 | Reachable |
| Netlify API | backend | API current user | 401 | 1.093204 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 0.9204 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 1.242476 | Degraded |
| Netlify API | transport | REST API | 401 | 1.048198 | Degraded |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.867781 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 1.645720 | Degraded |
| DNS | transport | DNS netlify.app | dns | 0.068742 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.717740 | Reachable |
| DNS | transport | DNS site host | dns | 0.018230 | Reachable |
