import { test, expect } from '@playwright/test';

test('admin can login, view, create, and delete questions', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[placeholder="Username"]', 'guru');
  await page.fill('input[placeholder="Password"]', 'guru123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/questions/);
  await expect(page.locator('text=Kelola Soal')).toBeVisible();

  // Create a new question
  const promptInput = page.locator('input[placeholder="Prompt soal"]');
  await promptInput.fill('Soal E2E Admin Smoke Test');
  await page.click('button:has-text("Simpan")');

  // Verify created question appears
  const newQuestion = page.locator('text=Soal E2E Admin Smoke Test');
  await expect(newQuestion).toBeVisible();

  // Delete the question with confirmation dialog
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  const row = page.locator('li', { hasText: 'Soal E2E Admin Smoke Test' });
  await row.locator('button:has-text("Hapus")').click();

  // Verify question is deleted
  await expect(newQuestion).not.toBeVisible();
});

test('admin can manage topics via CRUD', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[placeholder="Username"]', 'guru');
  await page.fill('input[placeholder="Password"]', 'guru123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/questions/);

  // Navigate to Kelola Topik
  await page.click('a:has-text("Topik")');
  await expect(page).toHaveURL(/\/admin\/topics/);
  await expect(page.locator('text=Kelola Topik')).toBeVisible();

  // Add a new topic
  const topicNameInput = page.locator('input[placeholder="Nama topik"]');
  await topicNameInput.fill('Topik E2E Nirkabel');
  await page.click('button:has-text("Tambah")');

  // Verify created topic appears
  const newTopic = page.locator('text=Topik E2E Nirkabel');
  await expect(newTopic).toBeVisible();

  // Delete the topic
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  const topicRow = page.locator('li', { hasText: 'Topik E2E Nirkabel' });
  await topicRow.locator('button:has-text("Hapus")').click();

  // Verify topic is deleted
  await expect(newTopic).not.toBeVisible();
});
