/**
 * Test Suite: MathUtils
 * Purpose: Logic for coordinate normalization and smoothing
 * Coverage: Normalization of absolute pixels to 1000x1000 grid
 */
import test from 'node:test';
import assert from 'node:assert';
import { normalizeCoordinate, denormalizeCoordinate } from '../../../src/lib/math-utils.js';

test('MathUtils.normalizeCoordinate should convert screen pixels to relative units', () => {
    const containerSize = 500;
    const pixelValue = 250;
    const expected = 500; // mid point of 1000

    const result = normalizeCoordinate(pixelValue, containerSize);
    assert.strictEqual(result, expected);
});

test('MathUtils.denormalizeCoordinate should convert relative units back to screen pixels', () => {
    const containerSize = 800;
    const relativeValue = 750;
    const expected = 600; // 75% of 800

    const result = denormalizeCoordinate(relativeValue, containerSize);
    assert.strictEqual(result, expected);
});

test('MathUtils.normalizeCoordinate should handle zero', () => {
    assert.strictEqual(normalizeCoordinate(0, 100), 0);
});

test('MathUtils.normalizeCoordinate should handle edge case (containerSize = 0)', () => {
    assert.strictEqual(normalizeCoordinate(50, 0), 0);
});
