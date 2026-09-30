// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0.
// v2.1 information architecture: Home dashboard / Stack (/stack/) / Product (/product/),
// main nav everywhere, old hub URLs redirect.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const community = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets-community.json'), 'utf8'));

test('home (/) shows the dashboard: nav, traffic lights, reports list', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.main-nav__link[aria-current="page"]')).toHaveText('Home');
  await expect(page.locator('.board-tile--reachable .board-tile__num')).not.toHaveText('—');
  await expect(page.locator('.board-tile--blocked .board-tile__num')).not.toHaveText('—');
  const rows = page.locator('#reports-table tbody tr');
  expect(await rows.count()).toBeGreaterThan(3);
  await expect(rows.first().locator('td a')).toHaveAttribute('href', /\/results\/\d{4}-\d{2}-\d{2}\/probe\.md$/);
  await expect(page.locator('#board-cats .board-cats__item').first()).toBeVisible();
});

test('stack (/stack/) keeps the category catalog and community picks, no tabs', async ({ page }) => {
  await page.goto('/stack/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.main-nav__link[aria-current="page"]')).toHaveText('Stack');
  await expect(page.locator('#catalog .cat-block').first()).toBeVisible();
  await expect(page.locator('[data-catalog-tab]')).toHaveCount(0);
  for (const s of community.services) {
    await expect(page.locator(`#community-picks .dep-card[data-sid="${s.id}"]`)).toBeVisible();
  }
});

test('product (/product/) hero mirrors the stack hero structure with its own copy', async ({ page }) => {
  await page.goto('/product/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.main-nav__link[aria-current="page"]')).toHaveText('Product');
  await expect(page.locator('.hero__title')).toContainText('Firebase, Netlify & Vercel');
  await expect(page.locator('.hero__cta .btn')).toHaveCount(3);
  await expect(page.locator('.hero__stats .stat')).toHaveCount(3);
  await expect(page.locator('.hero__stats [data-count="plat-probes"]')).not.toHaveText('—');
  for (const id of ['#firebase', '#netlify-latency', '#vercel', '#vercel-latency']) {
    await expect(page.locator(id)).toBeVisible();
  }
});

test('old hub URLs redirect to the new slugs', async ({ request }) => {
  const resp = await request.get('/demos/', { maxRedirects: 0 });
  expect(resp.status()).toBe(301);
  expect(resp.headers()['location']).toBe('/stack/');
  const resp2 = await request.get('/product.html', { maxRedirects: 0 });
  expect(resp2.status()).toBe(301);
  expect(resp2.headers()['location']).toBe('/product/');
});

test('removed v2 designs stay gone', async ({ page }) => {
  const resp = await page.goto('/demos/matrix.html');
  expect(resp?.status()).toBe(404);
  await page.goto('/stack/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/demos/matrix.html"]')).toHaveCount(0);
});
