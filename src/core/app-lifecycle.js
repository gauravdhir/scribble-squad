import { RoomAPI } from '../features/lobby/room-api.js';
import { renderDiscoveryLobby } from '../features/lobby/lobby-controller.js';
import { renderRoomLobby } from '../features/party/room-controller.js';
import { renderChaosCanvas, renderJudgingRoom } from '../features/drawing/drawing-controller.js';
import { addMessage, setChatEnabled, setChatMuted } from '../features/chat/chat-state.js';
import { showChat, hideChat } from '../features/chat/chat-renderer.js';
import { viewManager } from './view-manager.js';
import { showProfileModal } from '../features/identity/profile-modal.js';
import { updateHeader } from '../main.js';
import { toast } from '../features/ui/toast.js';
import { appState } from '../main.js';
import { themeAudio } from '../features/theme/theme-audio.js';
import { THEMES } from '../features/theme/theme-state.js';

let lastBootId = null;

export function setupGlobalSubscriptions() {
    console.log('🌍 Setting up global cosmic frequencies...');

    // Detect server restarts and sync
    RoomAPI.subscribe('server:init', ({ bootId }) => {
        if (lastBootId && lastBootId !== bootId) {
            console.log('🚀 Server restart detected. Syncing latest cosmic changes...');
            location.reload();
        }
        lastBootId = bootId;
    });

    // Auto-rejoin functionality
    RoomAPI.subscribe('connect', () => {
        if (appState.currentRoomCode) {
            console.log('📡 Re-establishing squad link...');
            RoomAPI.getRoom(appState.currentRoomCode);
        }
    });

    // Lobby Refresh
    RoomAPI.subscribe('lobby:updated', () => {
        if (viewManager.isCurrent('lobby')) renderDiscoveryLobby();
    });

    // Chat
    RoomAPI.subscribe('chat:incoming', (msg) => addMessage(msg));

    // Room State Changes
    RoomAPI.subscribe('room:changed', (updatedRoom) => {
        if (appState.currentRoomCode === updatedRoom.code) {
            const userId = appState.profileState.displayName;
            const isParticipant = updatedRoom.participants.some(p => p.userId === userId);

            if (updatedRoom.chatEnabled !== undefined) setChatEnabled(updatedRoom.chatEnabled);

            if (updatedRoom.mutedPlayers) {
                const isMeMuted = updatedRoom.mutedPlayers.includes(userId);
                setChatMuted(isMeMuted);
            } else {
                setChatMuted(false);
            }

            if (isParticipant) {
                RoomAPI.joinRoom(updatedRoom.code);
                showChat(updatedRoom.code);
            } else {
                hideChat();
            }

            if (updatedRoom.status === 'LOBBY' || updatedRoom.status === 'PICKING_PROMPT') {
                renderRoomLobby(updatedRoom.code, updatedRoom);
            } else if (updatedRoom.status === 'PLAYING') {
                if (viewManager.isCurrent('room')) {
                    renderRoomLobby(updatedRoom.code, updatedRoom, { forceLobby: true });
                } else if (!viewManager.isCurrent('drawing')) {
                    renderChaosCanvas(updatedRoom.currentPrompt, updatedRoom.currentProviderName);
                }
            } else if (updatedRoom.status === 'JUDGING') {
                if (viewManager.isCurrent('room')) {
                    renderRoomLobby(updatedRoom.code, updatedRoom, { forceLobby: true });
                } else if (!viewManager.isCurrent('judging')) {
                    renderJudgingRoom(updatedRoom.masterpiece);
                }
            }
        }
    });

    // Room Lifecycle Events
    RoomAPI.subscribe('room:aborted', () => handleRoomExit('The mission was aborted by the host.', 'info'));
    RoomAPI.subscribe('room:deleted', () => handleRoomExit('The mission squad has been disbanded.', 'error'));
    RoomAPI.subscribe('room:kicked', ({ userId }) => {
        if (appState.profileState.displayName === userId) handleRoomExit('You have been removed from the squad.', 'error');
    });

    // Toasts (Global)
    RoomAPI.subscribe('toast:error', (msg) => toast.show(msg, 'error'));
    RoomAPI.subscribe('toast:success', (msg) => toast.show(msg, 'success'));
    RoomAPI.subscribe('toast:info', (msg) => toast.show(msg, 'info'));

    // Game Phase Transitions
    RoomAPI.subscribe('game:started', (data) => {
        if (appState.currentRoomCode) {
            appState.currentGameJudgeId = data.judgeId;
            appState.currentPrompt = data.prompt;
            renderChaosCanvas(data.prompt, data.providerName);
        }
    });

    RoomAPI.subscribe('game:judging-started', (data) => {
        if (appState.currentRoomCode) {
            appState.currentGameJudgeId = data.judgeId;
            renderJudgingRoom(data.masterpiece, data.judgeId);
        }
    });

    RoomAPI.subscribe('game:round-ended', () => {
        if (appState.currentRoomCode) renderRoomLobby(appState.currentRoomCode);
    });
}

function handleRoomExit(message, type) {
    hideChat();
    if (appState.currentRoomCode) {
        RoomAPI.leaveSocketRoom(appState.currentRoomCode);
        localStorage.removeItem('ss_current_room'); // Stop auto-rejoin on exit
        toast.show(message, type);
        appState.currentRoomCode = null;
        renderDiscoveryLobby(true);
    }
}

export function initApp() {
    appState.profileState.load();
    setupGlobalSubscriptions();
    themeAudio.playTheme(THEMES.SPACE);

    if (!appState.profileState.displayName) {
        showProfileModal(appState.profileState, () => {
            updateHeader();
            autoRejoin();
        });
    } else {
        updateHeader();
        autoRejoin();
    }
}

function autoRejoin() {
    const savedRoom = localStorage.getItem('ss_current_room');
    if (savedRoom) {
        console.log(`📡 Auto-rejoining mission: ${savedRoom}`);
        renderRoomLobby(savedRoom);
    } else {
        renderDiscoveryLobby();
    }
}

