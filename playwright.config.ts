// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import { defineConfig, devices } from '@playwright/test';

// Where the demos are served.
// - Local: docker compose up  ->  http://localhost:8080
// - Mainland runner / CI: set PLAYWRIGHT_BASE_URL=https://stackbreak.launchready.cn
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
