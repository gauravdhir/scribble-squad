/**
 * Header Renderer - Manages the top navigation and profile display.
 */
import { qs } from '../../lib/dom.js';
import { showMenuModal } from '../menu/menu-modal.js';
import { showProfileModal } from './profile-modal.js';
import { themeAudio } from '../theme/theme-audio.js';


/**
 * Updates the header UI with current profile info and name greeting.
 * @param {Object} profileState - The current user profile state.
 * @param {Object} options - Callbacks for header actions.
 */
export function updateHeaderUI(profileState, { onLogoClick, onProfileUpdate, onLogout }) {
    const menuBtn = qs('.btn-menu');
    const logo = qs('.app-logo');

    const name = profileState.displayName || 'Guest';

    menuBtn.innerHTML = `
    <svg class="menu-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
    <span class="menu-label">MENU</span>
    <span class="user-greeting">Hi, ${name}</span>
    <div class="avatar" style="background-image: url('${profileState.getAvatarUrl()}')"></div>
  `;

    // Logo click logic
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.onclick = (e) => {
            e.preventDefault();
            if (onLogoClick) onLogoClick();
        };

        // Create Global Mute Button if it doesn't exist
        let muteBtn = document.querySelector('.btn-mute-global');
        if (!muteBtn) {
            muteBtn = document.createElement('button');
            muteBtn.className = 'btn-mute-global';
            muteBtn.title = 'Toggle Background Music';
            logo.after(muteBtn);
        }

        const updateMuteUI = () => {
            const isMuted = themeAudio.audio.muted;
            muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
            muteBtn.classList.toggle('muted', isMuted);
        };

        muteBtn.onclick = (e) => {
            e.stopPropagation();
            themeAudio.toggleMute();
            updateMuteUI();
        };

        // Initial UI state
        updateMuteUI();
    }


    // Menu click logic
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        showMenuModal(profileState, (action) => {
            if (action === 'logout') {
                if (onLogout) onLogout();
                else location.reload();
            } else if (action === 'edit') {
                showProfileModal(profileState, () => {
                    if (onProfileUpdate) onProfileUpdate();
                });
            }
        });
    };

    // Avatar click also opens menu
    const avatar = menuBtn.querySelector('.avatar');
    if (avatar) {
        avatar.onclick = (e) => {
            e.stopPropagation();
            menuBtn.click();
        };
    }
}
