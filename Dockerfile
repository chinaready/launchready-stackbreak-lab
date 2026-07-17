# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
# Stack Break Lab — static site image.
# Serves the repo root (demos, public, results) via nginx so all relative and
# root-absolute paths resolve the same way locally and in production.
# NGINX_IMAGE defaults to Docker Hub for local builds; the mainland host overrides it
# to a reachable mirror (Docker Hub is blocked there) via the prod compose build arg.
ARG NGINX_IMAGE=nginx:alpine
FROM ${NGINX_IMAGE}

# Site content. results/ is also bind-mounted in docker-compose so the evidence
# workflow can refresh it without rebuilding the image.
COPY demos/   /usr/share/nginx/html/demos/
COPY public/  /usr/share/nginx/html/public/
COPY results/ /usr/share/nginx/html/results/
COPY robots.txt sitemap.xml llms.txt /usr/share/nginx/html/

# Server config (redirects + no-store for JSON).
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
