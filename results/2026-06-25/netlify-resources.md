# Netlify page-resource latency — 2026-06-25

- Generated: 2026-06-25T10:40:23Z
- Environment: Alibaba Cloud / cn-beijing-h / lunchready-prd
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 15765 | 0.844906 | 0.927029 | 0.136 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.276198 | 0.276294 | 0.011 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 1.128172 | 1.144241 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.277277 | 0.277382 | 0.004 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.309075 | 0.644991 | 2.982 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 0.737283 | 1.153672 | 1.900 | Reachable |
| Image CDN w=800 | image-cdn | 200 | 749717 | 0.638250 | 1.140250 | 5.260 | Reachable |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 0.750752 | 0.914219 | 0.426 | Reachable |
| Image CDN w=2400 avif | image-cdn | 200 | 38218 | 0.941333 | 1.108116 | 0.276 | Reachable |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.639401 | 1.188915 | 6.723 | Reachable |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.629926 | 2.619417 | 9.386 | Reachable |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.757255 | 3.532847 | 13.587 | Reachable |
| Raw source 2400 | raw | 200 | 2663877 | 0.566923 | 2.450108 | 8.698 | Reachable |
