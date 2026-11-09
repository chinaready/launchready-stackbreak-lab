# Vercel mainland China probe — 2026-11-09

- Generated: 2026-11-09T01:33:20Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 10.002210 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 10.002158 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 10.002451 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 10.002447 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 10.002614 | Blocked |
| KV | frontend | Function + KV ping | 000 | 10.002590 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 10.002295 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 10.002429 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.585675 | Reachable |
| KV | backend | KV REST get | neterr | 0.129715 | Blocked |
| Blob | backend | Blob REST list | 200 | 1.807962 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.25372 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.696518 | Reachable |
| Vercel API | transport | REST API | 308 | 0.319984 | Reachable |
| Analytics | transport | Analytics infra | 302 | 0.710022 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.038515 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 10.002145 | Blocked |
| DNS | transport | DNS site host | dns | 0.022211 | Reachable |
