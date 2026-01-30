import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures';

test.describe('Performance', () => {
  test('landing page should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('login page should load within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('dashboard should load within 10 seconds after login', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();
    await page.goto('/my-dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('leaderboard should load within 10 seconds', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('no console errors on main pages', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., from browser extensions)
    const realErrors = consoleErrors.filter(
      (err) =>
        !err.includes('content.js') &&
        !err.includes('extension') &&
        !err.includes('favicon')
    );

    expect(realErrors.length).toBe(0);
  });

  test('no JavaScript errors on login page', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    expect(pageErrors.length).toBe(0);
  });

  test('images should not be too large', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');

      if (src && !src.startsWith('data:')) {
        // Check image dimensions
        const box = await img.boundingBox();
        if (box) {
          // Images shouldn't be larger than 2000px
          expect(box.width).toBeLessThan(2000);
          expect(box.height).toBeLessThan(2000);
        }
      }
    }
  });
});

test.describe('Performance - Network', () => {
  test('should not have failed network requests on main pages', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400 && response.status() < 600) {
        // Ignore expected errors
        if (!response.url().includes('favicon')) {
          failedRequests.push(`${response.status()} - ${response.url()}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter known acceptable failures
    const realFailures = failedRequests.filter(
      (req) => !req.includes('404') || !req.includes('icon')
    );

    expect(realFailures.length).toBe(0);
  });
});
