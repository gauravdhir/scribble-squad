import { test, expect } from '@playwright/test';

test.describe('Header Greeting', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Setup profile in localStorage to bypass modal
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'ArtisticAlien');
            localStorage.setItem('ss_user_avatar', '3');
        });
        await page.reload();
    });

    test('should display "Hi ArtisticAlien" in the header', async ({ page }) => {
        const greeting = page.locator('.user-greeting');
        await expect(greeting).toBeVisible();
        await expect(greeting).toContainText('Hi, ArtisticAlien');
    });
});
