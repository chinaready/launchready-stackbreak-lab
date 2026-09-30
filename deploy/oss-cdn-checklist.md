<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
# OSS + CDN cutover checklist (maintainer, one-time)

The site is pure static files. Git stays the source of truth; the OSS bucket is the CDN origin.
The `publish` workflow keeps the bucket in sync automatically once steps 4–5 are done.

1. **OSS bucket** — create it (mainland region, e.g. `oss-cn-beijing`), enable *static website
   hosting* with default homepage `index.html` (this makes `/stack/` and `/product/` resolve to
   their `index.html`). Note the static-website endpoint (shaped
   `https://<bucket>.oss-cn-beijing-1.aliyuncs.com`) — that, not the API endpoint, is the CDN
   origin. Bucket read access stays private; the CDN fetches via the origin, so also allow the
   static-site endpoint to serve objects publicly (static website hosting does this).

2. **CDN domain** — add `stackbreak.launchready.cn` as an accelerated domain, origin =
   the OSS *static website* endpoint from step 1, origin host = that endpoint's host. Attach an
   HTTPS certificate for the domain (upload the existing cert or issue Alibaba's free one).

3. **Cache rules** (CDN console → cache configuration):
   - `/*.json` → TTL 60s (evidence freshness)
   - `/*.html` and `/` → TTL 60s
   - `/public/assets/*` → TTL 30 days (URLs are versioned, safe to cache long)

4. **Redirect rules** (CDN console → URI redirect / edge rules) — these 301s supersede the
   in-repo stub pages (`demos/index.html`, `product.html`, `results/index.html`):
   - `/demos/` → `/stack/`
   - `/product.html` and `/product` → `/product/`
   - `/results/` → `/public/results/`

5. **GitHub secrets/vars** (repo Settings → Actions):
   - Secrets: `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET` (an AccessKey scoped to this bucket
     only — RAM user + `AliyunOSSFullAccess`-on-one-bucket policy)
   - Variables: `OSS_BUCKET` (bucket name), `OSS_ENDPOINT` (e.g. `oss-cn-beijing.aliyuncs.com`)

6. **First sync** — run the `publish` workflow manually (Actions → publish → Run workflow).
   Verify a few URLs against the bucket/CDN before switching DNS.

7. **DNS cutover** — change `stackbreak.launchready.cn` from the host A record to a CNAME of the
   CDN-provided domain. Propagation is fast; the old nginx container keeps serving meanwhile, so
   there is no downtime window.

8. **Decommission the old container** — once DNS + CDN are confirmed stable:
   `docker rm -f stackbreak-lab` on the launchready.cn host (Traefik keeps serving the other
   apps). **Keep the self-hosted runner** — it is the mainland evidence node and now also runs
   the publish uploads.
