import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'TestUser');
            localStorage.setItem('ss_user_avatar', '0');
        });
        await page.reload();
    });
    test('should display show correctly styled header and logo', async ({ page }) => {
        await page.goto('/');
        const title = page.locator('h1');
        await expect(title).toHaveText('SCRIBBLE SQUAD');

        // Check if fonts are loaded (Outfit)
        const fontFamily = await title.evaluate((el) => window.getComputedStyle(el).fontFamily);
        expect(fontFamily).toContain('Outfit');
    });

    test('should display the "Create Your Squad" card', async ({ page }) => {
        await page.goto('/');
        const createBtn = page.locator('.create-card');
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toContainText('CREATE');
        await expect(createBtn).toContainText('YOUR SQUAD');
    });

    test('should list active parties in the discovery lobby', async ({ page }) => {
        await page.goto('/');
        const partyCards = page.locator('.party-card');
        await expect(partyCards).toHaveCount(3);

        // Check specific party info
        const firstPartyName = partyCards.first().locator('.party-name');
        await expect(firstPartyName).toHaveText('Neon Ninjas');
    });

    test('should disable knock button for full rooms', async ({ page }) => {
        await page.goto('/');
        const fullRoomCard = page.locator('.party-card').filter({ hasText: 'Cosmic Crew' });
        const knockBtn = fullRoomCard.locator('.btn-circle-knock');
        await expect(knockBtn).toBeDisabled();
    });
});
