import { test, expect, Page } from '@playwright/test';

async function completeActiveQuiz(page: Page) {
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
}

test('student can complete a topic quiz', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', 'Test Siswa Topik');
  await page.selectOption('select', '7');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/topics/);
  await page.click('text=Algoritma');
  await expect(page).toHaveURL(/\/quiz\//);

  await completeActiveQuiz(page);
});

test('student can complete challenge mode quiz with timer', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', 'Test Siswa Tantang');
  await page.selectOption('select', '7');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/topics/);

  await page.click('text=Mode Tantangan');
  await expect(page).toHaveURL(/\/challenge/);

  await page.click('button:has-text("Mulai Tantangan")');
  await expect(page).toHaveURL(/\/quiz\//);

  // Verify timer element is visible
  const timer = page.getByRole('timer');
  await expect(timer).toBeVisible();

  await completeActiveQuiz(page);
});

test('student can play campaign mode and navigate to leaderboard', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', 'Test Siswa Campaign');
  await page.selectOption('select', '7');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/topics/);

  await page.click('text=Mode Campaign');
  await expect(page).toHaveURL(/\/campaign/);

  const level1Btn = page.locator('button:has-text("Level 1")').first();
  await expect(level1Btn).toBeEnabled();
  await level1Btn.click();

  await expect(page).toHaveURL(/\/quiz\//);
  await completeActiveQuiz(page);

  // Navigate to leaderboard from result page
  await page.click('button:has-text("Leaderboard")');
  await expect(page).toHaveURL(/\/leaderboard/);
  await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible();
});

test('student unlocks campaign level 2 after passing level 1', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', 'Campaign Master');
  await page.selectOption('select', '7');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/topics/);

  await page.click('text=Mode Campaign');
  await expect(page).toHaveURL(/\/campaign/);

  const level1Btn = page.locator('button:has-text("Level 1")').first();
  const level2Btn = page.locator('button:has-text("Level 2")').first();
  await expect(level1Btn).toBeEnabled();
  await expect(level2Btn).toBeDisabled();

  await level1Btn.click();
  await expect(page).toHaveURL(/\/quiz\//);
  await expect(page.locator('text=Sebelumnya')).toBeVisible();

  for (let i = 0; i < 5; i++) {
    const correctPg = page.locator('button:has-text("Urutan langkah logis")');
    const correctTf = page.locator('button:has-text("Benar")');
    if (await correctPg.isVisible()) {
      await correctPg.click();
    } else if (await correctTf.isVisible()) {
      await correctTf.click();
    } else {
      const anyOpt = page.locator('.bg-white.p-6 button').first();
      if (await anyOpt.isVisible()) await anyOpt.click();
    }

    const nextBtn = page.locator('text=Berikutnya');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    } else {
      break;
    }
  }

  await page.click('text=Selesai & Submit');
  await expect(page).toHaveURL(/\/result\//);
  await expect(page.locator('text=Hasil Kuis')).toBeVisible();
  await expect(page.locator('text=Selamat! Kamu berhasil membuka level berikutnya!')).toBeVisible();

  await page.click('button:has-text("Mode Campaign")');
  await expect(page).toHaveURL(/\/campaign/);

  // Level 2 should now be unlocked!
  await expect(page.locator('button:has-text("Level 2")').first()).toBeEnabled();
});
