/**
 * Test Suite: Room Manager
 * Purpose: Verification of room creation, joining, and queue management with ASYNC behavior
 */
import test from 'node:test';
import assert from 'node:assert';
import { RoomManager } from '../../../src/features/lobby/room-manager.js';

// Mock localStorage for Node environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();
global.localStorage = localStorageMock;
// Mock Event
global.Event = class Event { };
global.window = { dispatchEvent: () => { } };


test('RoomManager should create a new room with generated code', async () => {
    const manager = new RoomManager();
    const hostId = 'user123';
    const room = await manager.createRoom(hostId);

    assert.strictEqual(room.code.length, 4);
    assert.strictEqual(room.hostId, hostId);
    assert.strictEqual(room.participants.length, 1); // Host is first participant
    assert.strictEqual(room.pendingQueue.length, 0);
});

test('RoomManager should add user to pending queue when knocking', async () => {
    const manager = new RoomManager();
    const room = await manager.createRoom('host1');

    await manager.knockOnRoom(room.code, 'player1');

    const updatedRoom = await manager.getRoom(room.code);
    assert.strictEqual(updatedRoom.pendingQueue.length, 1);
    assert.strictEqual(updatedRoom.pendingQueue[0].userId, 'player1');
});

test('RoomManager should approve user from queue', async () => {
    const manager = new RoomManager();
    const room = await manager.createRoom('host1');
    await manager.knockOnRoom(room.code, 'player1');

    const result = await manager.approvePlayer(room.code, 'player1');

    const updatedRoom = await manager.getRoom(room.code);
    assert.strictEqual(result.success, true);
    assert.strictEqual(updatedRoom.participants.length, 2);
    assert.strictEqual(updatedRoom.pendingQueue.length, 0);
});

test('RoomManager should reject user from queue', async () => {
    const manager = new RoomManager();
    const room = await manager.createRoom('host1');
    await manager.knockOnRoom(room.code, 'player1');

    const result = await manager.rejectPlayer(room.code, 'player1');

    const updatedRoom = await manager.getRoom(room.code);
    assert.strictEqual(result.success, true);
    assert.strictEqual(updatedRoom.participants.length, 1); // Only host
    assert.strictEqual(updatedRoom.pendingQueue.length, 0);
});

test('RoomManager should allow direct join with valid code', async () => {
    const manager = new RoomManager();
    const room = await manager.createRoom('host1');

    // Simulate host approving a player
    await manager.knockOnRoom(room.code, 'player1');
    await manager.approvePlayer(room.code, 'player1');

    const joinResult = await manager.joinRoomByCode(room.code, 'player2');

    // Direct join should add to pending queue (not auto-approve)
    assert.strictEqual(joinResult.success, true);
    const updatedRoom = await manager.getRoom(room.code);
    assert.strictEqual(updatedRoom.pendingQueue.length, 1);
});

import { socketClient } from '../../../src/lib/socket.js';


test('RoomManager should return all active rooms', async () => {
    socketClient.resetMock();
    localStorage.clear();
    const manager = new RoomManager();
    await manager.createRoom('host1');
    await manager.createRoom('host2');

    const rooms = await manager.getActiveRooms();

    assert.strictEqual(rooms.length, 2);
});

test('RoomManager should not allow joining full room', async () => {
    const manager = new RoomManager();
    // 8 players max
    const room = await manager.createRoom('host1', { maxPlayers: 8 });

    // Fill room to max capacity (host + 7)
    for (let i = 1; i < 8; i++) {
        await manager.knockOnRoom(room.code, `player${i}`);
        await manager.approvePlayer(room.code, `player${i}`);
    }

    const result = await manager.knockOnRoom(room.code, 'player9');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'ROOM_FULL');
});

test('RoomManager should create a room with custom settings', async () => {
    const manager = new RoomManager();
    const hostId = 'user123';
    const settings = {
        name: 'My Special Room',
        maxPlayers: 4,
        isPrivate: true,
        description: 'A test room'
    };

    const room = await manager.createRoom(hostId, settings);

    assert.strictEqual(room.name, 'My Special Room');
    assert.strictEqual(room.maxPlayers, 4);
    assert.strictEqual(room.isPrivate, true);
    assert.strictEqual(room.description, 'A test room');
});

test('RoomManager should persist to API/Storage', async () => {
    localStorage.clear();
    const manager1 = new RoomManager();
    const room = await manager1.createRoom('host1', 'Persistent Room');

    // Create new manager instance (simulating page reload or another client)
    const manager2 = new RoomManager();
    const savedRoom = await manager2.getRoom(room.code);

    assert.ok(savedRoom);
    assert.strictEqual(savedRoom.name, 'Persistent Room');
    assert.strictEqual(savedRoom.hostId, 'host1');
});
