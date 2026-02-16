import { describe, it, expect } from 'vitest';
import { generateSillyName } from '../../../src/features/identity/randomizer.js';

describe('Identity Randomizer', () => {
    it('should return a string with two words', () => {
        const name = generateSillyName();
        expect(typeof name).toBe('string');
        const parts = name.split(' ');
        expect(parts.length).toBe(2);
    });

    it('should produce unique-ish names (not identical on consecutive calls)', () => {
        const name1 = generateSillyName();
        const name2 = generateSillyName();
        expect(name1).not.toBe(name2);
    });

    it('should only contain alphanumeric characters and spaces', () => {
        const name = generateSillyName();
        expect(name).toMatch(/^[a-zA-Z\s]+$/);
    });
});
