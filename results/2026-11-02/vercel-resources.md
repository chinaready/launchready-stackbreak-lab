# Vercel page-resource latency — 2026-11-02

- Generated: 2026-11-02T01:25:06Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://project-silk-eta-17.vercel.app
- Edge serverRegion: unknown
- Blob region: unknown
- Redis region: unknown

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 000 | 0 | 0.000000 | 0.006936 | 0.000 | Blocked |
| Edge region (/__where) | endpoint | 000 | 0 | 0.000000 | 0.009435 | 0.000 | Blocked |
| Function (hello) | endpoint | 000 | 0 | 0.000000 | 0.013981 | 0.000 | Blocked |
| Edge Middleware (banner) | endpoint | 000 | 0 | 0.000000 | 0.018065 | 0.000 | Blocked |
| Function + KV | endpoint | 000 | 0 | 0.000000 | 0.004605 | 0.000 | Blocked |
| Raw asset ~1 MB | raw | 000 | 0 | 0.000000 | 0.006402 | 0.000 | Blocked |
| Raw asset ~3 MB | raw | 000 | 0 | 0.000000 | 0.005230 | 0.000 | Blocked |
| Raw asset ~6 MB | raw | 000 | 0 | 0.000000 | 0.004451 | 0.000 | Blocked |
| Raw source 2400 | raw | 000 | 0 | 0.000000 | 0.004566 | 0.000 | Blocked |
