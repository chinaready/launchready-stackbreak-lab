# Vercel mainland China probe — 2026-11-02

- Generated: 2026-11-02T01:23:42Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 10.002671 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 10.002420 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 10.002231 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 10.001723 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 10.001510 | Blocked |
| KV | frontend | Function + KV ping | 000 | 10.001983 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 10.002533 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 10.002404 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.60971 | Reachable |
| KV | backend | KV REST get | neterr | 0.118195 | Blocked |
| Blob | backend | Blob REST list | 200 | 1.268897 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.012714 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.684296 | Reachable |
| Vercel API | transport | REST API | 308 | 0.335830 | Reachable |
| Analytics | transport | Analytics infra | 302 | 0.952814 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.043602 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 0.007523 | Blocked |
| DNS | transport | DNS site host | dns | 0.017859 | Reachable |
