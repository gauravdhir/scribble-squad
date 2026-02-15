/**
 * Drawing Controller - Manages the gameplay (Drawing) and Judging phases.
 */
import { createChaosCanvasUI } from './chaos-canvas-renderer.js';
import { createJudgingUI, spawnFloatingReaction } from '../judging/judging-renderer.js';
import { JudgingState } from '../judging/judging-state.js';
import { RoomAPI } from '../lobby/room-api.js';
import { appState } from '../../main.js';
import { viewManager } from '../../core/view-manager.js';
import { renderDiscoveryLobby } from '../lobby/lobby-controller.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';

import { toast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';



export async function renderChaosCanvas(prompt, providerName, existingRoomData = null) {
    const { roomManager, profileState } = appState;

    let room = existingRoomData;
    if (!room && appState.currentRoomCode) {
        room = await roomManager.getRoom(appState.currentRoomCode);
    }

    if (!room) {
        console.warn('Mission context lost. Returning to base.');
        renderDiscoveryLobby();
        return;
    }

    const isHost = room.hostId === profileState.displayName;
    const finalProviderName = providerName || room?.currentProviderName || 'The Squad';

    const onDrawEnd = (masterpiece) => {
        renderJudgingRoom(masterpiece, appState.currentGameJudgeId);
    };

    const handleLeave = async () => {
        if (await roomManager.leaveRoom(appState.currentRoomCode, profileState.displayName)) {
            appState.currentRoomCode = null;
            renderDiscoveryLobby();
            toast.show('Left mission', 'info');
        }
    };

    const handleGoToLobby = () => {
        console.log('🚀 [DrawingControl] Navigating to Lobby. Code:', appState.currentRoomCode);
        import('../party/room-controller.js')
            .then(m => m.renderRoomLobby(appState.currentRoomCode, null, { forceLobby: true }))
            .catch(err => console.error('❌ Failed to load room-controller module:', err));
    };

    const canvasUI = createChaosCanvasUI(prompt || room?.currentPrompt || 'Draw something cosmic!', appState.currentRoomCode, isHost, onDrawEnd, finalProviderName, handleLeave, handleGoToLobby);

    // Initial state sync (Timer & Badge)
    if (room) {
        if (room.timeLeft !== undefined && canvasUI.timerDisplay) {
            canvasUI.timerDisplay.updateTime(room.timeLeft);
        }
        if (room.pendingQueue && canvasUI.updatePendingCount) {
            canvasUI.updatePendingCount(room.pendingQueue.length);
        }
    }

    viewManager.render(canvasUI, 'drawing');

    // Host Badge & Notification Logic
    let previousPendingCount = room?.pendingQueue?.length || 0;
    const handleRoomChange = (updatedRoom) => {
        const newCount = updatedRoom.pendingQueue?.length || 0;

        if (canvasUI.updatePendingCount) {
            canvasUI.updatePendingCount(newCount);
        }

        if (isHost && newCount > previousPendingCount) {
            toast.show('New recruit knocking! Check Management.', 'info');
        }
        previousPendingCount = newCount;
    };

    RoomAPI.subscribe('room:changed', handleRoomChange);

    // Cleanup
    const observer = new MutationObserver(() => {
        if (!document.contains(canvasUI)) {
            RoomAPI.unsubscribe('room:changed', handleRoomChange);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export async function renderJudgingRoom(masterpiece, judgeId) {
    const { profileState, roomManager } = appState;
    const judgingState = new JudgingState();
    const currentUserId = profileState.displayName;
    const isJudge = judgeId === currentUserId;

    const handleRemoteReaction = (data) => {
        const rect = document.querySelector('.reaction-layer')?.getBoundingClientRect();
        if (!rect) return;
        const pxX = (data.x / 1000) * rect.width + rect.left;
        const pxY = (data.y / 1000) * rect.height + rect.top;
        spawnFloatingReaction(data.type, pxX, pxY);
    };

    const handleRemoteAward = (data) => {
        fireConfetti(data.type);
        toast.show(`Judge has awarded: ${data.type.toUpperCase()} MEDAL! 🏆`, 'info');
    };

    const handleTimerTick = (data) => {
        const timerEl = document.querySelector('.judging-timer-value');
        if (timerEl) {
            timerEl.textContent = data.timeLeft;
            if (data.timeLeft <= 10) {
                timerEl.style.color = '#ff0055'; // Warning color
            }
        }
    };

    RoomAPI.subscribe('judging:incoming-reaction', handleRemoteReaction);
    RoomAPI.subscribe('judging:incoming-award', handleRemoteAward);
    RoomAPI.subscribe('judging:timer:tick', handleTimerTick);

    const roomCode = appState.currentRoomCode;
    const room = await roomManager.getRoom(roomCode);
    const isHost = room ? (room.hostId === currentUserId) : false;

    // Find Judge Name
    let judgeName = judgeId;
    if (room && room.participants) {
        const judge = room.participants.find(p => p.userId === judgeId);
        if (judge) judgeName = judge.userId; // or DisplayName if available
    }

    const handleLeave = async () => {
        if (await roomManager.leaveRoom(appState.currentRoomCode, profileState.displayName)) {
            appState.currentRoomCode = null;
            renderDiscoveryLobby();
            toast.show('Left mission', 'info');
        }
    };

    const handleGoToLobby = () => {
        console.log('🚀 [JudgingControl] Navigating to Lobby. Code:', roomCode);
        import('../party/room-controller.js')
            .then(m => m.renderRoomLobby(roomCode, null, { forceLobby: true }))
            .catch(err => console.error('❌ Failed to load room-controller module:', err));
    };

    const judgingUI = createJudgingUI(masterpiece, judgingState, isJudge, judgeName,
        (type) => RoomAPI.sendAward(roomCode, type),
        (type, x, y) => RoomAPI.sendReaction(roomCode, type, x, y),
        isHost,
        () => RoomAPI.finishRoom(roomCode),
        roomCode,
        handleLeave,
        handleGoToLobby
    );

    viewManager.render(judgingUI, 'judging');

    // Cleanup subscriptions when leaving the view
    const observer = new MutationObserver(() => {
        if (!document.contains(judgingUI)) {
            RoomAPI.unsubscribe('judging:incoming-reaction', handleRemoteReaction);
            RoomAPI.unsubscribe('judging:incoming-award', handleRemoteAward);
            RoomAPI.unsubscribe('judging:timer:tick', handleTimerTick);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
