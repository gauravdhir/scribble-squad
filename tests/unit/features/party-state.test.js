/**
 * Test Suite: PartyState
 * Purpose: Logic for participant management and approval queues
 * Visibility: Gaurav (Principal Dev)
 */
import test from 'node:test';
import assert from 'node:assert';
import { PartyState } from '../../../src/features/party/party-state.js';

test('PartyState should initialize with an empty participant list and pending queue', () => {
    const party = new PartyState('PLAY');
    assert.strictEqual(party.roomCode, 'PLAY');
    assert.strictEqual(party.participants.length, 0);
    assert.strictEqual(party.pendingRequests.length, 0);
});

test('PartyState.addPendingRequest should add player to the queue', () => {
    const party = new PartyState('PLAY');
    party.addPendingRequest({ id: 'p1', name: 'PixelPaul' });

    assert.strictEqual(party.pendingRequests.length, 1);
    assert.strictEqual(party.pendingRequests[0].name, 'PixelPaul');
});

test('PartyState.approveRequest should move player from pending to participants', () => {
    const party = new PartyState('PLAY');
    party.addPendingRequest({ id: 'p1', name: 'PixelPaul' });

    party.approveRequest('p1');

    assert.strictEqual(party.pendingRequests.length, 0);
    assert.strictEqual(party.participants.length, 1);
    assert.strictEqual(party.participants[0].name, 'PixelPaul');
});

test('PartyState should not exceed 8 participants', () => {
    const party = new PartyState('PLAY');

    // Fill it up
    for (let i = 0; i < 8; i++) {
        party.participants.push({ id: `bot${i}`, name: `Bot${i}` });
    }

    party.addPendingRequest({ id: 'p1', name: 'Latecomer' });

    // Try to approve
    const result = party.approveRequest('p1');

    assert.strictEqual(result, false, 'Should not allow approval if full');
    assert.strictEqual(party.participants.length, 8);
    assert.strictEqual(party.pendingRequests.length, 1);
});

test('PartyState.denyRequest should remove player from pending without adding to participants', () => {
    const party = new PartyState('PLAY');
    party.addPendingRequest({ id: 'p1', name: 'GameGirl' });

    party.denyRequest('p1');

    assert.strictEqual(party.pendingRequests.length, 0);
    assert.strictEqual(party.participants.length, 0);
});
