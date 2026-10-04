import { test, expect } from '@playwright/test';

test.describe('Maid Tracker Golden Path', () => {
  test('User can configure webhook, log attendance, and view report', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to render the Today tab initially
    await expect(page.locator('text=Breakfast')).toBeVisible();

    // 1. Intercept the network request to the webhook
    let webhookIntercepted = false;
    await page.route('**/macros/s/MOCK_WEBHOOK_ID/exec', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = JSON.parse(request.postData());
        
        expect(postData).toHaveProperty('date');
        expect(postData).toHaveProperty('day_status');
        expect(postData.breakfast_status).toBe('completed');
        expect(postData.lunch_status).toBe('completed');
        
        webhookIntercepted = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success' }) });
      } else {
        await route.continue();
      }
    });

    // 2. Navigate to Settings and input mock Webhook URL
    await page.locator('button.nav-item').filter({ hasText: 'Settings' }).click();
    await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible();

    await page.getByPlaceholder('https://script.google.com/macros/s/...').fill('https://script.google.com/macros/s/MOCK_WEBHOOK_ID/exec');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.locator('text=Settings Saved')).toBeVisible();

    // 3. Navigate to Today tab and log attendance
    await page.locator('button.nav-item').filter({ hasText: 'Today' }).click();
    
    // Select "Completed" for Breakfast and Lunch
    await page.locator('.card', { hasText: 'Breakfast' }).getByRole('button', { name: 'Completed' }).click();
    await page.locator('.card', { hasText: 'Lunch' }).getByRole('button', { name: 'Completed' }).click();

    // Verify the status badge
    await expect(page.locator('.badge')).toContainText(/Present|Half Day|Full Day/i);
    
    // Status is saved and synced automatically, ensure webhook was intercepted
    await expect(async () => {
      expect(webhookIntercepted).toBeTruthy();
    }).toPass();

    // 4. Navigate to Reports and verify scorecard
    await page.locator('button.nav-item').filter({ hasText: 'Reports' }).click();
    await expect(page.locator('h1', { hasText: 'Reports' })).toBeVisible();

    // Verify the "Total Attended" count is at least 1
    const totalAttendedText = await page.locator('text=Total Attended:').first().textContent();
    // Use regex to extract the first number from "Total Attended: 1 / 30"
    const countMatch = totalAttendedText.match(/\d+/);
    expect(parseInt(countMatch[0], 10)).toBeGreaterThanOrEqual(1);
  });
});
