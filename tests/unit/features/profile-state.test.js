/**
 * Test Suite: ProfileState
 * Purpose: Identity management and persistence logic
 */
import test from 'node:test';
import assert from 'node:assert';
import { ProfileState } from '../../../src/features/identity/profile-state.js';

// Mocking localStorage for Node environment
const mockStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = val; }
};

test('ProfileState should initialize with empty values', () => {
    const profile = new ProfileState(mockStorage);
    assert.strictEqual(profile.displayName, '');
    assert.strictEqual(profile.avatarId, 0);
});

test('ProfileState.save should update state and storage', () => {
    const profile = new ProfileState(mockStorage);
    profile.save('Space Cadet', 3);

    assert.strictEqual(profile.displayName, 'Space Cadet');
    assert.strictEqual(profile.avatarId, 3);
    assert.strictEqual(mockStorage.getItem('ss_user_name'), 'Space Cadet');
});

test('ProfileState.load should hydrate from storage', () => {
    mockStorage.setItem('ss_user_name', 'Laser Legend');
    mockStorage.setItem('ss_user_avatar', '2');

    const profile = new ProfileState(mockStorage);
    profile.load();

    assert.strictEqual(profile.displayName, 'Laser Legend');
    assert.strictEqual(profile.avatarId, 2);
});

test('ProfileState.validateName should reject names longer than 12 chars', () => {
    const profile = new ProfileState(mockStorage);
    assert.strictEqual(profile.validateName('VeryLongNameIndeed'), false);
    assert.strictEqual(profile.validateName('ShortName'), true);
});
