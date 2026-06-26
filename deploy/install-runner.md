# Self-hosted GitHub Actions runner (mainland China)

Evidence and deploy workflows run **on the launchready.cn host inside mainland China**, not on
GitHub-hosted runners (which sit outside China and would report everything as reachable).

## Prerequisites

```bash
docker --version && docker compose version
sudo apt-get update && sudo apt-get install -y curl dnsutils jq git
# Node 20 for Playwright — install via nodesource or nvm
```

## Register

1. GitHub → **Settings → Actions → Runners → New self-hosted runner** for
   `chinaready/launchready-stackbreak-lab`; copy the token.
2. On the host:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o runner.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64.tar.gz
tar xzf runner.tar.gz
./config.sh --url https://github.com/chinaready/launchready-stackbreak-lab \
  --token <RUNNER_TOKEN> \
  --labels self-hosted,linux,x64,mainland-china \
  --name launchready-cn-runner --unattended
sudo ./svc.sh install && sudo ./svc.sh start
```

3. Add the runner user to the `docker` group (`sudo usermod -aG docker "$USER"`).
4. Configure **GitHub SSH over port 443** (HTTPS to github.com is unreliable from mainland China):

```bash
# Deploy key with write access to this repo (Settings -> Deploy keys, or a user key).
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# Save the private key as ~/.ssh/github_deploy (chmod 600)

cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

ssh -T git@github.com   # expect: "Hi chinaready/launchready-stackbreak-lab! ..."
```

5. Pre-install Playwright Chromium once:

```bash
cd /opt/launchready-stackbreak-lab && npm ci && npx playwright install --with-deps chromium
```

## Verify

GitHub → **Actions → evidence → Run workflow**. Confirm a new `results/<date>/` folder and updated
`results/latest.json` are committed.

## Secrets

Vendor test keys and deploy tokens live in **Settings → Secrets and variables → Actions**, never in
the repo. Optional: `DEMO_USER_PASSWORD` secret overrides the host `.env` for Firebase probes.

The evidence workflow reads Firebase coordinates from `$DEPLOY_PATH/.env` on the self-hosted host
(see [`env.example`](env.example)). Ensure `FIREBASE_PROJECT_ID` and the service-account JSON path
exist before expecting `/results/firebase.html` to refresh weekly.
