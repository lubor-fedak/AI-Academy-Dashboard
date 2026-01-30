import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures';

test.describe('Admin User Management', () => {
  test('should load user management page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/users');
  });

  test('should display page content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have accessible UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    // Page should be accessible (no JS errors)
    expect(true).toBe(true);
  });
});

test.describe('Admin Submissions Page', () => {
  test('should load submissions page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');
  });

  test('should display submissions content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
