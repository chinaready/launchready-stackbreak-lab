# Netlify mainland China probe — 2026-06-25

- Generated: 2026-06-25T09:34:39Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 0.905795 | Reachable |
| Image CDN | frontend | Image CDN transform | 200 | 0.728997 | Reachable |
| Redirects & rewrites | frontend | Redirect rule (301) | 301 | 0.254466 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.143318 | Reachable |
| Functions | frontend | Function helloProbe | 200 | 0.534943 | Reachable |
| Blobs | frontend | Function + Blobs stamp | 200 | 1.232077 | Reachable |
| Edge Functions | frontend | Edge Function banner | 200 | 2.225652 | Reachable |
| Background Functions | frontend | Background Function | 202 | 0.548310 | Reachable |
| Scheduled Functions | frontend | Scheduled Function | 200 | 1.113424 | Reachable |
| Forms | frontend | Form submission | 200 | 0.632079 | Reachable |
| Identity | frontend | Identity settings | 200 | 0.489933 | Reachable |
| Netlify API | backend | API current user | 200 | 1.35195 | Reachable |
| Netlify API | backend | API site lookup | 200 | 2.167601 | Reachable |
| Deploys | backend | API deploys list | 200 | 1.066742 | Reachable |
| Forms | backend | API forms list | 200 | 0.240877 | Reachable |
| Functions | backend | Server -> Function invoke | 200 | 0.933678 | Reachable |
| Dashboard | transport | Dashboard (app) | 200 | 0.420521 | Reachable |
| Netlify API | transport | REST API | 401 | 1.137152 | Reachable |
| Hosting / CDN | transport | Marketing / CDN | 200 | 0.906001 | Reachable |
| Identity | transport | Identity widget CDN | 200 | 1.711223 | Reachable |
| DNS | transport | DNS netlify.app | dns | 0.059109 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.248637 | Reachable |
| DNS | transport | DNS site host | dns | 0.009583 | Reachable |
