import { createElement } from '../../lib/dom.js';
import { CanvasEngine } from './canvas-engine.js';

export class CanvasLayerManager {
    constructor(container) {
        this.container = container;
        this.engines = new Map(); // userId -> CanvasEngine
        this.layers = new Map();  // userId -> HTMLCanvasElement
    }

    getEngine(userId, currentUserId) {
        if (this.engines.has(userId)) {
            return this.engines.get(userId);
        }

        const layerCanvas = createElement('canvas', { classes: ['chaos-canvas-layer'] });

        // Style for absolute positioning overlay
        layerCanvas.style.position = 'absolute';
        layerCanvas.style.top = '0';
        layerCanvas.style.left = '0';
        layerCanvas.style.width = '100%';
        layerCanvas.style.height = '100%';

        // Only allow pointer events for the current user's layer
        layerCanvas.style.pointerEvents = userId === currentUserId ? 'auto' : 'none';

        this.container.appendChild(layerCanvas);
        this.layers.set(userId, layerCanvas);

        const engine = new CanvasEngine(layerCanvas);
        this.engines.set(userId, engine);

        return engine;
    }

    getRect() {
        return this.container.getBoundingClientRect();
    }

    getAllCanvases() {
        return Array.from(this.layers.values());
    }

    clear() {
        this.engines.clear();
        this.layers.clear();
        this.container.innerHTML = ''; // Remove all DOM elements
    }
}
