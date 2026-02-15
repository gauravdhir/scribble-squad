/**
 * Create Room Modal Component
 * Displays the "Create Your Squad" modal with configurable settings.
 */
import { createElement } from '../../lib/dom.js';

/**
 * Shows the Create Room modal
 * @param {Function} onConfirm - Callback with settings object { name, maxPlayers, isPrivate }
 * @param {Function} onCancel - Callback when cancelled
 */
export function showCreateRoomModal(onConfirm, onCancel) {
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    const modal = createElement('div', { classes: ['create-room-modal'] });

    modal.innerHTML = `
        <div class="create-modal-header">
            <h2 class="create-modal-title">Create Your Squad <span class="edit-icon">✏️</span></h2>
        </div>

        <div class="input-group">
            <label class="input-label">Room Name</label>
            <input type="text" class="neon-input" id="roomNameInput" placeholder="Enter a cool name..." maxlength="50">
        </div>

        <div class="input-group">
            <label class="input-label">Short Description</label>
            <input type="text" class="neon-input" id="roomDescInput" placeholder="What's this squad about?" maxlength="50">
        </div>

        <div class="input-group">
            <div class="input-label">
                <span>Max Players</span>
                <span id="maxPlayersValue" style="color: #00f2ff">8</span>
            </div>
            <div class="slider-container">
                <input type="range" min="2" max="8" value="8" class="neon-slider" id="maxPlayersInput">
            </div>
        </div>

        <div class="input-group">
            <div class="toggle-wrapper">
                <span class="toggle-label-text">Public Room</span>
                <label class="toggle-switch-label">
                    <input type="checkbox" id="privacyToggle" class="toggle-input">
                    <div class="toggle-switch">
                        <span class="slider-round"></span>
                    </div>
                </label>
                <span class="toggle-label-text">Private (Invite Only)</span>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-primary-neon" id="launchBtn">Launch Mission</button>
            <button class="btn-cancel" id="cancelBtn">Cancel</button>
        </div>
    `;

    // Event Bindings
    const roomNameInput = modal.querySelector('#roomNameInput');
    const maxPlayersInput = modal.querySelector('#maxPlayersInput');
    const maxPlayersValue = modal.querySelector('#maxPlayersValue');
    const privacyToggle = modal.querySelector('#privacyToggle');
    const launchBtn = modal.querySelector('#launchBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    // Focus input on load
    setTimeout(() => roomNameInput.focus(), 100);

    // Update slider value display
    maxPlayersInput.oninput = (e) => {
        maxPlayersValue.textContent = e.target.value;
    };

    // Close on Cancel
    cancelBtn.onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };

    // Close on Launch
    launchBtn.onclick = () => {
        const name = roomNameInput.value.trim() || 'My Squad';
        const description = modal.querySelector('#roomDescInput').value.trim() || '';
        const maxPlayers = parseInt(maxPlayersInput.value, 10);
        const isPrivate = privacyToggle.checked;

        overlay.remove();
        onConfirm({
            name,
            description,
            maxPlayers,
            isPrivate
        });
    };

    // Close on overlay click (optional, but good UX)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            cancelBtn.click();
        }
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
