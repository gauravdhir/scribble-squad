import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeState, THEMES } from '../../src/features/theme/theme-state.js';
import { ThemeRenderer } from '../../src/features/theme/theme-renderer.js';

describe('Theme System', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        // Reset state
        localStorage.clear();
        themeState.currentTheme = THEMES.SPACE;
        themeState.listeners.clear();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('ThemeState', () => {
        it('should default to SPACE theme', () => {
            expect(themeState.getTheme()).toBe(THEMES.SPACE);
        });

        it('should allow setting a valid theme', () => {
            themeState.setTheme(THEMES.FESTIVE);
            expect(themeState.getTheme()).toBe(THEMES.FESTIVE);
            expect(localStorage.getItem('scribble_theme')).toBe(THEMES.FESTIVE);
        });

        it('should ignore invalid themes', () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            themeState.setTheme('invalid-theme');
            expect(themeState.getTheme()).toBe(THEMES.SPACE);
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should notify subscribers', () => {
            const callback = vi.fn();
            themeState.subscribe(callback);
            expect(callback).toHaveBeenCalledWith(THEMES.SPACE); // Initial call

            themeState.setTheme(THEMES.FESTIVE);
            expect(callback).toHaveBeenCalledWith(THEMES.FESTIVE);
        });
    });

    describe('ThemeRenderer', () => {
        it('should initialize with correct structure', () => {
            new ThemeRenderer(container);
            expect(container.querySelector('.theme-projection-layer')).toBeTruthy();
            expect(container.querySelector('.theme-lights-container')).toBeTruthy();
        });

        it('should respond to theme changes', () => {
            new ThemeRenderer(container);

            themeState.setTheme(THEMES.FESTIVE);
            expect(container.classList.contains('theme-active-festive')).toBe(true);
            expect(container.querySelector('.projection-festive')).toBeTruthy();
            expect(container.querySelectorAll('.festive-light').length).toBeGreaterThan(0);

            themeState.setTheme(THEMES.SPACE);
            expect(container.classList.contains('theme-active-space')).toBe(true);
            expect(container.classList.contains('theme-active-festive')).toBe(false);
            expect(container.querySelectorAll('.festive-light').length).toBe(0);
        });
    });
});