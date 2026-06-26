import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';

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
// Per-service finding files. Each test writes its own file BEFORE any assertion can
// fail it, and the afterAll merge reads them back from disk. This keeps the snapshot
// complete even though Playwright restarts the worker process after a test failure
// (a fresh worker resets module-level state, so in-memory accumulation alone loses data).
const FIND_DIR = join(OUT_DIR, 'findings');

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

    // Use 'domcontentloaded' (not 'load'): a demo that embeds a blocked host never fires
    // the window 'load' event from mainland China, which would time out navigation before
    // we can screenshot the broken state. The demo HTML itself is served from the reachable
    // site, so domcontentloaded resolves quickly; demo.js then settles #status on its own.
    const resp = await page.goto(t.demoPath, { waitUntil: 'domcontentloaded' }).catch(() => null);

    const state = await settleStatus(page);

    // Give late third-party requests a moment to fail or finish.
    await page.waitForTimeout(2000);

    // Capture the screenshot and persist the finding BEFORE any assertion below, so the
    // recorded snapshot is complete even when the mainland invariants (EXPECT_BLOCKED) fail
    // the test — the page is built from these files, not from the pass/fail status.
    mkdirSync(SHOTS_DIR, { recursive: true });
    const screenshotPath = join(SHOTS_DIR, `${t.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    const verdict = classify(failed, ok, slowestMs);
    const finding: BrowserFinding = {
      id: t.id, name: t.name, category: t.category, demoPath: t.demoPath, domain: t.domain,
      failedRequests: Array.from(new Set(failed)),
      okRequests: Array.from(new Set(ok)),
      slowestMs: Math.round(slowestMs),
      verdict,
      screenshotPath: `/results/${DATE}/screenshots/${t.id}.png`,
    };
    mkdirSync(FIND_DIR, { recursive: true });
    writeFileSync(join(FIND_DIR, `${t.id}.json`), JSON.stringify(finding, null, 2));

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
    expect(['loaded', 'failed']).toContain(state);

    // On the mainland runner, assert the known-blocked services really are blocked.
    if (process.env.EXPECT_BLOCKED === '1' && KNOWN_BLOCKED.has(t.id)) {
      expect(verdict, `${t.name} expected Blocked from mainland China`).toBe('Blocked');
    }
  });
}

test.afterAll(async () => {
  // Read every per-service finding written during the run. Reading from disk (rather than
  // the in-memory `findings`) makes the merge robust to Playwright restarting the worker
  // after a failed test: whichever worker runs this hook last still sees ALL services.
  if (!existsSync(FIND_DIR)) return;
  const byId: Record<string, BrowserFinding> = {};
  for (const file of readdirSync(FIND_DIR)) {
    if (!file.endsWith('.json')) continue;
    try { const f = JSON.parse(readFileSync(join(FIND_DIR, file), 'utf8')); byId[f.id] = f; } catch { /* skip */ }
  }
  // Order by targets.json so the snapshot is deterministic regardless of run order.
  const ordered = (targets.services as Array<any>).map((t) => byId[t.id]).filter(Boolean) as BrowserFinding[];
  if (ordered.length === 0) return;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'browser.json'), JSON.stringify({ generatedAt: new Date().toISOString(), browser: ordered }, null, 2));

  // Merge browser[] into results/latest.json, preserving probe-owned fields.
  const latestPath = join(ROOT, 'results', 'latest.json');
  let latest: any = {};
  if (existsSync(latestPath)) {
    try { latest = JSON.parse(readFileSync(latestPath, 'utf8')); } catch { latest = {}; }
  }
  // A real run is not sample data.
  delete latest.sample;
  delete latest.note;
  latest.browser = ordered.map((f) => ({
    id: f.id, demoPath: f.demoPath, failedRequests: f.failedRequests,
    verdict: f.verdict, screenshotPath: f.screenshotPath,
  }));
  writeFileSync(latestPath, JSON.stringify(latest, null, 2));
});
