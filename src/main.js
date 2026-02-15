/**
 * Main Entry Point - Scribble Squad
 * Coordinates initialization and main application routing.
 */
import { ProfileState } from './features/identity/profile-state.js';
import { updateHeaderUI } from './features/identity/header-renderer.js';
import { RoomManager } from './features/lobby/room-manager.js';
import { renderDiscoveryLobby } from './features/lobby/lobby-controller.js';
import { initApp } from './core/app-lifecycle.js';

const profileState = new ProfileState();
const roomManager = new RoomManager();

// Global App State (to be shared)
export const appState = {
    currentRoomCode: null,
    currentGameJudgeId: null,
    currentPrompt: null,
    profileState,
    roomManager
};

/**
 * Updates the app header with current profile and callbacks.
 */
export function updateHeader() {
    updateHeaderUI(profileState, {
        onLogoClick: () => renderDiscoveryLobby(),
        onProfileUpdate: () => {
            updateHeader();
            renderDiscoveryLobby();
        },
        onLogout: () => location.reload()
    });
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
