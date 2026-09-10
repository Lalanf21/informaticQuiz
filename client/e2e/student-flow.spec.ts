import { test, expect } from '@playwright/test';

test('student can complete a topic quiz', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', 'Test Siswa');
  await page.selectOption('select', '7');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/topics/);
  await page.click('text=Algoritma');
  await expect(page).toHaveURL(/\/quiz\//);

  // wait for quiz to load
  await expect(page.locator('text=Sebelumnya')).toBeVisible();
  while (await page.locator('text=Berikutnya').isVisible()) {
    await page.click('text=Berikutnya');
  }
  await page.click('text=Selesai & Submit');
  await expect(page).toHaveURL(/\/result\//);
  await expect(page.locator('text=Hasil Kuis')).toBeVisible();
});
