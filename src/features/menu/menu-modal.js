/**
 * Menu Modal - Simple settings/options menu
 */
import { createElement } from '../../lib/dom.js';

export function showMenuModal(profileState, onClose) {
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    const modal = createElement('div', { classes: ['menu-modal'] });

    modal.innerHTML = `
        <div class="menu-header">
            <h2>Menu</h2>
            <button class="btn-close">✕</button>
        </div>
        <div class="menu-content">
            <div class="menu-item">
                <span class="menu-label">Display Name:</span>
                <span class="menu-value">${profileState.displayName}</span>
            </div>
            <div class="menu-item">
                <span class="menu-label">Avatar:</span>
                <div class="menu-avatar" style="background-image: url('${profileState.getAvatarUrl()}')"></div>
            </div>
            <button class="btn-menu-action btn-edit-profile">Edit Profile</button>
            <button class="btn-menu-action btn-logout">Sign Out</button>
        </div>
    `;

    const closeBtn = modal.querySelector('.btn-close');
    const editBtn = modal.querySelector('.btn-edit-profile');
    const logoutBtn = modal.querySelector('.btn-logout');

    closeBtn.onclick = () => {
        overlay.remove();
        onClose();
    };

    editBtn.onclick = () => {
        overlay.remove();
        // Trigger profile edit (will be handled by main.js)
        onClose('edit');
    };

    logoutBtn.onclick = () => {
        profileState.clear();
        overlay.remove();
        onClose('logout');
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            onClose();
        }
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
