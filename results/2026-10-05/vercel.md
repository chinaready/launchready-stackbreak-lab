# Vercel mainland China probe — 2026-10-05

- Generated: 2026-10-05T00:35:20Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 0.035218 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 0.007594 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 0.009412 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 0.006241 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 0.008209 | Blocked |
| KV | frontend | Function + KV ping | 000 | 0.006477 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 0.004381 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 0.011719 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.879231 | Reachable |
| KV | backend | KV REST get | neterr | 0.339089 | Blocked |
| Blob | backend | Blob REST list | 200 | 1.444658 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.00709 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.845887 | Reachable |
| Vercel API | transport | REST API | 308 | 0.741493 | Reachable |
| Analytics | transport | Analytics infra | 302 | 0.808098 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.034719 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 0.004298 | Blocked |
| DNS | transport | DNS site host | dns | 0.007638 | Reachable |
