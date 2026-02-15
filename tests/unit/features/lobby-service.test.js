/**
 * Test Suite: LobbyService
 * Purpose: Room discovery and management logic
 */
import test from 'node:test';
import assert from 'node:assert';
// Note: We'll mock the API later, for now we test state transitions
import { LobbyService } from '../../../src/features/lobby/lobby-service.js';

test('LobbyService.calculateRoomStatus should return "FULL" when count is 8', () => {
    const service = new LobbyService();
    assert.strictEqual(service.calculateRoomStatus(8), 'FULL');
});

test('LobbyService.calculateRoomStatus should return "OPEN" when count is less than 8', () => {
    const service = new LobbyService();
    assert.strictEqual(service.calculateRoomStatus(7), 'OPEN');
});

test('LobbyService should generate a valid 4-letter room code', () => {
    const service = new LobbyService();
    const code = service.generateRoomCode();
    assert.strictEqual(code.length, 4);
    assert.match(code, /^[A-Z]{4}$/);
});
