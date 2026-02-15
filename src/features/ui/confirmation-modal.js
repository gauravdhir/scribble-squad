/**
 * Confirmation Modal
 * A reusable modal for confirming dangerous actions.
 */
import { createElement } from '../../lib/dom.js';

/**
 * Shows a confirmation modal
 * @param {string} message - The message to display
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 */
export function showConfirmationModal(message, onConfirm, onCancel) {
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    const modal = createElement('div', { classes: ['confirmation-modal'] });

    modal.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon">⚠️</div>
            <p class="confirm-message">${message}</p>
        </div>
        <div class="confirm-actions">
            <button class="btn-cancel" id="confirmCancelBtn">Cancel</button>
            <button class="btn-danger" id="confirmYesBtn">Yes, do it</button>
        </div>
    `;

    // Event Bindings
    const cancelBtn = modal.querySelector('#confirmCancelBtn');
    const yesBtn = modal.querySelector('#confirmYesBtn');

    const close = () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 300);
    };

    cancelBtn.onclick = () => {
        close();
        if (onCancel) onCancel();
    };

    yesBtn.onclick = () => {
        close();
        onConfirm();
    };

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            cancelBtn.click();
        }
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
