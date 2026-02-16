/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasLayerManager } from '../../../../src/features/drawing/canvas-layer-manager.js';

// Mock CanvasEngine - Must use factory function for vi.mock
vi.mock('../../../../src/features/drawing/canvas-engine.js', () => ({
    CanvasEngine: class {
        constructor(canvas) {
            this.canvas = canvas;
            this.clear = () => { };
            this.drawStroke = () => { };
        }
    }
}));

const { CanvasEngine } = await import('../../../../src/features/drawing/canvas-engine.js');

describe('CanvasLayerManager', () => {
    let container;
    let layerManager;

    beforeEach(() => {
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);

        layerManager = new CanvasLayerManager(container);
        vi.clearAllMocks();
    });

    it('should initialize with empty engines and layers', () => {
        expect(layerManager.engines.size).toBe(0);
        expect(layerManager.layers.size).toBe(0);
    });

    it('should store container reference', () => {
        expect(layerManager.container).toBe(container);
    });

    it('should create new engine for first-time user', () => {
        const engine = layerManager.getEngine('user1', 'user1');

        expect(engine).toBeDefined();
        expect(layerManager.engines.has('user1')).toBe(true);
        expect(layerManager.layers.has('user1')).toBe(true);
    });

    it('should return existing engine for known user', () => {
        const engine1 = layerManager.getEngine('user1', 'user1');
        const engine2 = layerManager.getEngine('user1', 'user1');

        expect(engine1).toBe(engine2);
        // Should not create new layers/engines
        expect(layerManager.engines.size).toBe(1);
        expect(layerManager.layers.size).toBe(1);
    });

    it('should create canvas with correct CSS classes', () => {
        layerManager.getEngine('user1', 'user1');

        const canvas = layerManager.layers.get('user1');
        expect(canvas.classList.contains('chaos-canvas-layer')).toBe(true);
    });

    it('should position canvas absolutely', () => {
        layerManager.getEngine('user1', 'user1');

        const canvas = layerManager.layers.get('user1');
        expect(canvas.style.position).toBe('absolute');
        expect(canvas.style.top).toBe('0px');
        expect(canvas.style.left).toBe('0px');
        expect(canvas.style.width).toBe('100%');
        expect(canvas.style.height).toBe('100%');
    });

    it('should enable pointer events for current user layer', () => {
        layerManager.getEngine('currentUser', 'currentUser');

        const canvas = layerManager.layers.get('currentUser');
        expect(canvas.style.pointerEvents).toBe('auto');
    });

    it('should disable pointer events for other user layers', () => {
        layerManager.getEngine('otherUser', 'currentUser');

        const canvas = layerManager.layers.get('otherUser');
        expect(canvas.style.pointerEvents).toBe('none');
    });

    it('should append canvas to container', () => {
        layerManager.getEngine('user1', 'user1');

        expect(container.children.length).toBe(1);
        expect(container.children[0]).toBe(layerManager.layers.get('user1'));
    });

    it('should create multiple independent layers', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.getEngine('user2', 'currentUser');
        layerManager.getEngine('user3', 'currentUser');

        expect(layerManager.engines.size).toBe(3);
        expect(layerManager.layers.size).toBe(3);
        expect(container.children.length).toBe(3);
    });

    it('should return container bounding rect method', () => {
        const rect = layerManager.getRect();

        expect(rect).toBeDefined();
        // Note: In jsdom, dimensions are 0, but the method should work
        expect(typeof rect.width).toBe('number');
        expect(typeof rect.height).toBe('number');
    });

    it('should return all canvas elements', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.getEngine('user2', 'currentUser');

        const canvases = layerManager.getAllCanvases();

        expect(canvases).toHaveLength(2);
        expect(canvases[0]).toBeInstanceOf(HTMLCanvasElement);
        expect(canvases[1]).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should return empty array when no canvases exist', () => {
        const canvases = layerManager.getAllCanvases();

        expect(canvases).toEqual([]);
    });

    it('should clear all engines and layers', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.getEngine('user2', 'currentUser');

        layerManager.clear();

        expect(layerManager.engines.size).toBe(0);
        expect(layerManager.layers.size).toBe(0);
        expect(container.innerHTML).toBe('');
    });

    it('should remove DOM elements on clear', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.getEngine('user2', 'currentUser');

        expect(container.children.length).toBe(2);

        layerManager.clear();

        expect(container.children.length).toBe(0);
    });

    it('should allow creating new layers after clear', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.clear();
        layerManager.getEngine('user2', 'currentUser');

        expect(layerManager.engines.size).toBe(1);
        expect(layerManager.layers.has('user2')).toBe(true);
        expect(layerManager.layers.has('user1')).toBe(false);
    });

    it('should handle clear on empty manager gracefully', () => {
        layerManager.clear();

        expect(layerManager.engines.size).toBe(0);
        expect(layerManager.layers.size).toBe(0);
    });

    it('should differentiate pointer events based on currentUserId', () => {
        const currentUserId = 'alice';

        layerManager.getEngine('alice', currentUserId);
        layerManager.getEngine('bob', currentUserId);
        layerManager.getEngine('charlie', currentUserId);

        const aliceCanvas = layerManager.layers.get('alice');
        const bobCanvas = layerManager.layers.get('bob');
        const charlieCanvas = layerManager.layers.get('charlie');

        expect(aliceCanvas.style.pointerEvents).toBe('auto');
        expect(bobCanvas.style.pointerEvents).toBe('none');
        expect(charlieCanvas.style.pointerEvents).toBe('none');
    });

    it('should maintain layer order in container', () => {
        layerManager.getEngine('user1', 'currentUser');
        layerManager.getEngine('user2', 'currentUser');
        layerManager.getEngine('user3', 'currentUser');

        expect(container.children[0]).toBe(layerManager.layers.get('user1'));
        expect(container.children[1]).toBe(layerManager.layers.get('user2'));
        expect(container.children[2]).toBe(layerManager.layers.get('user3'));
    });

    it('should create CanvasEngine instance for each layer', () => {
        layerManager.getEngine('user1', 'user1');

        const canvas = layerManager.layers.get('user1');
        const engine = layerManager.engines.get('user1');

        expect(engine).toBeDefined();
        expect(engine.canvas).toBe(canvas);
    });
});
