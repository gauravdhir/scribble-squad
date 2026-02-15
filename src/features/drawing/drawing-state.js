/**
 * Drawing State - Manages the collection of all strokes on the canvas.
 */
export class DrawingState {
    constructor() {
        this.strokes = [];
    }

    /**
     * Adds a completed stroke to the permanent state.
     * @param {Object} stroke - { color, points: [{x, y}] }
     */
    addStroke(stroke) {
        this.strokes.push(stroke);
    }

    /**
     * Clears all strokes (Host-only action).
     */
    clear() {
        this.strokes = [];
    }
}
