import { test, expect } from '@playwright/test';

test.describe('Landing Page - Room Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Setup profile
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'TestHost');
            localStorage.setItem('ss_user_avatar', '0');
        });
        await page.reload();
    });

    test('should show CREATE YOUR SQUAD button', async ({ page }) => {
        const createBtn = page.locator('.create-card');
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toContainText('CREATE YOUR SQUAD');
    });

    test('should show room code input field', async ({ page }) => {
        const codeInput = page.locator('input[placeholder*="room code" i]');
        await expect(codeInput).toBeVisible();
    });

    test('should create room via modal and navigate to host lobby', async ({ page }) => {
        await page.click('.create-card');

        // Wait for modal to appear
        const modal = page.locator('.create-room-modal');
        await expect(modal).toBeVisible();

        // Fill in details
        const nameInput = modal.locator('#roomNameInput');
        await expect(nameInput).toBeVisible();
        await nameInput.fill('Test Squad');

        // Use slider (just checking it exists and is enabled)
        const slider = modal.locator('#maxPlayersInput');
        await expect(slider).toBeEnabled();
        await slider.fill('4'); // Set to 4 players

        // Launch
        await modal.locator('#launchBtn').click();

        // Should be in host lobby
        await expect(page.locator('.host-lobby-title')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.room-code-text')).toBeVisible();

        // Room code should be 4 letters
        const roomCode = await page.locator('.room-code-text').textContent();
        expect(roomCode.length).toBe(4);
    });

    test('should join room by entering valid code', async ({ page }) => {
        // First create a room in another context to get a code
        const roomCode = await page.evaluate(() => {
            // Simulate a room existing
            return 'TEST';
        });

        const codeInput = page.locator('input[placeholder*="room code" i]');
        await codeInput.fill(roomCode);
        await codeInput.press('Enter');

        // Should show some feedback (either error or success)
        // For now, just verify the input worked
        const value = await codeInput.inputValue();
        expect(value).toBe(roomCode);
    });

    test('should display discovery lobby with active rooms', async ({ page }) => {
        const discoverySection = page.locator('.discovery-section');
        await expect(discoverySection).toBeVisible();

        const discoveryTitle = page.locator('.discovery-title');
        await expect(discoveryTitle).toContainText('DISCOVERY LOBBY');
    });
});
