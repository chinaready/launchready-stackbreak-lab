# Netlify page-resource latency — 2026-10-12

- Generated: 2026-10-12T01:07:27Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.251131 | 0.332726 | 0.387 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.273193 | 0.273266 | 0.011 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.933710 | 0.933754 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.276852 | 0.276931 | 0.004 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.494270 | 0.837612 | 2.296 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 1.204097 | 1.620251 | 1.353 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 1.182041 | 1.880764 | 3.189 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 1.263670 | 1.428094 | 0.272 | Degraded |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 1.206857 | 1.377324 | 0.449 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.696293 | 1.611250 | 4.960 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.566420 | 1.960588 | 12.540 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.600436 | 2.549053 | 18.831 | Degraded |
| Raw source 2400 | raw | 200 | 2663877 | 0.561575 | 2.504262 | 8.510 | Degraded |
