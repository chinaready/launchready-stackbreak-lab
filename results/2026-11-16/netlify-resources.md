# Netlify page-resource latency — 2026-11-16

- Generated: 2026-11-16T01:40:21Z
- Environment: Alibaba Cloud / cn-beijing-h / launchready.cn
- Site: https://steady-marshmallow-cb991f.netlify.app
- Edge serverRegion: aws-ap-southeast-1

| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |
|---|---|---|---|---|---|---|---|
| HTML document | endpoint | 200 | 16091 | 0.482058 | 0.568374 | 0.226 | Reachable |
| Edge region (/__where) | endpoint | 200 | 384 | 0.282739 | 0.282874 | 0.011 | Reachable |
| Function (hello) | endpoint | 200 | 97 | 0.928395 | 0.931338 | 0.001 | Reachable |
| Edge Function (banner) | endpoint | 200 | 129 | 0.282503 | 0.282672 | 0.004 | Reachable |
| Identity widget JS | endpoint | 200 | 240416 | 0.262687 | 0.687736 | 2.797 | Reachable |
| Image CDN w=400 | image-cdn | 200 | 274021 | 1.134863 | 1.565266 | 1.401 | Degraded |
| Image CDN w=800 | image-cdn | 200 | 749717 | 0.697912 | 1.255768 | 4.776 | Degraded |
| Image CDN w=1600 webp | image-cdn | 200 | 48636 | 0.733489 | 0.903349 | 0.431 | Reachable |
| Image CDN w=2400 avif | image-cdn | 200 | 77225 | 0.994470 | 1.162570 | 0.531 | Degraded |
| Raw asset ~1 MB | raw | 200 | 999063 | 0.625436 | 1.245266 | 6.418 | Degraded |
| Raw asset ~3 MB | raw | 200 | 3073303 | 0.574288 | 1.342690 | 18.311 | Degraded |
| Raw asset ~6 MB | raw | 200 | 6000130 | 0.575896 | 1.666761 | 28.799 | Degraded |
| Raw source 2400 | raw | 200 | 2663877 | 0.621778 | 1.367613 | 15.583 | Degraded |
