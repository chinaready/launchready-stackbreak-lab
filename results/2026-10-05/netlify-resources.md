# Netlify page-resource latency — 2026-10-05

- Generated: 2026-10-05T00:34:59Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.256139 | 0.339787 | 0.379 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.263562 | 0.263661 | 0.012 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.914068 | 0.914237 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.521225 | 0.521317 | 0.002 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.465819 | 0.870221 | 2.210 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 1.193620 | 1.595626 | 1.374 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 0.799722 | 1.405987 | 4.266 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 1.264998 | 1.441317 | 0.270 | Degraded |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 1.244847 | 1.409496 | 0.438 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.714060 | 1.378944 | 5.796 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.600167 | 1.462477 | 16.811 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.630492 | 3.037724 | 15.802 | Blocked |
| Raw source 2400 | raw | 200 | 2663877 | 0.937888 | 3.103481 | 6.867 | Blocked |
