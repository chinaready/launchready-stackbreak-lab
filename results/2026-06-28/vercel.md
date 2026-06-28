# Vercel mainland China probe — 2026-06-28

- Generated: 2026-06-28T09:17:41Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Blob region: Hong Kong
- Redis region: Singapore

| Product | Path | Probe | HTTP | Total (s) | Verdict |
|---|---|---|---|---|---|
| Hosting / CDN | frontend | Static hosting (CDN) | 200 | 1.114291 | Reachable |
| Redirects & rewrites | frontend | Redirect rule (301) | 308 | 1.110662 | Reachable |
| Redirects & rewrites | frontend | Rewrite to function (200) | 200 | 1.759052 | Reachable |
| Functions | frontend | Function helloProbe | 200 | 0.741074 | Reachable |
| Blob | frontend | Function + Blob stamp | 200 | 3.616721 | Reachable |
| KV | frontend | Function + KV ping | 200 | 2.083923 | Reachable |
| Edge Middleware | frontend | Edge Middleware banner | 200 | 1.091415 | Reachable |
| Cron Jobs | frontend | Cron endpoint | 200 | 1.624123 | Reachable |
| Headers | frontend | Custom response header | 200 | 0 | Reachable |
| Vercel API | backend | API current user | 200 | 0.903719 | Reachable |
| Vercel API | backend | API project lookup | 200 | 1.049076 | Reachable |
| Deploys | backend | API deployments list | 200 | 0.324659 | Reachable |
| KV | backend | KV REST get | 200 | 0.392881 | Reachable |
| Blob | backend | Blob REST list | 200 | 1.746795 | Reachable |
| Functions | backend | Server -> Function invoke | 200 | 0.671375 | Reachable |
| Dashboard | transport | Marketing site | 200 | 1.03886 | Reachable |
| Vercel API | transport | REST API | 308 | 1.020383 | Reachable |
| Analytics | transport | Analytics infra | 302 | 1.290029 | Reachable |
| DNS | transport | DNS vercel.app | dns | 0.008867 | Reachable |
| Hosting / CDN | transport | Deployed site edge | 200 | 0.492794 | Reachable |
| DNS | transport | DNS site host | dns | 0.008556 | Reachable |
