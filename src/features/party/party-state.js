/**
 * Party State - Manage the room's squad and pending join requests.
 */
export class PartyState {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.roomName = '';
        this.participants = [];
        this.pendingRequests = [];
        this.maxPlayers = 8;
        this.pickerId = null;
        this.pickerTimeLeft = 30;
        this.status = 'LOBBY';
        this.roundDuration = 60;
        this.chatEnabled = true;
    }

    /**
     * Adds a user to the waiting list.
     */
    addPendingRequest(user) {
        this.pendingRequests.push(user);
    }

    /**
     * Approves a pending request and moves them to the squad.
     * @returns {boolean} Success status
     */
    approveRequest(userId) {
        if (this.participants.length >= this.maxPlayers) {
            return false;
        }

        const index = this.pendingRequests.findIndex(u => u.id === userId);
        if (index !== -1) {
            const user = this.pendingRequests.splice(index, 1)[0];
            this.participants.push(user);
            return true;
        }
        return false;
    }

    /**
     * Rejects a pending request.
     */
    denyRequest(userId) {
        const index = this.pendingRequests.findIndex(u => u.id === userId);
        if (index !== -1) {
            this.pendingRequests.splice(index, 1);
        }
    }
}
