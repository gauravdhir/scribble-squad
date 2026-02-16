/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChaosCanvasUI } from '../../src/features/drawing/chaos-canvas-renderer.js';
import { RoomAPI } from '../../src/features/lobby/room-api.js';
import { themeState, THEMES } from '../../src/features/theme/theme-state.js';

// Mock dependencies
vi.mock('../../src/lib/dom.js', () => ({
    createElement: (tag, options = {}) => {
        const el = document.createElement(tag);
        if (options.classes) options.classes.forEach(c => el.classList.add(c));
        return el;
    }
}));

vi.mock('../../src/features/drawing/palette-ui.js', () => ({
    createPaletteUI: (callbacks) => {
        const el = document.createElement('div');
        el.classList.add('palette-ui');
        el.callbacks = callbacks;
        return el;
    }
}));

vi.mock('../../src/features/lobby/room-api.js', () => ({
    RoomAPI: {
        finishRoom: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        syncStrokes: vi.fn().mockResolvedValue([]),
        submitMasterpiece: vi.fn(),
        sendStroke: vi.fn(),
        joinRoom: vi.fn(),
        getRoom: vi.fn().mockResolvedValue({ currentTheme: 'space' }),
        setTheme: vi.fn()
    }
}));

vi.mock('../../src/main.js', () => ({
    appState: {
        profileState: { displayName: 'TestUser' }
    }
}));

vi.mock('../../src/features/drawing/canvas-layer-manager.js', () => ({
    CanvasLayerManager: class {
        constructor(container) {
            this.container = container;
        }
        getEngine() {
            const canvas = document.createElement('canvas');
            this.container.appendChild(canvas);
            return {
                canvas,
                drawSegment: vi.fn()
            };
        }
        getRect() {
            return { left: 0, top: 0, width: 1000, height: 1000 };
        }
        getAllCanvases() { return [document.createElement('canvas')]; }
    }
}));

vi.mock('../../src/features/drawing/timer-display.js', () => ({
    TimerDisplay: class {
        getElement() {
            const el = document.createElement('div');
            el.classList.add('timer-display');
            return el;
        }
        updateTime() { }
    }
}));

vi.mock('../../src/features/drawing/eraser-overlay.js', () => ({
    EraserOverlay: class {
        constructor() { }
        setSize() { }
        show() { }
        hide() { }
        updatePosition() { }
    }
}));

vi.mock('../../src/features/ui/confirmation-modal.js', () => ({
    showConfirmationModal: (msg, onConfirm) => onConfirm()
}));

vi.mock('../../src/features/theme/theme-renderer.js', () => ({
    ThemeRenderer: class {
        constructor() { }
        destroy() { }
    }
}));

vi.mock('../../src/features/theme/theme-state.js', () => ({
    themeState: {
        applyRemoteTheme: vi.fn(),
        setTheme: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => { }),
        getTheme: () => 'space'
    },
    THEMES: { SPACE: 'space', FESTIVE: 'festive', NEON: 'neon', OCEAN: 'ocean', LAVA: 'lava' }
}));


describe('Chaos Canvas Renderer', () => {
    let container;
    const mockOnDrawEnd = vi.fn();
    const mockOnLeave = vi.fn();
    const mockOnManagement = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should cover all buttons and interactive elements', () => {
        // Host + Mission Leader
        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'TestUser', mockOnLeave, mockOnManagement);

        container.querySelector('.btn-finish').onclick();
        container.querySelector('.btn-mgmt').onclick({ stopPropagation: () => { } });
        expect(mockOnManagement).toHaveBeenCalled();

        const themeBtn = container.querySelector('.btn-theme');
        themeBtn.onclick({ stopPropagation: () => { } }); // Open
        themeBtn.onclick({ stopPropagation: () => { } }); // Close

        const themeMenu = container.querySelector('.theme-selection-menu');
        const festiveBtn = Array.from(themeMenu.querySelectorAll('button')).find(b => b.textContent.includes('Festive'));
        festiveBtn.onclick({ stopPropagation: () => { } });

        // Guest
        container = createChaosCanvasUI('Prompt', 'ABCD', false, mockOnDrawEnd, 'OtherUser', mockOnLeave);
        container.querySelector('.btn-leave').onclick();
        expect(mockOnLeave).toHaveBeenCalled();
    });

    it('should cover palette callbacks and hover effects', () => {
        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'TestUser', mockOnLeave);
        const palette = container.querySelector('.palette-ui');

        palette.callbacks.onSelectColor('#000');
        palette.callbacks.onSelectEraser();
        palette.callbacks.onBrushSize(10);
        palette.callbacks.onEraserSize(20);

        const finishBtn = container.querySelector('.btn-finish');
        finishBtn.onmouseenter();
        finishBtn.onmouseleave();

        // Guest leave btn hovers
        const guestContainer = createChaosCanvasUI('Prompt', 'ABCD', false, mockOnDrawEnd, 'OtherUser', mockOnLeave);
        const leaveBtn = guestContainer.querySelector('.btn-leave');
        leaveBtn.onmouseenter();
        leaveBtn.onmouseleave();
    });

    it('should cover badge and pending count', () => {
        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'TestUser', mockOnLeave);
        container.updatePendingCount(5);
        expect(container.querySelector('.notification-badge').textContent).toBe('5');
        container.updatePendingCount(0);
        expect(container.querySelector('.notification-badge').style.display).toBe('none');
    });

    it('should cover socket subscription callbacks', async () => {
        const subscriptions = {};
        RoomAPI.subscribe.mockImplementation((event, cb) => {
            subscriptions[event] = cb;
        });

        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'TestUser', mockOnLeave);
        vi.runAllTimers();

        if (subscriptions['draw:incoming']) {
            subscriptions['draw:incoming']({ userId: 'Other', p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 }, color: '#000', isEraser: false, size: 5 });
        }
        if (subscriptions['timer:update']) {
            subscriptions['timer:update']({ timeLeft: 30 });
        }
        if (subscriptions['timer:ended']) {
            subscriptions['timer:ended']();
        }
        if (subscriptions['room:theme-changed']) {
            subscriptions['room:theme-changed']({ themeId: 'festive' });
        }
    });

    it('should handle drawing events', () => {
        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'TestUser', mockOnLeave);
        vi.runAllTimers();
        const canvas = container.querySelector('canvas');

        canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 110 }));

        // Eraser move
        const palette = container.querySelector('.palette-ui');
        palette.callbacks.onSelectEraser();
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 120 }));

        window.dispatchEvent(new MouseEvent('mouseup'));
    });
});
