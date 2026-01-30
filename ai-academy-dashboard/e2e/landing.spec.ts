import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the AI logo', async ({ page }) => {
    const logo = page.locator('text=AI').first();
    await expect(logo).toBeVisible();
  });

  test('should display GitHub sign in button', async ({ page }) => {
    const githubButton = page.getByRole('link', { name: 'Sign in with GitHub' });
    await expect(githubButton).toBeVisible();
  });

  test('should display Admin button', async ({ page }) => {
    const adminButton = page.getByRole('link', { name: 'Admin' });
    await expect(adminButton).toBeVisible();
  });

  test('should not show navigation for unauthenticated users', async ({ page }) => {
    // Navigation should be hidden on landing page for unauthenticated users
    const nav = page.locator('nav');
    const isNavVisible = await nav.isVisible().catch(() => false);

    // If nav exists, check it doesn't have main navigation items
    if (isNavVisible) {
      const dashboardLink = page.locator('nav a:has-text("Dashboard")');
      await expect(dashboardLink).not.toBeVisible();
    }
  });

  test('should not show mobile bottom navigation for unauthenticated users', async ({ page }) => {
    // Check that mobile nav is hidden
    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav).not.toBeVisible();
  });

  test('GitHub button should link to login page', async ({ page }) => {
    const githubButton = page.locator('a:has-text("Sign in with GitHub")');
    await githubButton.click();
    await expect(page).toHaveURL('/login');
  });

  test('Admin button should link to login page with admin param', async ({ page }) => {
    const adminButton = page.locator('a:has-text("Admin")');
    await adminButton.click();
    await expect(page).toHaveURL('/login?admin=true');
  });
});

test.describe('Landing Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('text=AI').first();
    await expect(logo).toBeVisible();

    const githubButton = page.getByRole('link', { name: 'Sign in with GitHub' });
    await expect(githubButton).toBeVisible();
  });
});
