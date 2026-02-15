/**
 * In-memory store for rooms
 * In a production app, this would be a database.
 */
class RoomStore {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomData) {
        this.rooms.set(roomData.code, {
            ...roomData,
            strokes: [],
            pickerHistory: [],
            roundDuration: 60,
            chatEnabled: true,
            createdAt: Date.now()
        });
        return this.rooms.get(roomData.code);
    }

    getRoom(code) {
        return this.rooms.get(code);
    }

    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    updateRoom(code, updates) {
        const room = this.rooms.get(code);
        if (room) {
            const updated = { ...room, ...updates };
            this.rooms.set(code, updated);
            return updated;
        }
        return null;
    }

    deleteRoom(code) {
        return this.rooms.delete(code);
    }

    removeParticipant(code, userId) {
        const room = this.rooms.get(code);
        if (room) {
            const isHost = room.hostId === userId;
            if (isHost) {
                // If host leaves, delete room
                this.rooms.delete(code);
                return { deleted: true };
            } else {
                room.participants = room.participants.filter(p => p.userId !== userId);
                return { deleted: false, room };
            }
        }
        return null;
    }
}

export const roomStore = new RoomStore();
