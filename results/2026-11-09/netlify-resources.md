# Netlify page-resource latency — 2026-11-09

- Generated: 2026-11-09T01:33:01Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.274043 | 0.362374 | 0.355 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.261387 | 0.261522 | 0.012 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.933692 | 0.937974 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.265090 | 0.265186 | 0.004 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.271379 | 0.703862 | 2.733 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 1.102692 | 1.627034 | 1.347 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 1.280762 | 1.779304 | 3.371 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 1.433894 | 1.608800 | 0.242 | Degraded |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 1.785199 | 1.953920 | 0.316 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.711635 | 1.271671 | 6.285 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.711259 | 1.405556 | 17.492 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.873481 | 1.760546 | 27.265 | Degraded |
| Raw source 2400 | raw | 200 | 2663877 | 0.512445 | 1.200229 | 17.756 | Degraded |
