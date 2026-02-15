/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChaosCanvasUI } from '../../src/features/drawing/chaos-canvas-renderer.js';

// Mock dependencies
vi.mock('../../src/lib/dom.js', () => ({
    createElement: (tag, options = {}) => {
        const el = document.createElement(tag);
        if (options.classes) options.classes.forEach(c => el.classList.add(c));
        return el;
    }
}));

vi.mock('../../src/features/drawing/palette-ui.js', () => ({
    createPaletteUI: () => document.createElement('div')
}));

vi.mock('../../src/features/lobby/room-api.js', () => ({
    RoomAPI: {
        finishRoom: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        syncStrokes: vi.fn().mockResolvedValue([]),
        submitMasterpiece: vi.fn(),
        sendStroke: vi.fn()
    }
}));

vi.mock('../../src/main.js', () => ({
    appState: {
        profileState: { displayName: 'TestUser' }
    }
}));

vi.mock('../../src/features/drawing/canvas-layer-manager.js', () => ({
    CanvasLayerManager: class {
        constructor() { }
        getEngine() {
            return {
                canvas: document.createElement('canvas'),
                drawSegment: vi.fn()
            };
        }
        getRect() {
            return { left: 0, top: 0, width: 100, height: 100 };
        }
        getAllCanvases() { return []; }
    }
}));

vi.mock('../../src/features/drawing/timer-display.js', () => ({
    TimerDisplay: class {
        getElement() { return document.createElement('div'); }
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


describe('Chaos Canvas Renderer', () => {
    let container;
    const mockOnDrawEnd = vi.fn();
    const mockOnLeave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    it('should render the canvas container with header and sidebar', () => {
        container = createChaosCanvasUI('Test Prompt', 'ABCD', true, mockOnDrawEnd, 'HostUser', mockOnLeave);
        document.body.appendChild(container);

        expect(container.querySelector('.canvas-header')).toBeTruthy();
        expect(container.querySelector('.canvas-sidebar')).toBeTruthy();
        expect(container.querySelector('.canvas-wrapper')).toBeTruthy();

        // Check Prompt
        expect(container.querySelector('.prompt-text').textContent).toContain('TEST PROMPT');
    });

    it('should render host controls for the host', () => {
        container = createChaosCanvasUI('Prompt', 'ABCD', true, mockOnDrawEnd, 'HostUser', mockOnLeave);
        const finishBtn = container.querySelector('.btn-finish');
        expect(finishBtn).toBeTruthy();
    });

    it('should render guest controls for the guest', () => {
        container = createChaosCanvasUI('Prompt', 'ABCD', false, mockOnDrawEnd, 'HostUser', mockOnLeave);
        const leaveBtn = container.querySelector('.btn-leave');
        expect(leaveBtn).toBeTruthy();
    });
});
