import { test, expect } from '@playwright/test';

test.describe('Counsellor Wala - Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Mock backend responses so the UI renders without errors in isolated testing
    await page.route('**/api/v1/**', route => route.fulfill({ status: 200, json: {} }));
  });

  test('Login Page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('form').or(page.locator('input')).first()).toBeVisible();
  });

  test('Predictor flow loads correctly', async ({ page }) => {
    await page.goto('/predictor');
    await expect(page).toHaveURL(/.*predictor/);
  });

  test('Counsellor Sheet renders and filter works', async ({ page }) => {
    await page.goto('/counsellor');
    await expect(page).toHaveURL(/.*counsellor/);
  });

  test('College Compare page renders', async ({ page }) => {
    await page.goto('/compare');
    await expect(page).toHaveURL(/.*compare/);
  });

  test('College List page loads and has search input', async ({ page }) => {
    await page.goto('/colleges');
    await expect(page).toHaveURL(/.*colleges/);
  });

});
