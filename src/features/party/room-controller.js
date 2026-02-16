/**
 * Room Controller - Manages the pre-game lobby/party view.
 */
import { createRoomLobbyUI } from './party-renderer.js';
import { PartyState } from './party-state.js';
import { appState } from '../../main.js';
import { viewManager } from '../../core/view-manager.js';
import { renderDiscoveryLobby } from '../lobby/lobby-controller.js';
import { RoomAPI } from '../lobby/room-api.js';
import { toast } from '../ui/toast.js';
import { getFriendlyMessage } from '../../utils/messages.js';
import { themeAudio } from '../theme/theme-audio.js';
import { showChat } from '../chat/chat-renderer.js';


export async function renderRoomLobby(roomCode, existingRoomData = null, options = {}) {
    const { forceLobby = false } = options;
    const { roomManager, profileState } = appState;

    let room = existingRoomData;
    if (!room) {
        room = await roomManager.getRoom(roomCode);
    }

    if (!room) {
        appState.currentRoomCode = null;
        renderDiscoveryLobby();
        return;
    }

    appState.currentRoomCode = roomCode;
    localStorage.setItem('ss_current_room', roomCode);

    // SYNC AUDIO
    if (room.currentTheme) {
        themeAudio.playTheme(room.currentTheme);
    } else {
        themeAudio.playTheme(); // Default SPACE/game-background
    }


    // REDIRECT IF GAME IN PROGRESS (Bypass if forceLobby is true)
    if (room.status === 'PLAYING' && !forceLobby) {
        import('../drawing/drawing-controller.js').then(m => {
            m.renderChaosCanvas(room.currentPrompt, room.currentProviderName, room);
        });
        return;
    } else if (room.status === 'JUDGING' && !forceLobby) {
        import('../drawing/drawing-controller.js').then(m => {
            m.renderJudgingRoom(room.masterpiece, room.judgeId);
        });
        return;
    }

    const userId = profileState.displayName;
    const isHost = room.hostId === userId;

    const partyState = new PartyState(roomCode);
    partyState.roomName = room.name;
    partyState.pickerId = room.currentPickerId;
    partyState.status = room.status;

    // Ensure Chat Overlay is Visible
    if (appState.profileState.displayName) {
        showChat(roomCode);
    }
    partyState.roundDuration = room.roundDuration || 60;
    partyState.chatEnabled = room.chatEnabled;
    partyState.participants = room.participants.map(p => ({
        id: p.userId,
        name: p.userId,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${p.userId}`,
        isHost: p.userId === room.hostId
    }));
    partyState.pendingRequests = room.pendingQueue?.map(p => ({
        id: p.userId,
        name: p.userId
    })) || [];

    const handlePickerChosen = (data) => {
        if (data.pickerId) {
            partyState.pickerId = data.pickerId;
            partyState.pickerTimeLeft = data.timeLeft;
            renderRoomLobby(roomCode, null, { forceLobby });
        }
    };

    const handlePickerTick = (data) => {
        const timerEl = document.querySelector('.picker-timer-value');
        if (timerEl) {
            timerEl.textContent = data.timeLeft;
        }
        partyState.pickerTimeLeft = data.timeLeft;
    };

    const handleRoundEnded = () => {
        renderRoomLobby(roomCode, null, { forceLobby });
    };

    RoomAPI.subscribe('game:picker-chosen', handlePickerChosen);
    RoomAPI.subscribe('picker:timer:tick', handlePickerTick);
    RoomAPI.subscribe('game:round-ended', handleRoundEnded);

    partyState.mutedPlayers = room.mutedPlayers || [];
    partyState.isPrivate = room.isPrivate || false;

    const callbacks = {
        onApprove: async (uid) => {
            const result = await roomManager.approvePlayer(roomCode, uid);
            if (result.success) {
                renderRoomLobby(roomCode, null, { forceLobby });
                toast.show(`Approved ${uid}`, 'success');
            }
        },
        onDeny: async (uid) => {
            const result = await roomManager.rejectPlayer(roomCode, uid);
            if (result.success) {
                renderRoomLobby(roomCode, null, { forceLobby });
                toast.show(`Rejected ${uid}`, 'info');
            }
        },
        onKick: async (uid) => {
            RoomAPI.kickPlayer(roomCode, uid);
        },
        onMute: (uid) => {
            RoomAPI.mutePlayer(roomCode, uid);
        },
        onUnmute: (uid) => {
            RoomAPI.unmutePlayer(roomCode, uid);
        },
        onStart: async (prompt) => {
            try {
                await roomManager.startRoom(roomCode, prompt);
            } catch (e) {
                toast.show('Failed to start mission', 'error');
            }
        },
        onPickPrompt: async (prompt) => {
            const success = await RoomAPI.setPrompt(roomCode, prompt, userId);
            if (!success) {
                toast.show('Failed to submit prompt', 'error');
            }
        },
        onDelete: async () => {
            if (await roomManager.deleteRoom(roomCode)) {
                appState.currentRoomCode = null;
                renderDiscoveryLobby(true);
                toast.show('Room deleted', 'info');
            }
        },
        onLeave: async () => {
            if (await roomManager.leaveRoom(roomCode, userId)) {
                appState.currentRoomCode = null;
                renderDiscoveryLobby(true);
                toast.show('Left room', 'info');
            }
        },
        onFinish: () => {
            RoomAPI.finishRoom(roomCode);
        },
        onAbort: () => {
            RoomAPI.abortRoom(roomCode);
        },
        onResume: async () => {
            const roomData = await roomManager.getRoom(roomCode);
            if (roomData.status === 'JUDGING' && roomData.masterpiece) {
                import('../drawing/drawing-controller.js').then(m => {
                    m.renderJudgingRoom(roomData.masterpiece, roomData.judgeId);
                });
            } else if (roomData.status === 'PLAYING') {
                import('../drawing/drawing-controller.js').then(m => {
                    m.renderChaosCanvas(roomData.currentPrompt, roomData.currentProviderName, roomData);
                });
            } else {
                toast.show('No active mission to return to.', 'info');
            }
        },
        onUpdateSettings: (updates) => {
            RoomAPI.updateRoom(roomCode, updates);
            // Ensure we stay in lobby view if we are currently there
            renderRoomLobby(roomCode, null, { forceLobby: true });
        }
    };

    const lobbyUI = createRoomLobbyUI(partyState, isHost, callbacks);
    viewManager.render(lobbyUI, 'room');

    // Cleanup subscriptions
    const observer = new MutationObserver(() => {
        if (!document.contains(lobbyUI)) {
            RoomAPI.unsubscribe('game:picker-chosen', handlePickerChosen);
            RoomAPI.unsubscribe('picker:timer:tick', handlePickerTick);
            RoomAPI.unsubscribe('game:round-ended', handleRoundEnded);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
