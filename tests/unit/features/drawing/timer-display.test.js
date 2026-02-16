/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TimerDisplay } from '../../../../src/features/drawing/timer-display.js';

describe('TimerDisplay', () => {
    let timer;

    beforeEach(() => {
        timer = new TimerDisplay();
    });

    it('should initialize with default 60s countdown', () => {
        const element = timer.getElement();

        expect(element).toBeTruthy();
        expect(element.classList.contains('timer-box')).toBe(true);
        expect(timer.displayElement.textContent).toBe('60');
        expect(timer.lastTime).toBe(60);
    });

    it('should return the container element via getElement()', () => {
        const element = timer.getElement();
        expect(element.tagName).toBe('DIV');
        expect(element.querySelector('.timer-label')).toBeTruthy();
        expect(element.querySelector('.timer-countdown')).toBeTruthy();
    });

    it('should update time display when updateTime is called', () => {
        timer.updateTime(45);

        expect(timer.displayElement.textContent).toBe('45');
        expect(timer.lastTime).toBe(45);
    });

    it('should skip update if time is unchanged', () => {
        timer.updateTime(30);
        const firstUpdate = timer.displayElement.textContent;

        timer.updateTime(30); // Same value

        expect(timer.displayElement.textContent).toBe(firstUpdate);
        expect(timer.lastTime).toBe(30);
    });

    it('should apply warning styles when time <= 10 seconds', () => {
        timer.updateTime(10);

        expect(timer.displayElement.style.color).toBe('rgb(255, 51, 51)');
        expect(timer.displayElement.classList.contains('pulse')).toBe(true);
    });

    it('should maintain warning styles as time decreases below 10', () => {
        timer.updateTime(10);
        timer.updateTime(5);
        timer.updateTime(1);

        expect(timer.displayElement.style.color).toBe('rgb(255, 51, 51)');
        expect(timer.displayElement.classList.contains('pulse')).toBe(true);
        expect(timer.displayElement.textContent).toBe('1');
    });

    it('should reset warning styles when time increases above 10', () => {
        timer.updateTime(5); // Apply warning
        expect(timer.displayElement.classList.contains('pulse')).toBe(true);

        timer.updateTime(15); // Remove warning

        expect(timer.displayElement.style.color).toBe('');
        expect(timer.displayElement.classList.contains('pulse')).toBe(false);
    });

    it('should handle animateHurry() with scale animation', () => {
        timer.animateHurry();

        expect(timer.displayElement.style.transform).toBe('scale(1.2)');

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                expect(timer.displayElement.style.transform).toBe('scale(1)');
                resolve();
            }, 250);
        });
    });

    it('should not apply pulse class when time is exactly 11 seconds', () => {
        timer.updateTime(11);

        expect(timer.displayElement.classList.contains('pulse')).toBe(false);
        expect(timer.displayElement.style.color).toBe('');
    });

    it('should correctly toggle between normal and warning states', () => {
        // Normal -> Warning
        timer.updateTime(20);
        expect(timer.displayElement.classList.contains('pulse')).toBe(false);

        timer.updateTime(10);
        expect(timer.displayElement.classList.contains('pulse')).toBe(true);

        // Warning -> Normal
        timer.updateTime(15);
        expect(timer.displayElement.classList.contains('pulse')).toBe(false);

        // Back to warning
        timer.updateTime(3);
        expect(timer.displayElement.classList.contains('pulse')).toBe(true);
    });
});
