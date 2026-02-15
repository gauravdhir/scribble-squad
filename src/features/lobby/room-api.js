/**
 * Room API Service (Network Version)
 * Communicates with the Node.js server via WebSockets for real-time sync.
 */
import { socketClient } from '../../lib/socket.js';

export const RoomAPI = {
    /**
     * Fetch all active rooms
     * @returns {Promise<Array>}
     */
    async fetchRooms() {
        return new Promise(resolve => {
            socketClient.emit('rooms:fetch', (rooms) => {
                resolve(rooms);
            });
        });
    },

    /**
     * Create a new room
     * @param {Object} roomData 
     * @returns {Promise<Object>}
     */
    async createRoom(roomData) {
        return new Promise((resolve, reject) => {
            socketClient.emit('room:create', roomData, (response) => {
                if (response.success) {
                    socketClient.emit('room:join', roomData.code);
                    resolve(response.room);
                } else {
                    reject(new Error(response.message || 'Failed to create room'));
                }
            });
        });
    },

    /**
     * Update an existing room
     * @param {string} code 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async updateRoom(code, updates) {
        return new Promise((resolve, reject) => {
            socketClient.emit('room:update', { code, updates }, (response) => {
                if (response.success) {
                    resolve(response.room);
                } else {
                    reject(new Error(response.message || 'Update failed'));
                }
            });
        });
    },

    /**
     * Get a single room
     * @param {string} code 
     * @returns {Promise<Object>}
     */
    async getRoom(code) {
        return new Promise(resolve => {
            // Join the room channel to receive real-time updates
            socketClient.emit('room:join', code);

            socketClient.emit('room:get', code, (room) => {
                resolve(room || null);
            });
        });
    },

    /**
     * Just join the socket room channel without fetching data (lightweight)
     */
    joinRoom(code) {
        if (code) {
            socketClient.emit('room:join', code);
        }
    },

    /**
     * Cleanly leave the socket room channel (stops receiving chat)
     */
    leaveSocketRoom(code) {
        if (code) {
            socketClient.emit('room:leave-socket', code);
        }
    },

    /**
     * Delete a room
     * @param {string} code 
     * @returns {Promise<boolean>}
     */
    async deleteRoom(code) {
        return new Promise((resolve) => {
            socketClient.emit('room:delete', code, (response) => {
                resolve(response.success);
            });
        });
    },

    /**
     * Leave a room
     */
    async leaveRoom(code, userId) {
        return new Promise((resolve) => {
            socketClient.emit('room:leave', { code, userId }, (response) => {
                resolve(response.success);
            });
        });
    },

    /**
     * Start the game
     */
    async startRoom(code, prompt) {
        return new Promise((resolve) => {
            socketClient.emit('room:start', { code, prompt }, (response) => {
                resolve(response.success);
            });
        });
    },

    /**
     * Finish the game manually (Host)
     */
    finishRoom(code) {
        socketClient.emit('room:finish', { code });
    },

    /**
     * Abort the game manually (Host)
     */
    abortRoom(code) {
        socketClient.emit('room:abort', { code });
    },

    /**
     * Kick a player (Host)
     */
    kickPlayer(code, userId) {
        socketClient.emit('room:kick', { code, userId });
    },

    syncStrokes(code) {
        return new Promise(resolve => {
            socketClient.emit('draw:sync', code, (strokes) => {
                resolve(strokes || []);
            });
        });
    },

    submitMasterpiece(code, masterpiece) {
        socketClient.emit('room:submit-masterpiece', { code, masterpiece });
    },

    /**
     * Send a drawing stroke
     */
    sendStroke(code, stroke) {
        socketClient.emit('draw:stroke', { code, stroke });
    },

    /**
     * Send a chat message
     */
    sendChatMessage(code, userId, message) {
        socketClient.emit('chat:send', { code, userId, message });
    },

    /**
     * Send a reaction in judging room
     */
    sendReaction(code, type, x, y) {
        socketClient.emit('judging:react', { code, type, x, y });
    },

    /**
     * Send an award in judging room
     */
    sendAward(code, type) {
        socketClient.emit('judging:award', { code, type });
    },

    mutePlayer(code, targetId) {
        socketClient.emit('room:mute-player', { code, targetId });
    },

    unmutePlayer(code, targetId) {
        socketClient.emit('room:unmute-player', { code, targetId });
    },

    /**
     * Set the next prompt (Picker only)
     */
    async setPrompt(code, prompt, userId) {
        return new Promise((resolve) => {
            socketClient.emit('room:set-prompt', { code, prompt, userId }, (response) => {
                resolve(response.success);
            });
        });
    },

    setTheme(code, themeId) {
        socketClient.emit('room:set-theme', { code, themeId });
    },

    /**
     * Subscribe to real-time updates
     */
    subscribe(event, callback) {
        socketClient.on(event, callback);
    },

    /**
     * Unsubscribe from events
     */
    unsubscribe(event, callback) {
        if (socketClient.getSocket()) {
            socketClient.getSocket().off(event, callback);
        }
    }
};
