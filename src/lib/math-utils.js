/**
 * Math Utilities for Scribble Squad
 */

/**
 * Normalizes a pixel coordinate to a 1000-unit virtual grid.
 * @param {number} value - The pixel value (x or y).
 * @param {number} containerSize - The width or height of the canvas container.
 * @returns {number} The normalized value (0-1000).
 */
export function normalizeCoordinate(value, containerSize) {
    if (containerSize === 0) return 0;
    return (value / containerSize) * 1000;
}

/**
 * Denormalizes a virtual coordinate back to screen pixels.
 * @param {number} value - The normalized value (0-1000).
 * @param {number} containerSize - The width or height of the canvas container.
 * @returns {number} The pixel value.
 */
export function denormalizeCoordinate(value, containerSize) {
    return (value / 1000) * containerSize;
}
