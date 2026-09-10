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

  const nextBtn = page.locator('text=Berikutnya');
  const questionCard = page.locator('.bg-white.p-6');

  let maxSteps = 20;
  while ((await nextBtn.isVisible()) && maxSteps-- > 0) {
    const answerOption = questionCard.locator('button, input[type="radio"]').first();
    if (await answerOption.isVisible()) {
      await answerOption.click();
    }
    await nextBtn.click();
  }

  const lastAnswerOption = questionCard.locator('button, input[type="radio"]').first();
  if (await lastAnswerOption.isVisible()) {
    await lastAnswerOption.click();
  }

  await page.click('text=Selesai & Submit');
  await expect(page).toHaveURL(/\/result\//);
  await expect(page.locator('text=Hasil Kuis')).toBeVisible();
});
