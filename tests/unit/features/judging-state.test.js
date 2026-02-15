/**
 * Test Suite: Judging State
 * Purpose: Verification of medal awarding and reaction tracking logic.
 */
import test from 'node:test';
import assert from 'node:assert';
import { JudgingState } from '../../../src/features/judging/judging-state.js';

test('JudgingState should initialize with zero medals and reactions', () => {
    const state = new JudgingState();
    assert.deepStrictEqual(state.medals, { gold: 0, silver: 0, bronze: 0 });
    assert.strictEqual(state.reactions.length, 0);
});

test('awardMedal should increment the correct medal type', () => {
    const state = new JudgingState();
    state.awardMedal('gold');
    assert.strictEqual(state.medals.gold, 1);
    assert.strictEqual(state.medals.silver, 0);
});

test('addReaction should add a new reaction with coordinates', () => {
    const state = new JudgingState();
    state.addReaction('❤️', 500, 500);
    assert.strictEqual(state.reactions.length, 1);
    assert.strictEqual(state.reactions[0].type, '❤️');
    assert.strictEqual(state.reactions[0].x, 500);
});

test('clear should reset state', () => {
    const state = new JudgingState();
    state.awardMedal('bronze');
    state.addReaction('⭐', 10, 10);
    state.clear();
    assert.strictEqual(state.medals.bronze, 0);
    assert.strictEqual(state.reactions.length, 0);
});
