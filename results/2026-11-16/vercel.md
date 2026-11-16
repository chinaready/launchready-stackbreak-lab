# Vercel mainland China probe — 2026-11-16

- Generated: 2026-11-16T01:40:38Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: unknown
- Redis region: unknown

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 000 | 10.002111 | Blocked |
| Redirects & rewrites | frontend | Redirect rule (301) | 000 | 10.002622 | Blocked |
| Redirects & rewrites | frontend | Rewrite to function (200) | 000 | 10.002593 | Blocked |
| Functions | frontend | Function helloProbe | 000 | 10.001896 | Blocked |
| Blob | frontend | Function + Blob stamp | 000 | 10.002299 | Blocked |
| KV | frontend | Function + KV ping | 000 | 10.002567 | Blocked |
| Edge Middleware | frontend | Edge Middleware banner | 000 | 10.002349 | Blocked |
| Cron Jobs | frontend | Cron endpoint | 000 | 10.001870 | Blocked |
| Headers | frontend | Custom response header | 000 | 0 | Blocked |
| Vercel API | backend | API current user | 200 | 0.588708 | Reachable |
| KV | backend | KV REST get | neterr | 0.396668 | Blocked |
| Blob | backend | Blob REST list | 200 | 1.400384 | Degraded |
| Functions | backend | Server -> Function invoke | neterr | 0.280886 | Blocked |
| Dashboard | transport | Marketing site | 200 | 0.664142 | Reachable |
| Vercel API | transport | REST API | 308 | 0.307260 | Reachable |
| Analytics | transport | Analytics infra | 302 | 1.056388 | Degraded |
| DNS | transport | DNS vercel.app | dns | 0.036686 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 000 | 10.001959 | Blocked |
| DNS | transport | DNS site host | dns | 0.008737 | Reachable |
