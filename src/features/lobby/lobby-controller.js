/**
 * Lobby Controller - Manages room discovery and creation views.
 */
import { createLobbyUI } from './lobby-renderer.js';
import { showCreateRoomModal } from './create-room-modal.js';
import { appState, updateHeader } from '../../main.js';
import { viewManager } from '../../core/view-manager.js';
import { renderRoomLobby } from '../party/room-controller.js';
import { toast } from '../ui/toast.js';
import { getFriendlyMessage } from '../../utils/messages.js';



import { hideChat } from '../chat/chat-renderer.js';
import { RoomAPI } from './room-api.js';
import { themeAudio } from '../theme/theme-audio.js';
import { THEMES } from '../theme/theme-state.js';



export async function renderDiscoveryLobby(isIntentionalExit = false) {
    if (isIntentionalExit && appState.currentRoomCode) {
        RoomAPI.leaveSocketRoom(appState.currentRoomCode);
        localStorage.removeItem('ss_current_room');
        appState.currentRoomCode = null;
    }
    hideChat();
    themeAudio.playTheme(THEMES.SPACE);
    const { roomManager, profileState } = appState;
    const userId = profileState.displayName;

    const handleCreateSquad = () => {
        showCreateRoomModal(async (settings) => {
            try {
                const room = await roomManager.createRoom(userId, settings);
                appState.currentRoomCode = room.code;
                renderRoomLobby(room.code);
            } catch (e) {
                toast.show(e.message || getFriendlyMessage('CREATE_ERROR'), 'error');
            }
        });
    };

    const handleKnock = async (roomCode) => {
        const result = await roomManager.knockOnRoom(roomCode, userId);
        if (result.success) {
            appState.currentRoomCode = roomCode;
            toast.show(getFriendlyMessage('JOIN_SUCCESS'), 'info');
            renderRoomLobby(roomCode);
        } else if (result.reason === 'ALREADY_IN_ROOM') {
            const room = await roomManager.getRoom(roomCode);
            if (room) {
                appState.currentRoomCode = roomCode;
                renderRoomLobby(roomCode);
            } else {
                toast.show(getFriendlyMessage(result.reason), 'error');
            }
        } else {
            toast.show(getFriendlyMessage(result.reason), 'error');
        }
    };

    const handleJoinByCode = async (code) => {
        const result = await roomManager.joinRoomByCode(code, userId);
        if (result.success) {
            appState.currentRoomCode = code;
            toast.show(getFriendlyMessage('JOIN_SUCCESS'), 'info');
            renderRoomLobby(code);
        } else {
            toast.show(getFriendlyMessage(result.reason, 'Could not find that room.'), 'error');
        }
    };

    const storedRooms = await roomManager.getActiveRooms();
    const mappedRooms = storedRooms.map(room => ({
        id: room.code,
        name: room.name,
        description: room.description,
        currentPlayers: room.participants.length,
        maxPlayers: room.maxPlayers,
        roomCode: room.code,
        hostId: room.hostId,
        isHost: room.hostId === userId,
        isPrivate: room.isPrivate
    }));

    mappedRooms.sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0));

    const lobbyUI = createLobbyUI(mappedRooms, handleCreateSquad, handleKnock, handleJoinByCode);
    viewManager.render(lobbyUI, 'lobby');
}
