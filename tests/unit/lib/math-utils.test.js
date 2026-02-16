import { describe, it, expect } from 'vitest';
import { normalizeCoordinate, denormalizeCoordinate } from '../../../src/lib/math-utils.js';

describe('MathUtils', () => {
    it('should convert screen pixels to relative units', () => {
        const containerSize = 500;
        const pixelValue = 250;
        const expected = 500; // mid point of 1000

        const result = normalizeCoordinate(pixelValue, containerSize);
        expect(result).toBe(expected);
    });

    it('should convert relative units back to screen pixels', () => {
        const containerSize = 800;
        const relativeValue = 750;
        const expected = 600; // 75% of 800

        const result = denormalizeCoordinate(relativeValue, containerSize);
        expect(result).toBe(expected);
    });

    it('should handle zero', () => {
        expect(normalizeCoordinate(0, 100)).toBe(0);
    });

    it('should handle edge case (containerSize = 0)', () => {
        expect(normalizeCoordinate(50, 0)).toBe(0);
    });
});
