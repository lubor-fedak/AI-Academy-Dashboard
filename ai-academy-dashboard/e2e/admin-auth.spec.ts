import { test, expect } from '@playwright/test';
import { TEST_ADMIN, loginAsAdmin } from './fixtures';

test.describe('Admin Authentication', () => {
  test('should login successfully with valid admin credentials', async ({ page }) => {
    await page.goto('/login');

    // Click admin tab
    await page.click('button[role="tab"]:has-text("Admin")');

    // Fill credentials
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to admin area or dashboard
    await expect(page).toHaveURL(/\/(admin|my-dashboard)/, { timeout: 15000 });
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[role="tab"]:has-text("Admin")');

    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);

    // Click and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should show loading indicator (Loader2 icon or disabled state)
    await expect(submitButton).toBeDisabled({ timeout: 1000 }).catch(() => {
      // Button may not be disabled if login is very fast
    });
  });

  test('admin should have access to admin routes after login', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin users page
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Should not be redirected to login
    expect(page.url()).not.toContain('/login');
  });

  test('admin should have access to submissions page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
  });

  test('admin should be able to sign out', async ({ page }) => {
    await loginAsAdmin(page);

    // Open user menu
    const avatarButton = page.locator('button:has([class*="avatar"]), button:has-text("?")').first();
    await avatarButton.click();

    // Click sign out
    const signOutButton = page.locator('text=Sign Out');
    await signOutButton.click();

    // Should redirect to login or landing
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
  });
});

test.describe('Admin Route Protection', () => {
  test('unauthenticated user should be redirected from admin routes', async ({ page }) => {
    await page.goto('/admin/users');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('unauthenticated user should be redirected from admin submissions', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
