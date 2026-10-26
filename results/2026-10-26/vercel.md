# Vercel mainland China probe — 2026-10-26

- Generated: 2026-10-25T23:59:16Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 10.002153 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 10.001482 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 10.001804 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 10.002822 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 10.001475 | Blocked |
| KV | frontend | Function + KV ping | 000 | 10.002264 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 10.002582 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 10.002517 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.871863 | Reachable |
| KV | backend | KV REST get | neterr | 0.121936 | Blocked |
| Blob | backend | Blob REST list | 200 | 1.463179 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.039582 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.666924 | Reachable |
| Vercel API | transport | REST API | 308 | 0.737769 | Reachable |
| Analytics | transport | Analytics infra | 302 | 0.794337 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.037084 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 0.033593 | Blocked |
| DNS | transport | DNS site host | dns | 0.018959 | Reachable |
