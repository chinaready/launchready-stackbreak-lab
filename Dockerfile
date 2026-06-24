# Stack Break Lab — static site image.
# Serves the repo root (demos, public, results) via nginx so all relative and
# root-absolute paths resolve the same way locally and in production.
FROM nginx:alpine

# Site content. results/ is also bind-mounted in docker-compose so the evidence
# workflow can refresh it without rebuilding the image.
COPY demos/   /usr/share/nginx/html/demos/
COPY public/  /usr/share/nginx/html/public/
COPY results/ /usr/share/nginx/html/results/

# Server config (redirects + no-store for JSON).
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
