// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const curated = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets.json'), 'utf8'));
const community = JSON.parse(readFileSync(join(ROOT, 'probe', 'targets-community.json'), 'utf8'));
const vendorsWithContent = new Set([
  ...curated.services.map((s: any) => s.vendor),
  ...community.services.map((s: any) => s.vendor),
  ...curated.platforms.map((p: any) => p.vendor),
]);

test('catalog offers both tabs and keeps the static category panel by default', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-catalog-tab="category"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-category .cat-block').first()).toBeVisible();
  await expect(page.locator('#panel-service')).toBeHidden();
});

test('By-service tab groups every vendor with content', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await page.click('[data-catalog-tab="service"]');
  await expect(page.locator('#panel-service')).toBeVisible();
  await expect(page.locator('#panel-service')).not.toBeEmpty();
  for (const vendor of vendorsWithContent) {
    await expect(page.locator(`#panel-service [data-vendor-block="${vendor}"]`)).toBeVisible();
  }
});

test('community targets appear under their vendor with a community badge and in Community picks', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await page.click('[data-catalog-tab="service"]');
  for (const s of community.services) {
    await expect(page.locator(`#panel-service .dep-card[data-sid="${s.id}"] .dep-card--badge`)).toBeVisible();
  }
  // Community picks lives in the category panel — switch back before asserting it.
  await page.click('[data-catalog-tab="category"]');
  for (const s of community.services) {
    await expect(page.locator(`#community-picks .dep-card[data-sid="${s.id}"]`)).toBeVisible();
  }
});

test('community service cards link to the results viewer, curated cards to their demo', async ({ page }) => {
  await page.goto('/demos/', { waitUntil: 'domcontentloaded' });
  await page.click('[data-catalog-tab="service"]');
  await expect(page.locator('#panel-service .dep-card[data-sid="stripe-js"]')).toHaveAttribute('href', '/public/results/');
  await expect(page.locator('#panel-service .dep-card[data-sid="google-fonts"]')).toHaveAttribute('href', '/demos/fonts-google.html');
});

test('matrix page renders one row per vendor and chips link correctly', async ({ page }) => {
  await page.goto('/demos/matrix.html', { waitUntil: 'domcontentloaded' });
  for (const vendor of vendorsWithContent) {
    await expect(page.locator(`#mx-table tr[data-vendor="${vendor}"]`)).toBeVisible();
  }
  await expect(page.locator('#mx-table td[data-cat="payments"] .mx-chip[data-sid="stripe-js"]')).toBeVisible();
  await expect(page.locator('#mx-table td[data-cat="analytics"] .mx-chip[data-sid="gtm"]')).toHaveAttribute('href', '/demos/gtm.html');
  await expect(page.locator('#mx-table td[data-cat="whole"] .mx-chip[data-sid="firebase"]')).toHaveAttribute('href', '/results/firebase.html');
});

test('matrix page fallback is present without JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/demos/matrix.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mx-noscript')).toBeVisible();
  await ctx.close();
});
