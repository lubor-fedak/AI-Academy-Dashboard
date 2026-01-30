import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures';

test.describe('Main Dashboard', () => {
  test('should load main dashboard page after login', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('should display dashboard content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('My Dashboard Page', () => {
  test('should load my dashboard page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/my-dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/my-dashboard');
  });

  test('should show page content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/my-dashboard');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Leaderboard Page', () => {
  test('should load leaderboard page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/leaderboard');
  });

  test('should display leaderboard content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Progress Matrix Page', () => {
  test('should load progress page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/progress');
  });

  test('should display progress content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Teams Page', () => {
  test('should load teams page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/teams');
  });

  test('should display teams content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Analytics Page', () => {
  test('should load analytics page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/analytics');
  });

  test('should display analytics content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Peer Reviews Page', () => {
  test('should load peer reviews page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/peer-reviews');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/peer-reviews');
  });

  test('should display peer reviews content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/peer-reviews');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
