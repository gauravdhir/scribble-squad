import { test, expect } from '@playwright/test';

test.describe('Judging Room - Basic Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('ss_user_name', 'TestJudge');
            localStorage.setItem('ss_user_avatar', '2');
        });
        await page.reload();
    });

    // Skip the full navigation for now - just test that the code doesn't have syntax errors
    test('should have judging room CSS loaded', async ({ page }) => {
        // Check that the judging room styles are present in the stylesheet
        const hasJudgingStyles = await page.evaluate(() => {
            const sheets = Array.from(document.styleSheets);
            return sheets.some(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || []);
                    return rules.some(rule => rule.selectorText && rule.selectorText.includes('judging-wrapper'));
                } catch (e) {
                    return false;
                }
            });
        });
        expect(hasJudgingStyles).toBe(true);
    });

    test('should have judging module available', async ({ page }) => {
        // Verify the module can be imported without errors
        const moduleExists = await page.evaluate(async () => {
            try {
                const module = await import('./src/features/judging/judging-state.js');
                return module.JudgingState !== undefined;
            } catch (e) {
                return false;
            }
        });
        expect(moduleExists).toBe(true);
    });
});
