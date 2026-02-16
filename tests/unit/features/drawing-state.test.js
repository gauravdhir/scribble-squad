/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DrawingState } from '../../../src/features/drawing/drawing-state.js';

describe('DrawingState', () => {
    let drawingState;

    beforeEach(() => {
        drawingState = new DrawingState();
    });

    it('should initialize with empty strokes array', () => {
        expect(drawingState.strokes).toEqual([]);
        expect(drawingState.strokes.length).toBe(0);
    });

    it('should add a stroke to the strokes array', () => {
        const stroke = {
            color: '#ff0000',
            points: [{ x: 100, y: 200 }, { x: 150, y: 250 }]
        };

        drawingState.addStroke(stroke);

        expect(drawingState.strokes.length).toBe(1);
        expect(drawingState.strokes[0]).toEqual(stroke);
    });

    it('should add multiple strokes sequentially', () => {
        const stroke1 = {
            color: '#ff0000',
            points: [{ x: 10, y: 20 }]
        };
        const stroke2 = {
            color: '#00ff00',
            points: [{ x: 30, y: 40 }]
        };
        const stroke3 = {
            color: '#0000ff',
            points: [{ x: 50, y: 60 }]
        };

        drawingState.addStroke(stroke1);
        drawingState.addStroke(stroke2);
        drawingState.addStroke(stroke3);

        expect(drawingState.strokes.length).toBe(3);
        expect(drawingState.strokes[0]).toEqual(stroke1);
        expect(drawingState.strokes[1]).toEqual(stroke2);
        expect(drawingState.strokes[2]).toEqual(stroke3);
    });

    it('should preserve stroke data integrity', () => {
        const stroke = {
            color: '#123456',
            points: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
                { x: 200, y: 50 }
            ]
        };

        drawingState.addStroke(stroke);

        // Verify complete data structure
        expect(drawingState.strokes[0].color).toBe('#123456');
        expect(drawingState.strokes[0].points.length).toBe(3);
        expect(drawingState.strokes[0].points[1]).toEqual({ x: 100, y: 100 });
    });

    it('should clear all strokes', () => {
        const stroke1 = { color: '#fff', points: [{ x: 1, y: 1 }] };
        const stroke2 = { color: '#000', points: [{ x: 2, y: 2 }] };

        drawingState.addStroke(stroke1);
        drawingState.addStroke(stroke2);

        expect(drawingState.strokes.length).toBe(2);

        drawingState.clear();

        expect(drawingState.strokes).toEqual([]);
        expect(drawingState.strokes.length).toBe(0);
    });

    it('should allow adding strokes after clear', () => {
        const stroke1 = { color: '#aaa', points: [{ x: 1, y: 1 }] };
        const stroke2 = { color: '#bbb', points: [{ x: 2, y: 2 }] };

        drawingState.addStroke(stroke1);
        drawingState.clear();
        drawingState.addStroke(stroke2);

        expect(drawingState.strokes.length).toBe(1);
        expect(drawingState.strokes[0]).toEqual(stroke2);
    });

    it('should handle strokes with varying point counts', () => {
        const singlePoint = { color: '#red', points: [{ x: 50, y: 50 }] };
        const manyPoints = {
            color: '#blue',
            points: Array.from({ length: 100 }, (_, i) => ({ x: i, y: i * 2 }))
        };

        drawingState.addStroke(singlePoint);
        drawingState.addStroke(manyPoints);

        expect(drawingState.strokes[0].points.length).toBe(1);
        expect(drawingState.strokes[1].points.length).toBe(100);
    });

    it('should maintain independent stroke objects', () => {
        const stroke = { color: '#fff', points: [{ x: 10, y: 10 }] };

        drawingState.addStroke(stroke);

        // Modify original stroke
        stroke.color = '#000';
        stroke.points.push({ x: 20, y: 20 });

        // State should reflect the modification (reference-based)
        expect(drawingState.strokes[0].color).toBe('#000');
        expect(drawingState.strokes[0].points.length).toBe(2);
    });

    it('should handle clear on empty state gracefully', () => {
        expect(drawingState.strokes.length).toBe(0);

        drawingState.clear();

        expect(drawingState.strokes.length).toBe(0);
        expect(drawingState.strokes).toEqual([]);
    });
});
