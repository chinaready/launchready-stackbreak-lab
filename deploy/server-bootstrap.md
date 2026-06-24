# Server bootstrap — `stackbreak.launchready.cn`

First-time setup on the launchready.cn Docker host. **No secrets live in this repo**; keep tokens
in GitHub Actions secrets or the host's own environment.

## 0. Recon (read-only) before changing anything

```bash
docker ps                       # what already runs on this host
docker network ls               # existing shared proxy network?
ls /opt /srv 2>/dev/null        # where other sites live
# Identify how other subdomains (e.g. store.launchready.cn) terminate TLS:
#   - Traefik:   look for a traefik container + labels on services
#   - Caddy:     /etc/caddy/Caddyfile
#   - host nginx + certbot: /etc/nginx/sites-enabled/, certbot certificates
```

Record the answer; it decides how the lab attaches to TLS below.

## 1. DNS

Point `stackbreak.launchready.cn` at this host:

- An `A`/`AAAA` record to the host's public IP, **or**
- confirm an existing wildcard `*.launchready.cn` already covers it.

## 2. Clone the repo

```bash
sudo mkdir -p /opt/launchready-stackbreak-lab
sudo chown "$USER" /opt/launchready-stackbreak-lab
git clone https://github.com/chinaready/launchready-stackbreak-lab.git /opt/launchready-stackbreak-lab
cd /opt/launchready-stackbreak-lab
```

## 3. Start the container

```bash
docker compose up -d --build
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/demos/   # expect 200
```

## 4. Attach TLS / reverse proxy (pick the one matching recon)

### Option A — Traefik (shared network)

Add the container to the proxy network and labels. Append to `docker-compose.yml` (or a
`docker-compose.override.yml`):

```yaml
services:
  stackbreak:
    networks: [web]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.stackbreak.rule=Host(`stackbreak.launchready.cn`)"
      - "traefik.http.routers.stackbreak.entrypoints=websecure"
      - "traefik.http.routers.stackbreak.tls.certresolver=le"
      - "traefik.http.services.stackbreak.loadbalancer.server.port=80"
networks:
  web:
    external: true   # name of the existing Traefik network
```

### Option B — Caddy

Add to the host `Caddyfile`:

```text
stackbreak.launchready.cn {
    reverse_proxy localhost:8080
}
```

Then `caddy reload` (or restart the Caddy container).

### Option C — host nginx + certbot

```nginx
server {
    server_name stackbreak.launchready.cn;
    location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
}
```

```bash
sudo certbot --nginx -d stackbreak.launchready.cn
```

## 5. Verify

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://stackbreak.launchready.cn/demos/
curl -fsS https://stackbreak.launchready.cn/results/latest.json | head
```

## 6. Ongoing

- Deploys: pushes to `main` trigger `.github/workflows/deploy.yml` on the self-hosted runner
  (`git pull` + `docker compose up -d`).
- Evidence: `.github/workflows/evidence.yml` runs weekly, updating `results/`.
- See [`install-runner.md`](install-runner.md) to register the runner.
