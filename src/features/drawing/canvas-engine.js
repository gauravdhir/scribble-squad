/**
 * Canvas Engine - Low-level HTML5 Canvas operations.
 * Handles high-DPI scaling and efficient stroke rendering.
 */
export class CanvasEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.setupPrecision();
    }

    /**
     * Scales the canvas for internal consistency and high-DPI displays.
     * We use a fixed internal resolution of 2000x2000 to ensure stroke
     * thickness and coordinates are identical across all devices.
     */
    setupPrecision() {
        // High fixed resolution for crispness and consistency
        this.canvas.width = 2000;
        this.canvas.height = 2000;

        // We don't use this.ctx.scale(this.dpr) here because we want
        // absolute consistency across devices regardless of their DPR.
        // The CSS will handle stretching the 2000px canvas to fit the screen.
    }

    /**
     * Draws a line segment between two points.
     * Coordinates (p1, p2) are in 0-1000 range.
     */
    drawSegment(p1, p2, color, containerWidth, containerHeight, isEraser = false, size = null) {
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        this.ctx.strokeStyle = color;

        // Use provided size, or fall back to defaults
        // Since the canvas is fixed at 2000px width, size 10 is 0.5% of width.
        const finalSize = size || (isEraser ? 30 : 5);
        this.ctx.lineWidth = finalSize;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Map 0-1000 coordinates to our fixed 2000x2000 internal resolution
        this.ctx.moveTo(
            (p1.x / 1000) * 2000,
            (p1.y / 1000) * 2000
        );
        this.ctx.lineTo(
            (p2.x / 1000) * 2000,
            (p2.y / 1000) * 2000
        );
        this.ctx.stroke();
    }

    /**
     * Draws a complete stroke on the canvas.
     * @param {Object} stroke - { color, points: [{x, y}] }
     * @param {number} containerWidth
     * @param {number} containerHeight
     */
    drawStroke(stroke, containerWidth, containerHeight) {
        if (stroke.points.length < 2) return;

        for (let i = 1; i < stroke.points.length; i++) {
            this.drawSegment(
                stroke.points[i - 1],
                stroke.points[i],
                stroke.color,
                containerWidth,
                containerHeight
            );
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
