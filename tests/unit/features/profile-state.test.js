/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileState } from '../../../src/features/identity/profile-state.js';

describe('ProfileState', () => {
    let profileState;
    let mockStorage;

    beforeEach(() => {
        mockStorage = {
            data: {},
            getItem: vi.fn((key) => mockStorage.data[key] || null),
            setItem: vi.fn((key, value) => { mockStorage.data[key] = value; }),
            removeItem: vi.fn((key) => { delete mockStorage.data[key]; })
        };

        profileState = new ProfileState(mockStorage);
    });

    it('should initialize with empty name and default avatar', () => {
        expect(profileState.displayName).toBe('');
        expect(profileState.avatarId).toBe(0);
    });

    it('should use provided storage', () => {
        expect(profileState.storage).toBe(mockStorage);
    });

    it('should validate names correctly', () => {
        expect(profileState.validateName('Alice')).toBe(true);
        expect(profileState.validateName('Player123')).toBe(true);
        expect(profileState.validateName('A')).toBe(true);
        expect(profileState.validateName('MaxLenName12')).toBe(true);
    });

    it('should reject empty names', () => {
        expect(profileState.validateName('')).toBe(false);
    });

    it('should reject names longer than 12 characters', () => {
        expect(profileState.validateName('ThisIsWayTooLong')).toBe(false);
        expect(profileState.validateName('Exactly13Char')).toBe(false);
    });

    it('should accept exactly 12 character names', () => {
        expect(profileState.validateName('ExactlyTwelv')).toBe(true);
    });

    it('should save name and avatar to memory and storage', () => {
        profileState.save('TestUser', 5);

        expect(profileState.displayName).toBe('TestUser');
        expect(profileState.avatarId).toBe(5);
        expect(mockStorage.setItem).toHaveBeenCalledWith('ss_user_name', 'TestUser');
        expect(mockStorage.setItem).toHaveBeenCalledWith('ss_user_avatar', '5');
    });

    it('should save avatar ID as string', () => {
        profileState.save('User', 42);

        expect(mockStorage.data['ss_user_avatar']).toBe('42');
    });

    it('should load name and avatar from storage', () => {
        mockStorage.data['ss_user_name'] = 'StoredUser';
        mockStorage.data['ss_user_avatar'] = '7';

        profileState.load();

        expect(profileState.displayName).toBe('StoredUser');
        expect(profileState.avatarId).toBe(7);
    });

    it('should use defaults when storage is empty', () => {
        profileState.load();

        expect(profileState.displayName).toBe('');
        expect(profileState.avatarId).toBe(0);
    });

    it('should parse avatar ID as integer', () => {
        mockStorage.data['ss_user_name'] = 'User';
        mockStorage.data['ss_user_avatar'] = '15';

        profileState.load();

        expect(profileState.avatarId).toBe(15);
        expect(typeof profileState.avatarId).toBe('number');
    });

    it('should handle invalid avatar ID gracefully', () => {
        mockStorage.data['ss_user_avatar'] = 'invalid';

        profileState.load();

        expect(profileState.avatarId).toBeNaN();
    });

    it('should generate correct avatar URL', () => {
        profileState.avatarId = 0;
        expect(profileState.getAvatarUrl()).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=avatar1');

        profileState.avatarId = 5;
        expect(profileState.getAvatarUrl()).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=avatar6');

        profileState.avatarId = 99;
        expect(profileState.getAvatarUrl()).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=avatar100');
    });

    it('should clear memory and storage', () => {
        profileState.save('TestUser', 10);
        profileState.clear();

        expect(profileState.displayName).toBe('');
        expect(profileState.avatarId).toBe(0);
        expect(mockStorage.removeItem).toHaveBeenCalledWith('ss_user_name');
        expect(mockStorage.removeItem).toHaveBeenCalledWith('ss_user_avatar');
    });

    it('should remove data from storage on clear', () => {
        mockStorage.data['ss_user_name'] = 'User';
        mockStorage.data['ss_user_avatar'] = '5';

        profileState.clear();

        expect(mockStorage.data['ss_user_name']).toBeUndefined();
        expect(mockStorage.data['ss_user_avatar']).toBeUndefined();
    });

    it('should handle save-load-clear cycle', () => {
        profileState.save('Cycle', 3);
        expect(profileState.displayName).toBe('Cycle');

        profileState.clear();
        expect(profileState.displayName).toBe('');

        profileState.load();
        expect(profileState.displayName).toBe('');
    });

    it('should allow re-saving after clear', () => {
        profileState.save('First', 1);
        profileState.clear();
        profileState.save('Second', 2);

        expect(profileState.displayName).toBe('Second');
        expect(profileState.avatarId).toBe(2);
    });

    it('should handle special characters in names', () => {
        const specialName = 'User_123!';
        profileState.save(specialName, 0);

        expect(profileState.displayName).toBe(specialName);
        expect(mockStorage.data['ss_user_name']).toBe(specialName);
    });
});
