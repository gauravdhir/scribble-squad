/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '../../../src/features/lobby/room-manager.js';

// Mock RoomAPI
vi.mock('../../../src/features/lobby/room-api.js', () => ({
    RoomAPI: {
        createRoom: vi.fn((data) => Promise.resolve(data)),
        getRoom: vi.fn((code) => Promise.resolve({
            code,
            participants: [],
            pendingQueue: [],
            maxPlayers: 8
        })),
        updateRoom: vi.fn(() => Promise.resolve()),
        deleteRoom: vi.fn(() => Promise.resolve(true)),
        fetchRooms: vi.fn(() => Promise.resolve([])),
        leaveRoom: vi.fn(() => Promise.resolve()),
        startRoom: vi.fn(() => Promise.resolve())
    }
}));

const { RoomAPI } = await import('../../../src/features/lobby/room-api.js');

describe('RoomManager', () => {
    let roomManager;

    beforeEach(() => {
        vi.clearAllMocks();
        roomManager = new RoomManager();
    });

    it('should create room with string settings', async () => {
        const room = await roomManager.createRoom('host123', 'My Room');

        expect(room.hostId).toBe('host123');
        expect(room.name).toBe('My Room');
        expect(room.code).toMatch(/^[A-Z]{4}$/);
        expect(RoomAPI.createRoom).toHaveBeenCalled();
    });

    it('should create room with object settings', async () => {
        const settings = {
            name: 'Epic Squad',
            maxPlayers: 6,
            isPrivate: true,
            description: 'For pros only'
        };

        const room = await roomManager.createRoom('host456', settings);

        expect(room.name).toBe('Epic Squad');
        expect(room.maxPlayers).toBe(6);
        expect(room.isPrivate).toBe(true);
        expect(room.description).toBe('For pros only');
    });

    it('should create room with default values', async () => {
        const room = await roomManager.createRoom('host789');

        expect(room.name).toBe('Unnamed Room');
        expect(room.maxPlayers).toBe(8);
        expect(room.isPrivate).toBe(false);
        expect(room.status).toBe('LOBBY');
    });

    it('should generate unique 4-letter room codes', async () => {
        const codes = new Set();

        for (let i = 0; i < 10; i++) {
            const room = await roomManager.createRoom(`host${i}`);
            codes.add(room.code);
            expect(room.code).toMatch(/^[A-Z]{4}$/);
        }

        // Codes should be unique (probabilistically)
        expect(codes.size).toBeGreaterThan(1);
    });

    it('should include host in participants', async () => {
        const room = await roomManager.createRoom('host123', 'Test');

        expect(room.participants).toHaveLength(1);
        expect(room.participants[0]).toEqual({
            userId: 'host123',
            role: 'host'
        });
    });

    it('should knock on room successfully', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'ABCD',
            participants: [],
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.knockOnRoom('ABCD', 'user1');

        expect(result.success).toBe(true);
        expect(RoomAPI.updateRoom).toHaveBeenCalled();
    });

    it('should reject knock when room is full', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'FULL',
            participants: Array(8).fill({ userId: 'user' }),
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.knockOnRoom('FULL', 'user9');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ROOM_FULL');
    });

    it('should reject knock when user already in queue', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'TEST',
            participants: [],
            pendingQueue: [{ userId: 'user1' }],
            maxPlayers: 8
        });

        const result = await roomManager.knockOnRoom('TEST', 'user1');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ALREADY_IN_ROOM');
    });

    it('should reject knock when user already in room', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'TEST',
            participants: [{ userId: 'user1' }],
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.knockOnRoom('TEST', 'user1');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ALREADY_IN_ROOM');
    });

    it('should handle knock on non-existent room', async () => {
        RoomAPI.getRoom.mockRejectedValue(new Error('Not found'));

        const result = await roomManager.knockOnRoom('FAKE', 'user1');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ROOM_NOT_FOUND');
    });

    it('should approve player successfully', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'APPR',
            participants: [{ userId: 'host' }],
            pendingQueue: [{ userId: 'user1' }],
            maxPlayers: 8
        });

        const result = await roomManager.approvePlayer('APPR', 'user1');

        expect(result.success).toBe(true);
        expect(result.action).toBe('APPROVED');
        expect(RoomAPI.updateRoom).toHaveBeenCalled();
    });

    it('should reject approval when user not in queue', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'TEST',
            participants: [],
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.approvePlayer('TEST', 'unknown');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('USER_NOT_IN_QUEUE');
    });

    it('should reject approval when room is full', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'FULL',
            participants: Array(8).fill({ userId: 'user' }),
            pendingQueue: [{ userId: 'user9' }],
            maxPlayers: 8
        });

        const result = await roomManager.approvePlayer('FULL', 'user9');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ROOM_FULL');
    });

    it('should reject player successfully', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'REJT',
            participants: [],
            pendingQueue: [{ userId: 'user1' }],
            maxPlayers: 8
        });

        const result = await roomManager.rejectPlayer('REJT', 'user1');

        expect(result.success).toBe(true);
        expect(result.action).toBe('REJECTED');
    });

    it('should handle rejection of non-queued user', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'TEST',
            participants: [],
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.rejectPlayer('TEST', 'unknown');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('USER_NOT_IN_QUEUE');
    });

    it('should delegate joinRoomByCode to knockOnRoom', async () => {
        RoomAPI.getRoom.mockResolvedValue({
            code: 'JOIN',
            participants: [],
            pendingQueue: [],
            maxPlayers: 8
        });

        const result = await roomManager.joinRoomByCode('JOIN', 'user1');

        expect(result.success).toBe(true);
    });

    it('should get active rooms', async () => {
        const mockRooms = [{ code: 'AAA' }, { code: 'BBB' }];
        RoomAPI.fetchRooms.mockResolvedValue(mockRooms);

        const rooms = await roomManager.getActiveRooms();

        expect(rooms).toEqual(mockRooms);
        expect(RoomAPI.fetchRooms).toHaveBeenCalled();
    });

    it('should get room by code', async () => {
        const mockRoom = { code: 'TEST', name: 'Test Room' };
        RoomAPI.getRoom.mockResolvedValue(mockRoom);

        const room = await roomManager.getRoom('TEST');

        expect(room).toEqual(mockRoom);
    });

    it('should return null for non-existent room', async () => {
        RoomAPI.getRoom.mockRejectedValue(new Error('Not found'));

        const room = await roomManager.getRoom('FAKE');

        expect(room).toBeNull();
    });

    it('should leave room', async () => {
        await roomManager.leaveRoom('TEST', 'user1');

        expect(RoomAPI.leaveRoom).toHaveBeenCalledWith('TEST', 'user1');
    });

    it('should start room', async () => {
        await roomManager.startRoom('TEST', 'Draw a cat');

        expect(RoomAPI.startRoom).toHaveBeenCalledWith('TEST', 'Draw a cat');
    });

    it('should update room name', async () => {
        const result = await roomManager.updateRoomName('TEST', 'New Name');

        expect(result.success).toBe(true);
        expect(RoomAPI.updateRoom).toHaveBeenCalledWith('TEST', { name: 'New Name' });
    });

    it('should handle update name error', async () => {
        RoomAPI.updateRoom.mockRejectedValue(new Error('Not found'));

        const result = await roomManager.updateRoomName('FAKE', 'Name');

        expect(result.success).toBe(false);
        expect(result.reason).toBe('ROOM_NOT_FOUND');
    });

    it('should delete room', async () => {
        const result = await roomManager.deleteRoom('TEST');

        expect(result).toBe(true);
        expect(RoomAPI.deleteRoom).toHaveBeenCalledWith('TEST');
    });

    it('should handle delete room error', async () => {
        RoomAPI.deleteRoom.mockRejectedValue(new Error('Error'));

        const result = await roomManager.deleteRoom('FAKE');

        expect(result).toBe(false);
    });
});
