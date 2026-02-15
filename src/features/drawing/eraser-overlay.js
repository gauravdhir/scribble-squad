import { createElement } from '../../lib/dom.js';

export class EraserOverlay {
    constructor(container) {
        this.container = container;
        this.element = createElement('div', { classes: ['eraser-shadow'] });
        this.container.appendChild(this.element);
        this.currentSize = 30;
        this.isVisible = false;
        
        // Initial style setup
        this.element.style.position = 'absolute';
        this.element.style.pointerEvents = 'none';
        this.element.style.borderRadius = '50%';
        this.element.style.border = '2px solid rgba(0,0,0,0.5)';
        this.element.style.backgroundColor = 'rgba(255,255,255,0.3)';
        this.element.style.transform = 'translate(-50%, -50%)'; // Center on cursor
        this.element.style.transition = 'width 0.2s ease, height 0.2s ease'; // Smooth size change
        this.element.style.zIndex = '1000';
        this.hide();
    }

    setSize(size) {
       this.currentSize = size;
       // Only update dimensions if visible to avoid layout thrashing, 
       // but strictly speaking we can just update it.
       this._updateDimensions();
    }

    _updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        // size is relative to 1000x1000 coordinate system usually? 
        // Wait, the renderer logic was: const displaySize = (currentEraserSize / 2000) * rect.width;
        // Let's replicate that logic or accept raw pixels? 
        // In the original code: (currentEraserSize / 2000) * rect.width 
        // We need the container rect to calculate this.
        
        if (rect.width > 0) {
            const displaySize = (this.currentSize / 2000) * rect.width;
            this.element.style.width = `${displaySize}px`;
            this.element.style.height = `${displaySize}px`;
        }
    }

    updatePosition(x, y) {
        if (!this.isVisible) return;
        
        // Use requestAnimationFrame behavior implicitly by just setting styles
        // Browser handles compositing. 
        // We might want to throttle this if it's too frequent, but mousemove is usually fine.
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        
        // Dynamic resizing based on container size (responsiveness)
        this._updateDimensions();
    }

    show() {
        this.isVisible = true;
        this.element.style.display = 'block';
        this._updateDimensions();
    }

    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
    }
}
