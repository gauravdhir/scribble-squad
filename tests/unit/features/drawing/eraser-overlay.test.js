/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EraserOverlay } from '../../../../src/features/drawing/eraser-overlay.js';

describe('EraserOverlay', () => {
    let container;
    let overlay;

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '1000px';
        container.style.height = '1000px';

        // Mock getBoundingClientRect for consistent testing
        container.getBoundingClientRect = vi.fn(() => ({
            width: 1000,
            height: 1000,
            left: 100,
            top: 50
        }));

        document.body.appendChild(container);
        overlay = new EraserOverlay(container);
    });

    it('should initialize and append overlay element to container', () => {
        expect(container.children.length).toBe(1);
        expect(overlay.element.classList.contains('eraser-shadow')).toBe(true);
    });

    it('should be hidden by default', () => {
        expect(overlay.isVisible).toBe(false);
        expect(overlay.element.style.display).toBe('none');
    });

    it('should have correct initial styling', () => {
        expect(overlay.element.style.position).toBe('absolute');
        expect(overlay.element.style.pointerEvents).toBe('none');
        expect(overlay.element.style.borderRadius).toBe('50%');
        expect(overlay.element.style.border).toBeTruthy();
        expect(overlay.element.style.backgroundColor).toBeTruthy();
        expect(overlay.element.style.transform).toContain('translate(-50%, -50%)');
        expect(overlay.element.style.zIndex).toBe('1000');
    });

    it('should initialize with default size of 30', () => {
        expect(overlay.currentSize).toBe(30);
    });

    it('should show overlay and make it visible', () => {
        overlay.show();

        expect(overlay.isVisible).toBe(true);
        expect(overlay.element.style.display).toBe('block');
    });

    it('should hide overlay', () => {
        overlay.show();
        overlay.hide();

        expect(overlay.isVisible).toBe(false);
        expect(overlay.element.style.display).toBe('none');
    });

    it('should update size and calculate display dimensions correctly', () => {
        overlay.show();
        overlay.setSize(100);

        // Formula: (size / 2000) * containerWidth
        // (100 / 2000) * 1000 = 50px
        expect(overlay.currentSize).toBe(100);
        expect(overlay.element.style.width).toBe('50px');
        expect(overlay.element.style.height).toBe('50px');
    });

    it('should calculate different sizes correctly', () => {
        overlay.show();

        // Test size 30 (default)
        overlay.setSize(30);
        // (30 / 2000) * 1000 = 15px
        expect(overlay.element.style.width).toBe('15px');
        expect(overlay.element.style.height).toBe('15px');

        // Test size 500
        overlay.setSize(500);
        // (500 / 2000) * 1000 = 250px
        expect(overlay.element.style.width).toBe('250px');
        expect(overlay.element.style.height).toBe('250px');

        // Test size 1000
        overlay.setSize(1000);
        // (1000 / 2000) * 1000 = 500px
        expect(overlay.element.style.width).toBe('500px');
        expect(overlay.element.style.height).toBe('500px');
    });

    it('should not update position when hidden', () => {
        overlay.hide();
        overlay.updatePosition(200, 300);

        // Position shouldn't be updated
        expect(overlay.element.style.left).not.toBe('200px');
    });

    it('should update position correctly when visible', () => {
        overlay.show();

        // Container rect: left=100, top=50
        // Mouse position: x=250, y=200
        // Expected relative: x=150, y=150
        overlay.updatePosition(250, 200);

        expect(overlay.element.style.left).toBe('150px');
        expect(overlay.element.style.top).toBe('150px');
    });

    it('should update position relative to container bounds', () => {
        overlay.show();

        // Test with different positions
        overlay.updatePosition(100, 50); // At container origin
        expect(overlay.element.style.left).toBe('0px');
        expect(overlay.element.style.top).toBe('0px');

        overlay.updatePosition(150, 100);
        expect(overlay.element.style.left).toBe('50px');
        expect(overlay.element.style.top).toBe('50px');
    });

    it('should update dimensions on position change', () => {
        overlay.show();
        overlay.setSize(200);

        // Verify dimensions are set
        expect(overlay.element.style.width).toBe('100px');

        // Update position should also update dimensions
        overlay.updatePosition(200, 200);

        // Dimensions should still be correct
        expect(overlay.element.style.width).toBe('100px');
        expect(overlay.element.style.height).toBe('100px');
    });

    it('should handle rapid show/hide cycles', () => {
        overlay.show();
        expect(overlay.isVisible).toBe(true);

        overlay.hide();
        expect(overlay.isVisible).toBe(false);

        overlay.show();
        expect(overlay.isVisible).toBe(true);
        expect(overlay.element.style.display).toBe('block');
    });

    it('should handle zero-width container gracefully', () => {
        container.getBoundingClientRect = vi.fn(() => ({
            width: 0,
            height: 0,
            left: 0,
            top: 0
        }));

        overlay.show();
        overlay.setSize(100);

        // Should not crash, dimensions may not be set
        expect(overlay.currentSize).toBe(100);
    });

    it('should maintain size when toggling visibility', () => {
        overlay.setSize(200);
        overlay.show();

        expect(overlay.element.style.width).toBe('100px');

        overlay.hide();
        overlay.show();

        // Size should persist
        expect(overlay.element.style.width).toBe('100px');
    });
});
