import { roomStore } from './room-store.js';
import { filterContent, hasProfanity } from './profanity-filter.js';

// Timer storage (keep separate from roomStore to avoid serialization issues)
const roomTimers = new Map();

/**
 * Socket.io event handlers for room management
 */
export function registerRoomHandlers(io, socket) {
    // 1. Fetch all rooms
    socket.on('rooms:fetch', (callback) => {
        const rooms = roomStore.getAllRooms();
        if (typeof callback === 'function') callback(rooms);
    });

    // 1.5 Get specific room
    socket.on('room:get', (code, callback) => {
        const room = roomStore.getRoom(code);
        if (typeof callback === 'function') {
            callback(room || null);
        }
    });

    // 2. Create Room
    socket.on('room:create', (roomData, callback) => {
        try {
            if (hasProfanity(roomData.name) || hasProfanity(roomData.description)) {
                if (typeof callback === 'function') callback({ success: false, message: 'Clean it up! No potty mouth allowed in Room Name or Description.' });
                return;
            }
            const room = roomStore.createRoom(roomData);
            io.emit('lobby:updated', roomStore.getAllRooms()); // Broadcast to all
            if (typeof callback === 'function') callback({ success: true, room });
        } catch (error) {
            if (typeof callback === 'function') callback({ success: false, message: error.message });
        }
    });

    // 3. Update Room (Approve/Reject/Name)
    socket.on('room:update', ({ code, updates }, callback) => {
        if (updates.name && hasProfanity(updates.name)) {
            if (typeof callback === 'function') callback({ success: false, message: 'Update rejected: Potty mouth detected.' });
            return;
        }

        const updatedRoom = roomStore.updateRoom(code, updates);
        if (updatedRoom) {
            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('room:changed', updatedRoom);
            if (typeof callback === 'function') callback({ success: true, room: updatedRoom });
        } else {
            if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
        }
    });

    // 4. Join/Knock Room
    socket.on('room:join', (code) => {
        // console.log(`Socket ${socket.id} joined room ${code}`); 
        socket.join(code);
    });

    // 4.5 Leave Socket Room (Clean disconnect)
    socket.on('room:leave-socket', (code) => {
        // console.log(`Socket ${socket.id} leaving room ${code}`);
        socket.leave(code);
    });

    // 5. Delete Room
    socket.on('room:delete', (code, callback) => {
        const timerKeys = [code, `${code}:picker`, `${code}:judging`];
        timerKeys.forEach(key => {
            if (roomTimers.has(key)) {
                clearInterval(roomTimers.get(key));
                roomTimers.delete(key);
            }
        });

        const deleted = roomStore.deleteRoom(code);
        if (deleted) {
            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('room:deleted');
            if (typeof callback === 'function') callback({ success: true });
        } else {
            if (typeof callback === 'function') callback({ success: false });
        }
    });

    // 6. Leave Room (Updated to clear all timers if host)
    socket.on('room:leave', ({ code, userId }, callback) => {
        const room = roomStore.getRoom(code);
        if (!room) {
            if (typeof callback === 'function') callback({ success: false });
            return;
        }

        const isHost = room.hostId === userId;
        const isPicker = room.currentPickerId === userId;
        const isJudge = room.judgeId === userId;
        const status = room.status;

        // Cleanup timers if Host leaves
        if (isHost) {
            const timerKeys = [code, `${code}:picker`, `${code}:judging`];
            timerKeys.forEach(key => {
                if (roomTimers.has(key)) {
                    clearInterval(roomTimers.get(key));
                    roomTimers.delete(key);
                }
            });
        }

        const result = roomStore.removeParticipant(code, userId);
        if (result) {
            socket.leave(code);

            if (result.deleted) {
                io.emit('lobby:updated', roomStore.getAllRooms());
                io.to(code).emit('room:deleted');
            } else {
                io.emit('lobby:updated', roomStore.getAllRooms());
                io.to(code).emit('room:changed', result.room);

                // EDGE CASE 1: Picker left while picking
                if (status === 'PICKING_PROMPT' && isPicker) {
                    // Clear existing picker timer
                    const timerKey = `${code}:picker`;
                    if (roomTimers.has(timerKey)) {
                        clearInterval(roomTimers.get(timerKey));
                        roomTimers.delete(timerKey);
                    }
                    io.to(code).emit('toast:error', 'The Picker abandoned the mission! Selecting a new one...');
                    selectNextPicker(io, code);
                }

                // EDGE CASE 2: Judge left while judging
                if (status === 'JUDGING' && isJudge) {
                    // Clear judging timer
                    const timerKey = `${code}:judging`;
                    if (roomTimers.has(timerKey)) {
                        clearInterval(roomTimers.get(timerKey));
                        roomTimers.delete(timerKey);
                    }
                    io.to(code).emit('toast:error', 'The Judge fled! Skipping to next round...');
                    selectNextPicker(io, code);
                }

                // EDGE CASE 3: Judge left while playing (drawing)
                if (status === 'PLAYING' && isJudge) {
                    // We need a new judge!
                    const remaining = result.room.participants.filter(p => p.userId !== room.currentProviderName);
                    if (remaining.length > 0) {
                        const newJudge = remaining[Math.floor(Math.random() * remaining.length)].userId;
                        roomStore.updateRoom(code, { judgeId: newJudge });
                        io.to(code).emit('room:changed', result.room);
                        io.to(code).emit('toast:info', `The Judge left. ${newJudge} is the new Judge!`);
                        // We also need to tell the client the judge changed if they assume it from start
                        // The client subscribes to room:changed, so appState.currentGameJudgeId should be updated there? 
                        // Check app-lifecycle.js: it does check judgeId on 'game:started', but on 'room:changed' it only updates renderers. 
                        // I might need to explicitly emit an event or rely on room:changed handling.
                    } else {
                        // No one left to judge? Abort?
                        io.to(code).emit('toast:error', 'No one left to judge! Aborting round.');
                        selectNextPicker(io, code);
                    }
                }
            }

            if (typeof callback === 'function') callback({ success: true });
        } else {
            if (typeof callback === 'function') callback({ success: false });
        }
    });

    // 7. Start Game
    socket.on('room:start', ({ code, prompt }, callback) => {
        if (hasProfanity(prompt)) {
            if (typeof callback === 'function') callback({ success: false, message: 'Prompt rejected: Potty mouth detected.' });
            return;
        }
        const room = roomStore.getRoom(code);
        if (room) {
            // Pick a random judge from participants (try to exclude host)
            const players = room.participants;
            const hostId = room.hostId;
            const potentialJudges = players.filter(p => p.userId !== hostId);
            const candidates = potentialJudges.length > 0 ? potentialJudges : players;

            const randomIdx = Math.floor(Math.random() * candidates.length);
            const judgeId = candidates[randomIdx].userId;

            const filteredPrompt = filterContent(prompt);

            roomStore.updateRoom(code, {
                status: 'PLAYING',
                currentPrompt: filteredPrompt,
                judgeId: judgeId,
                strokes: [], // Reset strokes for new round
                currentProviderName: hostId // Host is provider in first round
            });

            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('game:started', { prompt: filteredPrompt, judgeId, providerName: hostId });

            // Clear existing timer if any
            if (roomTimers.has(code)) {
                clearInterval(roomTimers.get(code));
            }

            // Timer logic
            let timeLeft = room.roundDuration || 60;
            roomStore.updateRoom(code, { timeLeft }); // Initialize

            const timerId = setInterval(() => {
                timeLeft--;
                roomStore.updateRoom(code, { timeLeft }); // Persist for re-joins
                io.to(code).emit('timer:update', { timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    roomTimers.delete(code);
                    roomStore.updateRoom(code, { timeLeft: 0 });
                    io.to(code).emit('timer:ended');
                }
            }, 1000);

            roomTimers.set(code, timerId);

            if (typeof callback === 'function') callback({ success: true });
        } else {
            if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
        }
    });

    // 7. Kick Player (Host only)
    socket.on('room:kick', ({ code, userId }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            const updatedParticipants = room.participants.filter(p => p.userId !== userId);
            roomStore.updateRoom(code, {
                participants: updatedParticipants
            });

            // LOGIC: If the kicked player was the active Picker, we must pick a new one!
            if (room.status === 'PICKING_PROMPT' && room.currentPickerId === userId) {
                console.log(`Picker ${userId} kicked. Selecting new picker...`);
                // Clear any existing picker timer?
                const timerKey = `${code}:picker`;
                if (roomTimers.has(timerKey)) {
                    clearInterval(roomTimers.get(timerKey));
                    roomTimers.delete(timerKey);
                }
                // Determine new picker immediately
                selectNextPicker(io, code);
            }

            // Notify the specific user they were kicked
            io.to(code).emit('room:kicked', { userId });

            // Update everyone else
            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('room:changed', roomStore.getRoom(code));
        }
    });

    // 7.5 Finish Game (Host only)
    socket.on('room:finish', ({ code }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            // Clear all possible timers
            const timerKeys = [code, `${code}:picker`, `${code}:judging`];
            timerKeys.forEach(key => {
                const timerId = roomTimers.get(key);
                if (timerId) {
                    clearInterval(timerId);
                    roomTimers.delete(key);
                }
            });

            roomStore.updateRoom(code, {
                status: 'LOBBY',
                currentPrompt: null,
                judgeId: null,
                currentPickerId: null,
                strokes: []
            });

            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('game:round-ended'); // Return everyone to lobby
            io.to(code).emit('room:changed', roomStore.getRoom(code));
        }
    });

    // 7.5.1 Abort Game (Host only) - Returns everyone to Discovery Lobby but keeps room
    socket.on('room:abort', ({ code }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            // Clear timers
            const timerKeys = [code, `${code}:picker`, `${code}:judging`];
            timerKeys.forEach(key => {
                const timerId = roomTimers.get(key);
                if (timerId) {
                    clearInterval(timerId);
                    roomTimers.delete(key);
                }
            });

            // Notify everyone to go to Discovery Lobby
            io.to(code).emit('room:aborted');

            // Reset room state for future use
            roomStore.updateRoom(code, {
                status: 'LOBBY',
                currentPrompt: null,
                judgeId: null,
                currentPickerId: null,
                strokes: [],
                participants: room.participants // Keep them for now? No, user says "kick everyone back".
            });

            // Kick them out on server state too
            roomStore.updateRoom(code, { participants: [] });

            io.emit('lobby:updated', roomStore.getAllRooms());
        }
    });

    // 7.6 Submit Masterpiece (end of drawing phase)
    socket.on('room:submit-masterpiece', ({ code, masterpiece }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            roomStore.updateRoom(code, {
                masterpiece,
                status: 'JUDGING'
            });
            io.to(code).emit('game:judging-started', { masterpiece, judgeId: room.judgeId });

            // Start Judging Timer (New Feature)
            const judgingTimerKey = `${code}:judging`;
            if (roomTimers.has(judgingTimerKey)) clearInterval(roomTimers.get(judgingTimerKey));

            let timeLeft = 60; // 60 seconds to judge
            const timerId = setInterval(() => {
                timeLeft--;
                io.to(code).emit('judging:timer:tick', { timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    roomTimers.delete(judgingTimerKey);

                    // Judge fell asleep! Move on.
                    io.to(code).emit('toast:error', 'Judge fell asleep! Moving to next round.');
                    selectNextPicker(io, code);
                }
            }, 1000);
            roomTimers.set(judgingTimerKey, timerId);
        }
    });

    // 8. Real-time Drawing
    socket.on('draw:stroke', ({ code, stroke }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            if (!room.strokes) room.strokes = [];
            room.strokes.push(stroke);
        }
        socket.to(code).emit('draw:incoming', stroke);
    });

    // Sync strokes for someone re-joining mid-game
    socket.on('draw:sync', (code, callback) => {
        const room = roomStore.getRoom(code);
        if (room && room.strokes) {
            if (typeof callback === 'function') callback(room.strokes);
        }
    });

    // 9. Judging Actions
    socket.on('judging:react', ({ code, type, x, y }) => {
        socket.to(code).emit('judging:incoming-reaction', { type, x, y });
    });

    socket.on('judging:award', ({ code, type }) => {
        // Stop Judging Timer
        const judgingTimerKey = `${code}:judging`;
        if (roomTimers.has(judgingTimerKey)) {
            clearInterval(roomTimers.get(judgingTimerKey));
            roomTimers.delete(judgingTimerKey);
        }

        io.to(code).emit('judging:incoming-award', { type });

        // Delay slightly for confetti, then trigger lobby transition and picker selection
        setTimeout(() => {
            selectNextPicker(io, code);
        }, 5000);
    });

    // 10. Round Ritual: Set Prompt (Picker only)
    socket.on('room:set-prompt', ({ code, prompt, userId }, callback) => {
        if (hasProfanity(prompt)) {
            if (typeof callback === 'function') callback({ success: false, message: 'Prompt rejected: Potty mouth detected.' });
            return;
        }
        const room = roomStore.getRoom(code);
        if (room && room.currentPickerId === userId) {
            // Stop the picker timer
            const pickerTimerKey = `${code}:picker`;
            if (roomTimers.has(pickerTimerKey)) {
                clearInterval(roomTimers.get(pickerTimerKey));
                roomTimers.delete(pickerTimerKey);
            }

            // Start the game with the new prompt
            // Force random judge again for next round (excluding the picker)
            const players = room.participants;
            const potentialJudges = players.filter(p => p.userId !== userId);
            const candidates = potentialJudges.length > 0 ? potentialJudges : players;

            const randomIdx = Math.floor(Math.random() * candidates.length);
            const judgeId = candidates[randomIdx].userId;

            const filteredPrompt = filterContent(prompt);

            roomStore.updateRoom(code, {
                status: 'PLAYING',
                currentPrompt: filteredPrompt,
                judgeId: judgeId,
                currentPickerId: null,
                strokes: [], // Reset for new round
                currentProviderName: userId
            });

            io.emit('lobby:updated', roomStore.getAllRooms());
            io.to(code).emit('game:started', { prompt: filteredPrompt, judgeId, providerName: userId });

            // Standard game timer
            let timeLeft = room.roundDuration || 60;
            roomStore.updateRoom(code, { timeLeft });

            const timerId = setInterval(() => {
                timeLeft--;
                roomStore.updateRoom(code, { timeLeft });
                io.to(code).emit('timer:update', { timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    roomTimers.delete(code);
                    roomStore.updateRoom(code, { timeLeft: 0 });
                    io.to(code).emit('timer:ended');
                }
            }, 1000);
            roomTimers.set(code, timerId);

            if (typeof callback === 'function') callback({ success: true });
        } else {
            if (typeof callback === 'function') callback({ success: false, message: 'Unauthorized or room not found' });
        }
    });

    // 11. Chat
    socket.on('chat:send', ({ code, userId, message }) => {
        const room = roomStore.getRoom(code);
        if (room && room.chatEnabled) {
            // Check if muted
            if (room.mutedPlayers && room.mutedPlayers.includes(userId)) {
                return;
            }
            const filteredMessage = filterContent(message);
            io.to(code).emit('chat:incoming', {
                userId,
                message: filteredMessage,
                timestamp: Date.now()
            });
        }
    });

    // 12. Mute/Unmute (New Feature)
    socket.on('room:mute-player', ({ code, targetId }) => {
        const room = roomStore.getRoom(code);
        if (room) {
            const muted = room.mutedPlayers || [];
            if (!muted.includes(targetId)) {
                muted.push(targetId);
                roomStore.updateRoom(code, { mutedPlayers: muted });
                io.to(code).emit('room:changed', roomStore.getRoom(code));
            }
        }
    });

    socket.on('room:unmute-player', ({ code, targetId }) => {
        const room = roomStore.getRoom(code);
        if (room && room.mutedPlayers) {
            const muted = room.mutedPlayers.filter(id => id !== targetId);
            roomStore.updateRoom(code, { mutedPlayers: muted });
            io.to(code).emit('room:changed', roomStore.getRoom(code));
        }
    });

    // 13. Theme Management
    socket.on('room:set-theme', ({ code, themeId }) => {
        console.log(`[Theme Sync] Room ${code} set to ${themeId}`);
        const room = roomStore.getRoom(code);
        if (room) {
            roomStore.updateRoom(code, { currentTheme: themeId });
            io.to(code).emit('room:theme-changed', { themeId });
        } else {
            console.warn(`[Theme Sync] Room ${code} not found`);
        }
    });

    /**
     * Helper to select the next picker randomly
     * Ensures everyone gets a turn eventually.
     */
    function selectNextPicker(io, code) {
        const room = roomStore.getRoom(code);
        if (!room) return;

        const players = room.participants;
        if (!players || players.length === 0) {
            // Everyone left? Reset to lobby.
            roomStore.updateRoom(code, {
                status: 'LOBBY',
                currentPrompt: null,
                judgeId: null,
                currentPickerId: null
            });
            io.to(code).emit('room:changed', roomStore.getRoom(code));
            return;
        }

        // 1. Initialize picker history if not exists
        if (!room.pickerHistory) room.pickerHistory = [];

        // 2. Identify players who haven't picked recently
        let eligible = players.filter(p => !room.pickerHistory.includes(p.userId));

        // 3. If everyone has picked, reset the cycle
        if (eligible.length === 0) {
            room.pickerHistory = [];
            eligible = players;
        }

        // 4. Randomly pick from eligible
        const randomIdx = Math.floor(Math.random() * eligible.length);
        const pickerId = eligible[randomIdx].userId;

        // 5. Update history
        room.pickerHistory.push(pickerId);

        roomStore.updateRoom(code, {
            status: 'PICKING_PROMPT',
            currentPickerId: pickerId,
            currentProviderName: pickerId,
            pickerHistory: room.pickerHistory,
            strokes: [],        // Clear for next round
            currentPrompt: null, // Clear old prompt
            masterpiece: null,   // Clear old masterpiece
            timeLeft: 30         // Set initial picker time for sync
        });

        io.emit('lobby:updated', roomStore.getAllRooms());
        io.to(code).emit('game:round-ended'); // Tell everyone to go back to lobby

        // Setup timer for picker
        const timerKey = `${code}:picker`;
        let timeLeft = 30;

        // Clear old timer if exists
        if (roomTimers.has(timerKey)) clearInterval(roomTimers.get(timerKey));

        io.to(code).emit('game:picker-chosen', { pickerId, timeLeft });

        const timerId = setInterval(() => {
            timeLeft--;
            // FIX: Emit tick!
            io.to(code).emit('picker:timer:tick', { timeLeft });

            if (timeLeft <= 0) {
                clearInterval(timerId);
                roomTimers.delete(timerKey);
                // Picker timed out? Auto-pick or skip?
                console.log(`Picker ${pickerId} timed out. Skipping...`);
                selectNextPicker(io, code);
            }
        }, 1000);
        roomTimers.set(timerKey, timerId);
    }
}
