import { RoomAPI } from './room-api.js';

/**
 * Room Manager - Client-side facade for Room operations.
 * Delegates actual persistence/networking to RoomAPI.
 * Now fully async to support future network layer.
 */
export class RoomManager {
    constructor() {
        // No local state cache needed if we always fetch fresh
    }

    /**
     * Creates a new room with a unique code
     * @param {string} hostId - User ID of the host
     * @param {string|Object} settings - Room name string (legacy) or settings object
     * @returns {Promise<Object>} Room object
     */
    async createRoom(hostId, settings = 'Unnamed Room') {
        const code = this._generateRoomCode();

        let name = 'Unnamed Room';
        let maxPlayers = 8;
        let isPrivate = false;
        let description = '';

        if (typeof settings === 'string') {
            name = settings;
        } else if (typeof settings === 'object') {
            name = settings.name || name;
            maxPlayers = settings.maxPlayers || maxPlayers;
            isPrivate = !!settings.isPrivate;
            description = settings.description || '';
        }

        const roomData = {
            code,
            hostId,
            name,
            description,
            isPrivate,
            participants: [{ userId: hostId, role: 'host' }],
            pendingQueue: [],
            maxPlayers,
            status: 'LOBBY',
            createdAt: Date.now()
        };

        return await RoomAPI.createRoom(roomData);
    }

    /**
     * User knocks on a room (joins pending queue)
     * @returns {Promise<Object>} Result with success status
     */
    async knockOnRoom(roomCode, userId) {
        try {
            const room = await RoomAPI.getRoom(roomCode);

            if (room.participants.length >= room.maxPlayers) {
                return { success: false, reason: 'ROOM_FULL' };
            }

            const alreadyInQueue = room.pendingQueue.some(p => p.userId === userId);
            const alreadyInRoom = room.participants.some(p => p.userId === userId);

            if (alreadyInQueue || alreadyInRoom) {
                return { success: false, reason: 'ALREADY_IN_ROOM' };
            }

            const updatedQueue = [...room.pendingQueue, { userId, knockedAt: Date.now() }];
            await RoomAPI.updateRoom(roomCode, { pendingQueue: updatedQueue });

            return { success: true };
        } catch (e) {
            return { success: false, reason: 'ROOM_NOT_FOUND' };
        }
    }

    /**
     * Host approves a player from the queue
     */
    async approvePlayer(roomCode, userId) {
        try {
            const room = await RoomAPI.getRoom(roomCode);
            const queueIndex = room.pendingQueue.findIndex(p => p.userId === userId);

            if (queueIndex === -1) return { success: false, reason: 'USER_NOT_IN_QUEUE' };
            if (room.participants.length >= room.maxPlayers) return { success: false, reason: 'ROOM_FULL' };

            const updatedQueue = [...room.pendingQueue];
            updatedQueue.splice(queueIndex, 1);

            const updatedParticipants = [...room.participants, { userId, role: 'player' }];

            await RoomAPI.updateRoom(roomCode, {
                pendingQueue: updatedQueue,
                participants: updatedParticipants
            });

            return { success: true, action: 'APPROVED' };
        } catch (e) {
            return { success: false, reason: 'ERROR' };
        }
    }

    /**
     * Host rejects a player from the queue
     */
    async rejectPlayer(roomCode, userId) {
        try {
            const room = await RoomAPI.getRoom(roomCode);
            const queueIndex = room.pendingQueue.findIndex(p => p.userId === userId);

            if (queueIndex === -1) return { success: false, reason: 'USER_NOT_IN_QUEUE' };

            const updatedQueue = [...room.pendingQueue];
            updatedQueue.splice(queueIndex, 1);

            await RoomAPI.updateRoom(roomCode, { pendingQueue: updatedQueue });
            return { success: true, action: 'REJECTED' };
        } catch (e) {
            return { success: false, reason: 'ERROR' };
        }
    }

    async joinRoomByCode(roomCode, userId) {
        return this.knockOnRoom(roomCode, userId);
    }

    async getActiveRooms() {
        return await RoomAPI.fetchRooms();
    }

    async getRoom(roomCode) {
        try {
            return await RoomAPI.getRoom(roomCode);
        } catch {
            return null;
        }
    }

    async leaveRoom(roomCode, userId) {
        return await RoomAPI.leaveRoom(roomCode, userId);
    }

    async startRoom(roomCode, prompt) {
        return await RoomAPI.startRoom(roomCode, prompt);
    }

    async updateRoomName(roomCode, newName) {
        try {
            await RoomAPI.updateRoom(roomCode, { name: newName });
            return { success: true };
        } catch (e) {
            return { success: false, reason: 'ROOM_NOT_FOUND' };
        }
    }

    async deleteRoom(roomCode) {
        try {
            return await RoomAPI.deleteRoom(roomCode);
        } catch (e) {
            return false;
        }
    }

    /**
     * Generates a unique 4-letter room code
     * @private
     */
    _generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const bannedPatterns = ['FUCK', 'SHIT', 'PIMP', 'COCK', 'DICK', 'CUNT', 'DAMN', 'HELL', 'PISS', 'TWAT', 'ARSE'];

        // Simple explicit check for 4-letter bad words
        const isBad = (code) => {
            return bannedPatterns.includes(code);
        }

        let code = '';
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += letters.charAt(Math.floor(Math.random() * letters.length));
            }
        } while (isBad(code));

        return code;
    }
}
