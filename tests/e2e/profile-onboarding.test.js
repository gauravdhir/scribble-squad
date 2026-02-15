import { test, expect } from '@playwright/test';

test.describe('Profile Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage to ensure modal pops up
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should show the profile setup modal on first visit', async ({ page }) => {
        const modal = page.locator('.profile-modal');
        await expect(modal).toBeVisible();
        await expect(page.locator('h2')).toContainText('Scribble Squad');
    });

    test('should allow randomizing the name', async ({ page }) => {
        const nameInput = page.locator('.profile-input');
        const shuffleBtn = page.locator('.btn-shuffle');

        const initialName = await nameInput.inputValue();
        await shuffleBtn.click();
        let newName = await nameInput.inputValue();

        // Coincidental identical name check - retry once if needed
        if (newName === initialName) {
            await shuffleBtn.click();
            newName = await nameInput.inputValue();
        }

        expect(newName).not.toBe(initialName);
        expect(newName.length).toBeGreaterThan(0);
    });

    test('should allow selecting an avatar', async ({ page }) => {
        const firstAvatar = page.locator('.avatar-option').first();
        const secondAvatar = page.locator('.avatar-option').nth(1);

        await secondAvatar.click();
        await expect(secondAvatar).toHaveClass(/selected/);
        await expect(firstAvatar).not.toHaveClass(/selected/);
    });

    test('should save identity and close modal on NEXT', async ({ page }) => {
        const nameInput = page.locator('.profile-input');
        const nextBtn = page.locator('.btn-next');

        await nameInput.fill('TestUser');
        await nextBtn.click({ force: true });

        // Modal should vanish
        await expect(page.locator('.profile-modal')).not.toBeVisible();

        // Name should persist in localStorage (check via reload)
        await page.reload();
        await expect(page.locator('.profile-modal')).not.toBeVisible();
    });

    test('should disable NEXT for empty names', async ({ page }) => {
        const nameInput = page.locator('.profile-input');
        await nameInput.clear();
        const nextBtn = page.locator('.btn-next');
        await expect(nextBtn).toBeDisabled();
    });
});
