// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('beijing-view shell renders hero, heartbeat and gallery containers', async ({ page }) => {
  await page.goto('/demos/beijing-view.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bv-hero')).toBeVisible();
  await expect(page.locator('#bv-heartbeat')).toBeAttached();
  await expect(page.locator('#bv-gallery')).toBeAttached();
  await expect(page).toHaveTitle(/Beijing/i);
});

// A compact fixture matching results/latest.json shape (11 services + browser[]).
function fixture() {
  const defs = [
    ['google-fonts', 'Google Fonts', 'fonts', 'fonts.googleapis.com', 'Reachable', '200', 0.42, 0],
    ['material-symbols', 'Material Symbols', 'fonts', 'fonts.googleapis.com', 'Reachable', '200', 0.14, 0],
    ['adobe-typekit', 'Adobe Fonts (Typekit)', 'fonts', 'use.typekit.net', 'Reachable', '404', 1.15, 0],
    ['recaptcha', 'Google reCAPTCHA', 'auth', 'www.google.com', 'Blocked', '000', 10.0, 28],
    ['auth0', 'Auth0', 'auth', 'cdn.auth0.com', 'Degraded', '200', 6.52, 0],
    ['google-signin', 'Google Sign-In', 'auth', 'accounts.google.com', 'Blocked', '000', 10.0, 28],
    ['gtm', 'Google Tag Manager', 'analytics', 'www.googletagmanager.com', 'Reachable', '200', 0.24, 0],
    ['ga4', 'Google Analytics 4', 'analytics', 'www.googletagmanager.com', 'Reachable', '200', 0.26, 0],
    ['youtube', 'YouTube embed', 'embeds', 'www.youtube.com', 'Blocked', '000', 10.0, 28],
    ['google-maps', 'Google Maps', 'embeds', 'maps.googleapis.com', 'Blocked', '000', 10.0, 28],
    ['vimeo', 'Vimeo embed', 'embeds', 'player.vimeo.com', 'Blocked', '000', 10.0, 28],
  ] as const;
  // A served local image so screenshots load even with external requests blocked.
  const shot = '/results/2026-06-24/screenshots/google-fonts.png';
  return {
    generatedAt: '2026-06-24T14:42:13Z',
    environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
    services: defs.map(([id, name, category, domain, verdict, httpCode, totalSec, curlExit]) => ({
      id, name, category, domain, url: `https://${domain}/probe-${id}`, demoPath: `/demos/${id}.html`,
      symptom: `Expected symptom for ${name}.`, httpCode, connectSec: 0, sslSec: 0, totalSec, curlExit,
      dnsResolved: true, verdict,
    })),
    browser: defs.map(([id]) => ({ id, demoPath: `/demos/${id}.html`, failedRequests: [], verdict: 'Blocked', screenshotPath: shot })),
  };
}

async function mountWithFixture(page: import('@playwright/test').Page) {
  await page.route('**/results/latest.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture()) }));
  // Block ALL external (non-localhost) requests to prove the page does not depend on the viewer's network.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.fallback();
    return route.abort();
  });
  await page.goto('/demos/beijing-view.html', { waitUntil: 'networkidle' });
}

test('renders one card per service, independent of the viewer network', async ({ page }) => {
  await mountWithFixture(page);
  await expect(page.locator('.bv-card')).toHaveCount(11);
});

test('heartbeat shows verdict counts and the Beijing snapshot time', async ({ page }) => {
  await mountWithFixture(page);
  const hb = page.locator('#bv-heartbeat');
  await expect(hb).toContainText('cn-beijing-h');
  await expect(hb.locator('.verdict.Blocked')).toContainText('Blocked');
  // 5 Blocked, 1 Degraded, 5 Reachable in the fixture.
  await expect(hb).toContainText('5');
});

test('a blocked card shows its verdict chip and screenshot', async ({ page }) => {
  await mountWithFixture(page);
  const card = page.locator('.bv-card', { hasText: 'Google reCAPTCHA' });
  await expect(card.locator('.verdict.Blocked')).toBeVisible();
  await expect(card.locator('.bv-card__shot img')).toHaveAttribute('src', /screenshots/);
});

test('compare button reveals a my-browser result and toggles off', async ({ page }) => {
  await mountWithFixture(page);
  const card = page.locator('.bv-card', { hasText: 'Google Fonts' });
  const btn = card.locator('.bv-card__compare');
  await expect(btn).toHaveText(/Compare with my browser/i);
  await btn.click();
  // External requests are aborted in the fixture, so the live load resolves to a failure state.
  await expect(card.locator('.bv-card__live')).toBeVisible();
  // The Google Fonts card injects a <link> into <head> to load the resource live.
  await expect(page.locator('head link[href*="fonts.googleapis.com"]')).toHaveCount(1);
  await expect(card.locator('.bv-card__live .bv-live-fail')).toBeVisible({ timeout: 12000 });
  await btn.click();
  await expect(card.locator('.bv-card__live')).toHaveCount(0);
  // Toggle-off must remove the injected node so re-opening does not accumulate duplicates.
  await expect(page.locator('head link[href*="fonts.googleapis.com"]')).toHaveCount(0);
});
