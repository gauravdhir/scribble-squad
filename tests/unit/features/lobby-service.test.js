import { describe, it, expect } from 'vitest';
import { LobbyService } from '../../../src/features/lobby/lobby-service.js';

describe('LobbyService', () => {
    it('should return "FULL" when count is 8', () => {
        const service = new LobbyService();
        expect(service.calculateRoomStatus(8)).toBe('FULL');
    });

    it('should return "OPEN" when count is less than 8', () => {
        const service = new LobbyService();
        expect(service.calculateRoomStatus(7)).toBe('OPEN');
    });

    it('should generate a valid 4-letter room code', () => {
        const service = new LobbyService();
        const code = service.generateRoomCode();
        expect(code).toHaveLength(4);
        expect(code).toMatch(/^[A-Z]{4}$/);
    });
});
