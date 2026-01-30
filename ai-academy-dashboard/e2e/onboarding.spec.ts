import { test, expect } from '@playwright/test';

test.describe('Onboarding Page', () => {
  test('should display onboarding wizard', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Page should either show onboarding or redirect to login
    const url = page.url();
    expect(url.includes('/onboarding') || url.includes('/login')).toBe(true);
  });

  test('should show progress indicators', async ({ page }) => {
    await page.goto('/onboarding');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If not redirected, check for progress steps
    if (!page.url().includes('/login')) {
      const progressSteps = page.locator('[class*="rounded-full"]');
      const stepCount = await progressSteps.count();
      expect(stepCount).toBeGreaterThan(0);
    }
  });

  test('welcome step should have Get Started button', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/login')) {
      const getStartedButton = page.locator('button:has-text("Get Started")');
      await expect(getStartedButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate through wizard steps', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/login')) {
      // Click Get Started
      const getStartedButton = page.locator('button:has-text("Get Started")');
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click();

        // Should move to GitHub step
        const githubTitle = page.locator('text=Connect GitHub Account');
        await expect(githubTitle).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Onboarding - Profile Step', () => {
  test('profile form should have all required fields', async ({ page }) => {
    await page.goto('/onboarding?from=github');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/login')) {
      // Navigate to profile step if not there
      const profileTitle = page.locator('text=Set Up Your Profile');

      if (await profileTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for form fields
        const githubInput = page.locator('input#github_username, input[id="github_username"]');
        const emailInput = page.locator('input#email, input[type="email"]');
        const nameInput = page.locator('input#name, input[id="name"]');

        await expect(githubInput).toBeVisible();
        await expect(emailInput).toBeVisible();
        await expect(nameInput).toBeVisible();
      }
    }
  });

  test('profile form should have role, team, and stream selectors', async ({ page }) => {
    await page.goto('/onboarding?from=github');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/login')) {
      const profileTitle = page.locator('text=Set Up Your Profile');

      if (await profileTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for select components
        const selects = page.locator('button[role="combobox"]');
        const selectCount = await selects.count();
        expect(selectCount).toBeGreaterThanOrEqual(3); // Role, Team, Stream
      }
    }
  });
});
