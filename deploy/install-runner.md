# Self-hosted GitHub Actions runner (mainland China)

The evidence and deploy workflows must run **on the launchready.cn host inside mainland China**,
not on GitHub-hosted runners (which sit outside China and would report everything as reachable).

## Why self-hosted

`results/` verdicts are only trustworthy when the probe and browser checks egress from a mainland
network. This runner provides that vantage point.

## Prerequisites on the host

```bash
# Docker + compose (already present if the site is running)
docker --version && docker compose version

# Tooling for probe + browser checks
sudo apt-get update
sudo apt-get install -y curl dnsutils jq git

# Node 20 (for Playwright)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Register the runner

1. In GitHub: **Settings -> Actions -> Runners -> New self-hosted runner** for
   `chinaready/launchready-stackbreak-lab` and copy the token.
2. On the host:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o runner.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64.tar.gz
tar xzf runner.tar.gz
./config.sh --url https://github.com/chinaready/launchready-stackbreak-lab \
  --token <RUNNER_TOKEN> \
  --labels self-hosted,linux,x64,mainland-china \
  --name launchready-cn-runner --unattended
```

3. Install as a service so it survives reboots:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

## Permissions

- The runner user must be in the `docker` group so `deploy.yml` can run `docker compose`:

```bash
sudo usermod -aG docker "$USER"   # re-login afterwards
```

- Install Playwright's Chromium once (CI also runs this, but pre-installing speeds first run):

```bash
cd /opt/launchready-stackbreak-lab && npm ci && npx playwright install --with-deps chromium
```

## Verify

Trigger the evidence workflow manually:

- GitHub -> **Actions -> evidence -> Run workflow** (`workflow_dispatch`), or push a commit.
- Confirm a new `results/<date>/` folder and updated `results/latest.json` are committed by the bot.

## Secrets

- No secrets belong in the repo. If a deploy step ever needs a token, add it under
  **Settings -> Secrets and variables -> Actions** and reference it as `${{ secrets.NAME }}`.
- Optional vendor test keys (`GTM_TEST_CONTAINER_ID`, etc.) can be added as Actions **variables**
  and injected into the evidence run; demos work without them.
