/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PartyState } from '../../../src/features/party/party-state.js';

describe('PartyState', () => {
    let partyState;

    beforeEach(() => {
        partyState = new PartyState('TEST123');
    });

    it('should initialize with room code', () => {
        expect(partyState.roomCode).toBe('TEST123');
    });

    it('should initialize with default values', () => {
        expect(partyState.roomName).toBe('');
        expect(partyState.participants).toEqual([]);
        expect(partyState.pendingRequests).toEqual([]);
        expect(partyState.maxPlayers).toBe(8);
        expect(partyState.pickerId).toBe(null);
        expect(partyState.pickerTimeLeft).toBe(30);
        expect(partyState.status).toBe('LOBBY');
        expect(partyState.roundDuration).toBe(60);
        expect(partyState.chatEnabled).toBe(true);
    });

    it('should add pending request correctly', () => {
        const user = { id: 'user1', name: 'Alice' };

        partyState.addPendingRequest(user);

        expect(partyState.pendingRequests.length).toBe(1);
        expect(partyState.pendingRequests[0]).toEqual(user);
    });

    it('should add multiple pending requests', () => {
        const user1 = { id: 'user1', name: 'Alice' };
        const user2 = { id: 'user2', name: 'Bob' };
        const user3 = { id: 'user3', name: 'Charlie' };

        partyState.addPendingRequest(user1);
        partyState.addPendingRequest(user2);
        partyState.addPendingRequest(user3);

        expect(partyState.pendingRequests.length).toBe(3);
        expect(partyState.pendingRequests[0].name).toBe('Alice');
        expect(partyState.pendingRequests[1].name).toBe('Bob');
        expect(partyState.pendingRequests[2].name).toBe('Charlie');
    });

    it('should approve request and move user to participants', () => {
        const user = { id: 'user1', name: 'Alice' };
        partyState.addPendingRequest(user);

        const result = partyState.approveRequest('user1');

        expect(result).toBe(true);
        expect(partyState.participants.length).toBe(1);
        expect(partyState.participants[0]).toEqual(user);
        expect(partyState.pendingRequests.length).toBe(0);
    });

    it('should return false when approving non-existent request', () => {
        const result = partyState.approveRequest('nonexistent');

        expect(result).toBe(false);
        expect(partyState.participants.length).toBe(0);
    });

    it('should return false when approving with full squad', () => {
        // Fill squad to max
        for (let i = 0; i < 8; i++) {
            partyState.participants.push({ id: `player${i}`, name: `Player${i}` });
        }

        const user = { id: 'user99', name: 'LateJoiner' };
        partyState.addPendingRequest(user);

        const result = partyState.approveRequest('user99');

        expect(result).toBe(false);
        expect(partyState.participants.length).toBe(8);
        expect(partyState.pendingRequests.length).toBe(1);
    });

    it('should approve multiple requests sequentially', () => {
        const users = [
            { id: 'user1', name: 'Alice' },
            { id: 'user2', name: 'Bob' },
            { id: 'user3', name: 'Charlie' }
        ];

        users.forEach(u => partyState.addPendingRequest(u));

        partyState.approveRequest('user1');
        partyState.approveRequest('user3');

        expect(partyState.participants.length).toBe(2);
        expect(partyState.participants[0].name).toBe('Alice');
        expect(partyState.participants[1].name).toBe('Charlie');
        expect(partyState.pendingRequests.length).toBe(1);
        expect(partyState.pendingRequests[0].name).toBe('Bob');
    });

    it('should deny pending request successfully', () => {
        const user = { id: 'user1', name: 'Alice' };
        partyState.addPendingRequest(user);

        partyState.denyRequest('user1');

        expect(partyState.pendingRequests.length).toBe(0);
        expect(partyState.participants.length).toBe(0);
    });

    it('should handle denying non-existent request gracefully', () => {
        const user = { id: 'user1', name: 'Alice' };
        partyState.addPendingRequest(user);

        partyState.denyRequest('nonexistent');

        expect(partyState.pendingRequests.length).toBe(1);
    });

    it('should deny specific request from multiple pending', () => {
        const users = [
            { id: 'user1', name: 'Alice' },
            { id: 'user2', name: 'Bob' },
            { id: 'user3', name: 'Charlie' }
        ];

        users.forEach(u => partyState.addPendingRequest(u));

        partyState.denyRequest('user2');

        expect(partyState.pendingRequests.length).toBe(2);
        expect(partyState.pendingRequests[0].name).toBe('Alice');
        expect(partyState.pendingRequests[1].name).toBe('Charlie');
    });

    it('should handle approve up to max capacity', () => {
        // Add 8 pending requests
        for (let i = 0; i < 8; i++) {
            partyState.addPendingRequest({ id: `user${i}`, name: `User${i}` });
        }

        // Approve all 8
        for (let i = 0; i < 8; i++) {
            const result = partyState.approveRequest(`user${i}`);
            expect(result).toBe(true);
        }

        expect(partyState.participants.length).toBe(8);
        expect(partyState.pendingRequests.length).toBe(0);
    });

    it('should maintain correct capacity after approvals and denials', () => {
        for (let i = 0; i < 5; i++) {
            partyState.addPendingRequest({ id: `user${i}`, name: `User${i}` });
        }

        partyState.approveRequest('user0');
        partyState.approveRequest('user1');
        partyState.denyRequest('user2');
        partyState.approveRequest('user3');

        expect(partyState.participants.length).toBe(3);
        expect(partyState.pendingRequests.length).toBe(1);
        expect(partyState.pendingRequests[0].id).toBe('user4');
    });

    it('should allow modification of room properties', () => {
        partyState.roomName = 'Epic Squad';
        partyState.status = 'PLAYING';
        partyState.roundDuration = 120;
        partyState.chatEnabled = false;
        partyState.pickerId = 'player1';

        expect(partyState.roomName).toBe('Epic Squad');
        expect(partyState.status).toBe('PLAYING');
        expect(partyState.roundDuration).toBe(120);
        expect(partyState.chatEnabled).toBe(false);
        expect(partyState.pickerId).toBe('player1');
    });

    it('should preserve participant data during operations', () => {
        const userWithMetadata = {
            id: 'user1',
            name: 'Alice',
            avatar: 'avatar.png',
            score: 100
        };

        partyState.addPendingRequest(userWithMetadata);
        partyState.approveRequest('user1');

        expect(partyState.participants[0]).toEqual(userWithMetadata);
        expect(partyState.participants[0].avatar).toBe('avatar.png');
        expect(partyState.participants[0].score).toBe(100);
    });
});
