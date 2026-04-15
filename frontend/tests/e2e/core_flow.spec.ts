import { test, expect } from '@playwright/test';

test('Core Platform Initialization Flow', async ({ page }) => {
  // Navigate to root (which might redirect to /home or /app)
  await page.goto('/');
  
  // Wait for the frontend to fully mount
  await page.waitForLoadState('networkidle');

  // Assert there is at least one major heading or navbar loaded
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
});
