# Netlify page-resource latency — 2026-10-26

- Generated: 2026-10-25T23:58:56Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.613040 | 0.694848 | 0.185 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.272352 | 0.272461 | 0.011 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.565290 | 0.572940 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.328324 | 0.328456 | 0.003 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.253889 | 0.664609 | 2.894 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 0.921435 | 1.353520 | 1.620 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 0.562164 | 1.229181 | 4.879 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 1.175282 | 1.342948 | 0.290 | Degraded |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 1.192993 | 1.355570 | 0.456 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.782487 | 2.021310 | 3.954 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.616891 | 1.809731 | 13.586 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.637193 | 2.270657 | 21.140 | Degraded |
| Raw source 2400 | raw | 200 | 2663877 | 0.511720 | 1.746986 | 12.199 | Degraded |
