# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` branch (live at stackbreak.launchready.cn) | Yes |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report sensitive issues to [security@chinaready.co](mailto:security@chinaready.co) or via
[GitHub private security advisories](https://github.com/chinaready/launchready-stackbreak-lab/security/advisories/new).

We aim to acknowledge reports within 3 business days.

## What belongs in a report

- Description of the issue and potential impact
- Steps to reproduce (URLs, commands, screenshots if helpful)
- Whether you believe it affects the live site, CI, or only local development

## Secrets and credentials

This repository must never contain:

- Production API keys, OAuth client secrets, or service-account JSON
- Personal access tokens (Netlify, GitHub, Firebase admin)
- Customer domains, PII, or credentials in screenshots or results

Use [`.env.example`](.env.example) as a template; copy to `.env` locally (gitignored).
Contributors should use vendor **test/sandbox** keys only.

Published `results/` snapshots may include domain-restricted **web** API keys in probe
URLs (for example Firebase client keys). These are measurement artifacts, not secrets
intended for reuse — rotate any key you accidentally commit.

## Scope

In scope: vulnerabilities in this repo's code, workflows, Docker image, or the
public demos/results site we operate.

Out of scope: reachability or blocking of third-party services measured by the lab
(that is the product's subject matter, not a vulnerability in Stack Break Lab).
