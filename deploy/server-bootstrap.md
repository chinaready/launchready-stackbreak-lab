# Server bootstrap — `stackbreak.launchready.cn`

First-time setup on the launchready.cn Docker host. **No secrets in this repo** — keep tokens in
GitHub Actions secrets or the host environment.

## 1. DNS

Point `stackbreak.launchready.cn` at the host (A/AAAA record, or an existing `*.launchready.cn`
wildcard).

## 2. Clone and start

```bash
sudo mkdir -p /opt/launchready-stackbreak-lab
sudo chown "$USER" /opt/launchready-stackbreak-lab
git clone https://github.com/chinaready/launchready-stackbreak-lab.git /opt/launchready-stackbreak-lab
cd /opt/launchready-stackbreak-lab
docker compose -f docker-compose.prod.yml up -d --build
```

Production uses Traefik on the shared `lunchready` network with the `cloudflare` cert resolver — see
`docker-compose.prod.yml` for labels. Do not publish host ports on the shared production host.

## 3. Verify

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://stackbreak.launchready.cn/demos/
curl -fsS https://stackbreak.launchready.cn/results/latest.json | head
```

## 4. Ongoing

- **Deploy:** pushes to `main` trigger `.github/workflows/deploy.yml` on the self-hosted runner.
- **Evidence:** `.github/workflows/evidence.yml` runs weekly (and on manual dispatch).
- **Runner:** see [`install-runner.md`](install-runner.md).
- **Host `.env`:** see [`env.example`](env.example) for optional production variables (never commit).
