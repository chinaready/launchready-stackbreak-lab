# Vercel mainland China probe — 2026-10-12

- Generated: 2026-10-12T01:07:48Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 10.001095 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 10.001184 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 10.002718 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 10.002923 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 10.001303 | Blocked |
| KV | frontend | Function + KV ping | 000 | 10.002617 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 10.002259 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 10.001498 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.810841 | Reachable |
| KV | backend | KV REST get | neterr | 0.291802 | Blocked |
| Blob | backend | Blob REST list | 200 | 2.106157 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.287426 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.683884 | Reachable |
| Vercel API | transport | REST API | 308 | 0.748618 | Reachable |
| Analytics | transport | Analytics infra | 302 | 0.774634 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.032736 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 10.000831 | Blocked |
| DNS | transport | DNS site host | dns | 0.043635 | Reachable |
