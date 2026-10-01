// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const latest = JSON.parse(readFileSync(join(ROOT, 'results', 'latest.json'), 'utf8'));

test('trends page renders a stripe row per target with segments and a summary', async ({ page }) => {
  await page.goto('/trends/', { waitUntil: 'networkidle' });
  const rows = page.locator('.tr-row');
  expect(await rows.count()).toBe(latest.services.length);
  for (const s of latest.services) {
    await expect(page.locator(`.tr-row[data-sid="${s.id}"] .tr-stripe rect`).first()).toBeAttached();
  }
  await expect(page.locator('#tr-summary')).toContainText(/newly blocked/i);
  await expect(page.locator('.tr-cat__label').first()).toBeVisible();
});
