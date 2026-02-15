/**
 * Test Suite: Identity Randomizer
 * Purpose: Verification of the silly name generation logic
 */
import test from 'node:test';
import assert from 'node:assert';
import { generateSillyName } from '../../../src/features/identity/randomizer.js';

test('generateSillyName should return a string with two words', () => {
    const name = generateSillyName();
    assert.strictEqual(typeof name, 'string');
    const parts = name.split(' ');
    assert.strictEqual(parts.length, 2, `Expected 2 words, got: ${name}`);
});

test('generateSillyName should produce unique names on consecutive calls', () => {
    const name1 = generateSillyName();
    const name2 = generateSillyName();
    assert.notStrictEqual(name1, name2);
});

test('generateSillyName should only contain alphanumeric characters and spaces', () => {
    const name = generateSillyName();
    assert.match(name, /^[a-zA-Z\s]+$/);
});
