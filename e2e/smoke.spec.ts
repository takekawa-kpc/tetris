import { test, expect } from '@playwright/test';

// Smoke test – ensure that the app loads and the main heading is visible

// The dev server is started on http://localhost:5174/tetris/
// Playwright automatically runs tests inside the dev server context.

// We set a longer timeout to allow the UI to render before assertions
const DEFAULT_TIMEOUT = 15000;

// The base URL is configured in vite.config.ts (`base: '/tetris/'`)
// and Playwright is launched with the correct `baseURL`.

// Note: The app currently renders the <h1> with text "Tetris".

// In the event that the heading is not rendered, the assertion
// will fail, providing a clear error message.

test('ページが読み込まれる', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Tetris');
  // wait for the main heading to appear – it might take a few ms
  await expect(page.getByRole('heading', { name: 'Tetris' }))
    .toBeVisible({ timeout: DEFAULT_TIMEOUT });
});
