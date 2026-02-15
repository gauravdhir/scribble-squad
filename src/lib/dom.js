/**
 * Shared DOM Utilities
 */

/**
 * Creates an element with optional classes and attributes.
 * @param {string} tag - HTML tag name.
 * @param {Object} options - Configuration options.
 * @param {string[]} options.classes - CSS classes.
 * @param {Object} options.attr - Attributes.
 * @param {string} options.text - Inner text.
 * @param {string} options.html - Inner HTML.
 * @returns {HTMLElement}
 */
export function createElement(tag, { classes = [], attr = {}, text, html } = {}) {
    const el = document.createElement(tag);
    classes.forEach(c => el.classList.add(c));
    Object.entries(attr).forEach(([key, val]) => el.setAttribute(key, val));
    if (text !== undefined) el.textContent = text;
    if (html !== undefined) el.innerHTML = html;
    return el;
}

/**
 * Selects an element or throws an error if not found.
 * @param {string} selector - CSS selector.
 * @returns {HTMLElement}
 */
export function qs(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return el;
}
