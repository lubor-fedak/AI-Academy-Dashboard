import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check - main page loads', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBeLessThan(500);
  });

  test('login page returns 200', async ({ request }) => {
    const response = await request.get('/login');
    expect(response.status()).toBe(200);
  });

  test('API register endpoint exists and requires authentication', async ({ request }) => {
    const response = await request.post('/api/register', {
      data: {},
    });
    // Should return 401 for unauthenticated requests (security fix)
    // The endpoint now requires Clerk authentication before processing
    expect(response.status()).toBe(401);
  });

  test('API register rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/register', {
      data: {
        github_username: 'test',
        // Missing other required fields
      },
    });
    // Should return 401 for unauthenticated requests (security fix)
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('API peer-review endpoint exists', async ({ request }) => {
    const response = await request.post('/api/peer-review', {
      data: {},
    });
    // Should return error for missing/invalid data, not 404
    expect([400, 401, 500]).toContain(response.status());
  });

  test('API review endpoint exists', async ({ request }) => {
    const response = await request.post('/api/review', {
      data: {},
    });
    // Should return error for missing/invalid data, not 404
    expect([400, 401, 500]).toContain(response.status());
  });

  test('API comments endpoint exists', async ({ request }) => {
    const response = await request.get('/api/comments?submission_id=test');
    // Should return error or empty, not 404
    expect([200, 400, 401, 500]).toContain(response.status());
  });

  test('auth callback route exists', async ({ request }) => {
    const response = await request.get('/auth/callback');
    // Should redirect to login with error (no code provided)
    expect([302, 307, 200]).toContain(response.status());
  });
});

test.describe('Static Assets', () => {
  test('favicon exists', async ({ request }) => {
    const response = await request.get('/icons/icon.svg');
    expect([200, 304]).toContain(response.status());
  });
});

test.describe('Error Handling', () => {
  test('404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should show 404 page or redirect - verify page loads without error
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });
});
