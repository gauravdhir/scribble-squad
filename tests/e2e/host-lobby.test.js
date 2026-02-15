import { test, expect } from '@playwright/test';

test.describe('Host Lobby', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'HostUser');
            localStorage.setItem('ss_user_avatar', '1');
        });
        await page.reload();
        // Transition to Host Lobby
        await page.click('.create-card');
    });

    test('should display the correct room code "PLAY"', async ({ page }) => {
        const roomCode = page.locator('.room-code-text');
        await expect(roomCode).toHaveText('PLAY');
    });

    test('should show initial squad members', async ({ page }) => {
        const members = page.locator('.member-item');
        await expect(members).toHaveCount(3);
        await expect(members.nth(0)).toContainText('Artie');
        await expect(members.nth(1)).toContainText('Sketch');
        await expect(members.nth(2)).toContainText('Doodle');
    });

    test('should show pending requests', async ({ page }) => {
        const requests = page.locator('.request-item');
        await expect(requests).toHaveCount(2);
        await expect(requests.first()).toContainText('PixelPaul');
    });

    test('should approve a pending request', async ({ page }) => {
        const initialSquadCount = await page.locator('.member-item').count();
        const firstRequestName = await page.locator('.request-item .request-name').first().textContent();

        // Click approve on the first request
        await page.locator('.btn-approve').first().click({ force: true });

        // Squad should increase
        await expect(page.locator('.member-item')).toHaveCount(initialSquadCount + 1);
        // New member should be in the squad
        await expect(page.locator('.squad-grid')).toContainText(firstRequestName);
        // Request should be removed
        await expect(page.locator('.request-item')).toHaveCount(1);
    });

    test('should deny a pending request', async ({ page }) => {
        const initialSquadCount = await page.locator('.member-item').count();

        // Click deny on the first request
        await page.locator('.btn-deny').first().click({ force: true });

        // Squad should stay the same
        await expect(page.locator('.member-item')).toHaveCount(initialSquadCount);
        // Request should be removed
        await expect(page.locator('.request-item')).toHaveCount(1);
    });
});
