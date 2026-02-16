/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoomLobbyUI } from '../../src/features/party/party-renderer.js';

// Mock dependencies
vi.mock('../../src/lib/dom.js', () => ({
    createElement: (tag, options = {}) => {
        const el = document.createElement(tag);
        if (options.classes) options.classes.forEach(c => el.classList.add(c));
        if (options.text) el.textContent = options.text;
        return el;
    }
}));

vi.mock('../../src/features/ui/confirmation-modal.js', () => ({
    showConfirmationModal: (msg, onConfirm) => onConfirm()
}));

vi.mock('../../src/main.js', () => ({
    appState: {
        profileState: { displayName: 'Me' }
    }
}));

describe('Party Renderer', () => {
    let state;
    let container;
    const mockCallbacks = {
        onApprove: vi.fn(),
        onDeny: vi.fn(),
        onStart: vi.fn(),
        onDelete: vi.fn(),
        onLeave: vi.fn(),
        onPickPrompt: vi.fn(),
        onKick: vi.fn(),
        onMute: vi.fn(),
        onUnmute: vi.fn(),
        onFinish: vi.fn(),
        onAbort: vi.fn(),
        onResume: vi.fn(),
        onUpdateSettings: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        state = {
            roomCode: 'ABCD',
            roomName: 'Chaos Room',
            participants: [
                { id: '1', name: 'Me', isHost: true },
                { id: '2', name: 'Other', isHost: false }
            ],
            pendingRequests: [
                { id: 'req1', name: 'Newbie' }
            ],
            status: 'LOBBY',
            roundDuration: 60,
            chatEnabled: true,
            isPrivate: false,
            pickerId: null,
            pickerTimeLeft: 30,
            mutedPlayers: []
        };
    });

    it('should render host lobby with all management controls', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);
        document.body.appendChild(container);

        expect(container.querySelector('.room-code-text').textContent).toBe('ABCD');
        expect(container.querySelector('.room-name-display').textContent).toBe('Chaos Room');
        expect(container.querySelectorAll('.member-item').length).toBe(2);

        // Host controls
        expect(container.querySelector('.btn-liftoff')).toBeTruthy();
        expect(container.querySelector('.pending-sidebar')).toBeTruthy();
        expect(container.querySelector('.btn-andon-cord')).toBeTruthy();
    });

    it('should handle start mission with prompt', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);
        const input = container.querySelector('.host-prompt-input');
        input.value = 'Test Prompt';
        input.oninput(); // Trigger validation

        const startBtn = container.querySelector('.btn-liftoff');
        startBtn.click();
        expect(mockCallbacks.onStart).toHaveBeenCalledWith('Test Prompt');
    });

    it('should handle settings updates (duration, chat, privacy)', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);

        // Duration
        const slider = container.querySelector('.duration-slider');
        slider.value = '90';
        slider.onchange({ target: { value: '90' } });
        expect(mockCallbacks.onUpdateSettings).toHaveBeenCalledWith({ roundDuration: 90 });

        // Chat
        const chatBtn = container.querySelectorAll('.btn-state-toggle')[0];
        chatBtn.click();
        expect(mockCallbacks.onUpdateSettings).toHaveBeenCalledWith({ chatEnabled: false });

        // Privacy
        const privacyBtn = container.querySelectorAll('.btn-state-toggle')[1];
        privacyBtn.click();
        expect(mockCallbacks.onUpdateSettings).toHaveBeenCalledWith({ isPrivate: true });
    });

    it('should handle player actions (kick, mute, unmute)', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);

        // Kick 'Other'
        const otherItem = Array.from(container.querySelectorAll('.member-item')).find(el => el.textContent.includes('Other'));
        const kickBtn = otherItem.querySelector('.btn-kick:last-child');
        kickBtn.click();
        expect(mockCallbacks.onKick).toHaveBeenCalledWith('Other');

        // Mute 'Other'
        const muteBtn = otherItem.querySelector('.btn-kick:first-child');
        muteBtn.click();
        expect(mockCallbacks.onMute).toHaveBeenCalledWith('Other');

        // Test Unmute
        state.mutedPlayers = ['2'];
        container = createRoomLobbyUI(state, true, mockCallbacks);
        const muteBtnNew = Array.from(container.querySelectorAll('.member-item'))
            .find(el => el.textContent.includes('Other'))
            .querySelector('.btn-kick:first-child');
        muteBtnNew.click();
        expect(mockCallbacks.onUnmute).toHaveBeenCalledWith('Other');
    });

    it('should handle pending requests (approve, deny)', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);
        const approveBtn = container.querySelector('.btn-approve');
        approveBtn.click();
        expect(mockCallbacks.onApprove).toHaveBeenCalledWith('req1');

        const denyBtn = container.querySelector('.btn-deny');
        denyBtn.click();
        expect(mockCallbacks.onDeny).toHaveBeenCalledWith('req1');
    });

    it('should handle Resume and Finish when status is playing', () => {
        state.status = 'PLAYING';
        container = createRoomLobbyUI(state, true, mockCallbacks);

        const resumeBtn = container.querySelector('.btn-resume-mission');
        resumeBtn.click();
        expect(mockCallbacks.onResume).toHaveBeenCalled();

        const finishBtn = container.querySelector('.btn-finish-round');
        finishBtn.click();
        expect(mockCallbacks.onFinish).toHaveBeenCalled();
    });

    it('should handle Picker view for the chosen one', () => {
        state.pickerId = 'Me';
        container = createRoomLobbyUI(state, false, mockCallbacks);

        expect(container.querySelector('.picker-self-ui')).toBeTruthy();
        const input = container.querySelector('.picker-input');
        input.value = 'Chosen Prompt';

        const submitBtn = container.querySelector('.btn-pick-submit');
        submitBtn.click();
        expect(mockCallbacks.onPickPrompt).toHaveBeenCalledWith('Chosen Prompt');
    });

    it('should handle Picker wait view for others', () => {
        state.pickerId = 'Other';
        container = createRoomLobbyUI(state, false, mockCallbacks);

        expect(container.querySelector('.picker-wait-ui')).toBeTruthy();
        expect(container.querySelector('.picker-wait-ui').textContent).toContain('Other');
    });

    it('should handle delete and leave with confirmation', () => {
        // Delete (Host)
        container = createRoomLobbyUI(state, true, mockCallbacks);
        container.querySelector('.btn-delete-squad').click();
        expect(mockCallbacks.onDelete).toHaveBeenCalled();

        // Leave (Guest)
        container = createRoomLobbyUI(state, false, mockCallbacks);
        container.querySelector('.status-leave').click();
        expect(mockCallbacks.onLeave).toHaveBeenCalled();
    });

    it('should handle abort mission (Andon Cord)', () => {
        container = createRoomLobbyUI(state, true, mockCallbacks);
        container.querySelector('.btn-andon-cord').click();
        expect(mockCallbacks.onAbort).toHaveBeenCalled();
    });
});
