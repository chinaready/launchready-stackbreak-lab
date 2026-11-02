# Netlify page-resource latency — 2026-11-02

- Generated: 2026-11-02T01:23:18Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.633202 | 0.718902 | 0.179 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.426128 | 0.426175 | 0.007 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.974153 | 0.974911 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.398111 | 0.398230 | 0.003 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.256079 | 0.665990 | 2.888 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 1.222200 | 1.678461 | 1.306 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 0.980010 | 1.500488 | 3.997 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 1.008428 | 1.181679 | 0.329 | Degraded |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 1.394687 | 1.568956 | 0.394 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.702209 | 2.558629 | 3.124 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.590042 | 1.598047 | 15.385 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.558479 | 2.838267 | 16.912 | Degraded |
| Raw source 2400 | raw | 200 | 2663877 | 0.499161 | 2.381498 | 8.949 | Degraded |
