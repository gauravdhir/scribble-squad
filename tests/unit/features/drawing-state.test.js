/**
 * Test Suite: DrawingState
 * Purpose: Verification of drawing data management.
 */
import test from 'node:test';
import assert from 'node:assert';
import { DrawingState } from '../../../src/features/drawing/drawing-state.js';

test('DrawingState should initialize with an empty list of strokes', () => {
    const state = new DrawingState();
    assert.strictEqual(state.strokes.length, 0);
});

test('addStroke should add a new stroke to the state', () => {
    const state = new DrawingState();
    const stroke = { color: '#ff0000', points: [{ x: 100, y: 100 }] };
    state.addStroke(stroke);

    assert.strictEqual(state.strokes.length, 1);
    assert.deepStrictEqual(state.strokes[0], stroke);
});

test('clear should empty the strokes list', () => {
    const state = new DrawingState();
    state.addStroke({ color: '#000', points: [] });
    state.clear();
    assert.strictEqual(state.strokes.length, 0);
});
