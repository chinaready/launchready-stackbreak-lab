import { test, expect } from '@playwright/test';

test('beijing-view shell renders hero, heartbeat and gallery containers', async ({ page }) => {
  await page.goto('/demos/beijing-view.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bv-hero')).toBeVisible();
  await expect(page.locator('#bv-heartbeat')).toBeAttached();
  await expect(page.locator('#bv-gallery')).toBeAttached();
  await expect(page).toHaveTitle(/Beijing/i);
});
