# Netlify mainland China probe — 2026-11-02

- Generated: 2026-11-02T01:22:51Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.299640 | Degraded |
| Image CDN | frontend | Image CDN transform | 200 | 1.202420 | Degraded |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.599817 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.795707 | Degraded |
| Functions | frontend | Function helloProbe | 200 | 1.369312 | Degraded |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.330913 | Degraded |
| Edge Functions | frontend | Edge Function banner | 200 | 1.771060 | Degraded |
| Background Functions | frontend | Background Function | 202 | 0.522963 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 403 | 0.485279 | Reachable |
| Forms | frontend | Form submission | 200 | 0.771815 | Reachable |
| Identity | frontend | Identity settings | 200 | 0.517165 | Reachable |
| Netlify API | backend | API current user | 401 | 2.668353 | Degraded |
| Functions | backend | Server -> Function invoke | 200 | 6.206336 | Blocked |
| Dashboard | transport | Dashboard (app) | 200 | 2.033291 | Degraded |
| Netlify API | transport | REST API | 401 | 0.891059 | Reachable |
| Hosting / CDN | transport | Marketing / CDN | 200 | 1.590043 | Degraded |
| Identity | transport | Identity widget CDN | 200 | 0.766174 | Reachable |
| DNS | transport | DNS netlify.app | dns | 0.071977 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.770765 | Reachable |
| DNS | transport | DNS site host | dns | 0.019069 | Reachable |
