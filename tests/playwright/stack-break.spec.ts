import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

// Data-driven from probe/targets.json so adding a dependency needs no new test code.
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const targets = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets.json'), 'utf8'));

type Verdict = 'Blocked' | 'Degraded' | 'Reachable';
interface BrowserFinding {
  id: string;
  name: string;
  category: string;
  demoPath: string;
  domain: string;
  failedRequests: string[];
  okRequests: string[];
  slowestMs: number;
  verdict: Verdict;
  screenshotPath: string | null;
}

// Services known to be hard-blocked from mainland China. When EXPECT_BLOCKED=1
// (set on the mainland runner) the suite asserts these really are Blocked.
const KNOWN_BLOCKED = new Set([
  'google-fonts', 'material-symbols', 'recaptcha', 'google-signin', 'gtm', 'ga4', 'youtube', 'google-maps',
]);
const SLOW_MS = 5000;

const DATE = new Date().toISOString().slice(0, 10);
const OUT_DIR = join(ROOT, 'results', DATE);
const SHOTS_DIR = join(OUT_DIR, 'screenshots');
const findings: BrowserFinding[] = [];

function classify(failed: string[], ok: string[], slowestMs: number): Verdict {
  if (ok.length === 0) return 'Blocked';
  if (failed.length > 0 || slowestMs > SLOW_MS) return 'Degraded';
  return 'Reachable';
}

async function settleStatus(page: Page): Promise<string> {
  // The shared demo.js settles #status to "loaded" or "failed" (with an 8s timeout).
  const status = page.locator('#status');
  try {
    await expect(status).toHaveAttribute('data-state', /loaded|failed/, { timeout: 12_000 });
  } catch {
    /* leave whatever state it reached */
  }
  return (await status.getAttribute('data-state')) || 'unknown';
}

for (const t of targets.services as Array<any>) {
  test(`${t.name} (${t.id}) — demo loads and reports a verdict`, async ({ page }) => {
    const failed: string[] = [];
    const ok: string[] = [];
    let slowestMs = 0;

    page.on('requestfailed', (req) => {
      if (req.url().includes(t.domain)) failed.push(req.url());
    });
    page.on('response', (res) => {
      if (res.url().includes(t.domain)) {
        ok.push(res.url());
        const timing = res.request().timing();
        if (timing && timing.responseEnd > slowestMs) slowestMs = timing.responseEnd;
      }
    });

    const resp = await page.goto(t.demoPath, { waitUntil: 'load' }).catch(() => null);

    // Invariants that must hold everywhere (real TDD gate on the demo page itself):
    expect(resp, `navigation to ${t.demoPath} returned a response`).not.toBeNull();
    await expect(page.locator('body')).toHaveAttribute('data-service', /.+/);
    // The page's data-domain must be tied to the target host (tolerant of phrasing
    // like "www.google.com/recaptcha" vs the bare host in targets.json).
    const pageDomain = (await page.locator('body').getAttribute('data-domain')) || '';
    const host = t.domain.split('/')[0];
    expect(
      pageDomain.includes(host) || t.domain.includes(pageDomain.split('/')[0]),
      `demo data-domain "${pageDomain}" should relate to target "${t.domain}"`
    ).toBeTruthy();
    await expect(page.locator('#status')).toBeVisible();

    const state = await settleStatus(page);
    expect(['loaded', 'failed']).toContain(state);

    // Give late third-party requests a moment to fail or finish.
    await page.waitForTimeout(2000);

    mkdirSync(SHOTS_DIR, { recursive: true });
    const screenshotPath = join(SHOTS_DIR, `${t.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const verdict = classify(failed, ok, slowestMs);
    findings.push({
      id: t.id, name: t.name, category: t.category, demoPath: t.demoPath, domain: t.domain,
      failedRequests: Array.from(new Set(failed)),
      okRequests: Array.from(new Set(ok)),
      slowestMs: Math.round(slowestMs),
      verdict,
      screenshotPath: `/results/${DATE}/screenshots/${t.id}.png`,
    });

    // On the mainland runner, assert the known-blocked services really are blocked.
    if (process.env.EXPECT_BLOCKED === '1' && KNOWN_BLOCKED.has(t.id)) {
      expect(verdict, `${t.name} expected Blocked from mainland China`).toBe('Blocked');
    }
  });
}

test.afterAll(async () => {
  if (findings.length === 0) return;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'browser.json'), JSON.stringify({ generatedAt: new Date().toISOString(), browser: findings }, null, 2));

  // Merge browser[] into results/latest.json, preserving probe-owned fields.
  const latestPath = join(ROOT, 'results', 'latest.json');
  let latest: any = {};
  if (existsSync(latestPath)) {
    try { latest = JSON.parse(readFileSync(latestPath, 'utf8')); } catch { latest = {}; }
  }
  // A real run is not sample data.
  delete latest.sample;
  delete latest.note;
  latest.browser = findings.map((f) => ({
    id: f.id, demoPath: f.demoPath, failedRequests: f.failedRequests,
    verdict: f.verdict, screenshotPath: f.screenshotPath,
  }));
  writeFileSync(latestPath, JSON.stringify(latest, null, 2));
});
