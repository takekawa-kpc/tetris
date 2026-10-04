import { test, expect } from '@playwright/test'

test('ページが読み込まれる', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Tetris')
  await expect(page.getByRole('heading', { name: 'Tetris' })).toBeVisible()
})
