/**
 * Toast Component - Classy, non-blocking notifications.
 */
import { qs } from '../../lib/dom.js';

class ToastManager {
    constructor() {
        this.container = null;
    }

    _ensureContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 4000) {
        this._ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: rgba(10, 14, 39, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid var(--neon-blue);
            padding: 1rem 2rem;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0, 242, 255, 0.2);
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
            min-width: 250px;
        `;

        if (type === 'error') {
            toast.style.borderColor = 'var(--neon-pink)';
            toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255, 0, 230, 0.2)';
        }

        toast.textContent = message;
        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Remove
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
}

export const toast = new ToastManager();
