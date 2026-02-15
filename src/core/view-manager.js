/**
 * View Manager - Coordinates the switching of main application views.
 */
import { qs } from '../lib/dom.js';

class ViewManager {
    constructor() {
        this.mainContent = qs('#main-content');
        this.currentView = null;
    }

    /**
     * Renders a component into the main content area.
     * @param {HTMLElement} element - The DOM element to render.
     * @param {string} viewName - Name for tracking (optional).
     */
    render(element, viewName = '') {
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(element);
        this.currentView = viewName;
    }

    /**
     * Checks if a specific view is currently displayed.
     * @param {string} viewName 
     * @returns {boolean}
     */
    isCurrent(viewName) {
        return this.currentView === viewName;
    }
}

export const viewManager = new ViewManager();
