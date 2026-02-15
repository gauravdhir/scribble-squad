/**
 * Connection UI - Keeps players informed during server startup or disconnection.
 */
import { createElement } from '../../lib/dom.js';

class ConnectionUI {
    constructor() {
        this.overlay = null;
    }

    show(message = 'HANG TIGHT, CREW! WE ARE SETTING THINGS UP...') {
        if (this.overlay) {
            this.updateMessage(message);
            return;
        }

        this.overlay = createElement('div', { classes: ['connection-overlay'] });
        this.overlay.innerHTML = `
            <div class="connection-content">
                <div class="connection-loader">
                    <div class="loader-ring"></div>
                    <div class="loader-rocket">🚀</div>
                </div>
                <h2 class="connection-status-text">${message}</h2>
                <p class="connection-subtext">Establishing contact with Scribble Squad Command...</p>
            </div>
        `;

        document.body.appendChild(this.overlay);
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.add('fade-out');
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
            }, 500);
        }
    }

    updateMessage(message) {
        const textEl = this.overlay?.querySelector('.connection-status-text');
        if (textEl) textEl.textContent = message;
    }
}

export const connectionUI = new ConnectionUI();
