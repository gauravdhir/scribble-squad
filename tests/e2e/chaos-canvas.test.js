import { test, expect } from '@playwright/test';

test.describe('Chaos Canvas', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Set identity to bypass modal
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'TestDoodler');
            localStorage.setItem('ss_user_avatar', '0');
        });
        await page.reload();
        // Transition to Host Lobby
        await page.click('.create-card');
        // Transition to Chaos Canvas (LIFT OFF)
        await page.click('.btn-liftoff');
    });

    test('should display the prompt correctly', async ({ page }) => {
        const prompt = page.locator('.prompt-text');
        await expect(prompt).toHaveText(/DRAGON/i);
    });

    test('should have a functional palette', async ({ page }) => {
        const palette = page.locator('.palette-wrapper');
        await expect(palette).toBeVisible();

        const colors = page.locator('.btn-color');
        await expect(colors).toHaveCount(10);

        // Select a color
        const blueBtn = colors.nth(6); // Light blue
        await blueBtn.click({ force: true });
        await expect(blueBtn).toHaveClass(/active/);
    });

    test('should allow drawing on the canvas', async ({ page }) => {
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();

        // Simulate drawing a stroke
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.up();

        // Check if drawing area is visible
        await expect(canvas).toBeVisible();
    });
});
