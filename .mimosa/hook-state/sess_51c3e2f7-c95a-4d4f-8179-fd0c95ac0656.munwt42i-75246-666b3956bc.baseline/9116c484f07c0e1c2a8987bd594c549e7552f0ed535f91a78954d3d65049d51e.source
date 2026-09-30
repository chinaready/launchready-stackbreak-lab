// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0.
// v2.1 information architecture: Home dashboard / Stack / Product, main nav everywhere.
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

test('stack (/demos/) keeps the category catalog and community picks, no tabs', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.main-nav__link[aria-current="page"]')).toHaveText('Stack');
  await expect(page.locator('#catalog .cat-block').first()).toBeVisible();
  await expect(page.locator('[data-catalog-tab]')).toHaveCount(0);
  for (const s of community.services) {
    await expect(page.locator(`#community-picks .dep-card[data-sid="${s.id}"]`)).toBeVisible();
  }
});

test('product page shows whole-stack sections with live chips', async ({ page }) => {
  await page.goto('/product.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.main-nav__link[aria-current="page"]')).toHaveText('Product');
  for (const id of ['#firebase', '#netlify-latency', '#vercel', '#vercel-latency']) {
    await expect(page.locator(id)).toBeVisible();
  }
  await expect(page.locator('.dep-card[data-fbpath="frontend"] .dep-card__foot')).not.toBeEmpty();
});

test('removed v2 designs stay gone', async ({ page }) => {
  const resp = await page.goto('/demos/matrix.html');
  expect(resp?.status()).toBe(404);
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/demos/matrix.html"]')).toHaveCount(0);
});
