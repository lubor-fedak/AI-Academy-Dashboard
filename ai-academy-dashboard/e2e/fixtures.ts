import { test as base, expect, Page } from '@playwright/test';

// Test user credentials
export const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'REDACTED_PASSWORD',
};

// Helper to login as admin
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Click admin tab
  await page.click('button:has-text("Admin")');
  await page.waitForTimeout(500);

  // Fill credentials
  await page.fill('input[type="email"]', TEST_ADMIN.email);
  await page.fill('input[type="password"]', TEST_ADMIN.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL(/\/(admin|my-dashboard|leaderboard|progress|teams|analytics|peer-reviews|\/)/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

// Helper to check if element is visible
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

// Helper to wait for navigation
export async function waitForNavigation(page: Page, urlPattern: RegExp) {
  await page.waitForURL(urlPattern, { timeout: 10000 });
}

// Custom test fixture with admin login
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    await use(page);
    await context.close();
  },
});

export { expect };
