import { test, expect } from '@playwright/test';

test('admin can login and see questions', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[placeholder="Username"]', 'guru');
  await page.fill('input[placeholder="Password"]', 'guru123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/questions/);
  await expect(page.locator('text=Kelola Soal')).toBeVisible();
});
