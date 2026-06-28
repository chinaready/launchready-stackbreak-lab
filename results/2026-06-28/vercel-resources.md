# Vercel page-resource latency — 2026-06-28

- Generated: 2026-06-28T09:18:04Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Edge serverRegion: sin1
- Blob region: Hong Kong
- Redis region: Singapore

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 10160 | 0.607726 | 0.701119 | 0.116 | Reachable |
| Edge region (/__where) | endpoint | 200 | 188 | 0.521761 | 0.521877 | 0.003 | Reachable |
| Function (hello) | endpoint | 200 | 81 | 0.698281 | 0.698412 | 0.001 | Reachable |
| Edge Middleware (banner) | endpoint | 200 | 120 | 0.591703 | 0.591772 | 0.002 | Reachable |
| Function + KV | endpoint | 200 | 101 | 1.201201 | 1.20132 | 0.001 | Reachable |
| Raw asset ~1 MB | raw | 200 | 999063 | 1.160785 | 1.762145 | 4.536 | Reachable |
| Raw asset ~3 MB | raw | 200 | 3073303 | 1.133737 | 1.964184 | 12.517 | Reachable |
| Raw asset ~6 MB | raw | 200 | 6000130 | 1.409698 | 3.443117 | 13.941 | Reachable |
| Raw source 2400 | raw | 200 | 2663877 | 1.551542 | 2.478279 | 8.599 | Reachable |
