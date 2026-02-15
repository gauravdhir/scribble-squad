/**
 * Profile Modal Component - Handles user identity setup.
 * Strictly follows the premium glassmorphic mock.
 */
import { createElement } from '../../lib/dom.js';
import { generateSillyName } from './randomizer.js';

/**
 * Creates and appends the Profile Setup Modal to the DOM.
 * @param {Object} state - Instance of ProfileState
 * @param {Function} onComplete - Callback when profile is saved
 */
export function showProfileModal(state, onComplete) {
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    const modal = createElement('div', { classes: ['profile-modal'] });

    modal.innerHTML = `
    <h2 class="modal-title">Scribble Squad</h2>
    <span class="modal-subtitle">Create Your Profile</span>
  `;

    // 1. Input Section
    const inputContainer = createElement('div', { classes: ['input-container'] });
    const inputWrapper = createElement('div', { classes: ['profile-input-wrapper'] });
    const input = createElement('input', {
        classes: ['profile-input'],
        attr: { type: 'text', placeholder: 'Display Name', maxlength: '12' }
    });
    input.value = generateSillyName();

    inputWrapper.appendChild(input);

    // Shuffle Button
    const shuffleBtn = createElement('button', { classes: ['btn-shuffle'] });
    shuffleBtn.innerHTML = `
    <span class="dice-icon">🎲</span>
    <span class="shuffle-text">Shuffle</span>
  `;
    shuffleBtn.onclick = () => {
        input.value = generateSillyName();
        updateNextButtonState();
    };

    inputContainer.appendChild(inputWrapper);
    inputContainer.appendChild(shuffleBtn);
    modal.appendChild(inputContainer);

    // 2. Avatar Selection
    const avatarGrid = createElement('div', { classes: ['avatar-grid'] });
    let selectedAvatarId = 0;

    for (let i = 0; i < 5; i++) {
        const avatar = createElement('div', { classes: ['avatar-option'] });
        if (i === 0) avatar.classList.add('selected');

        // Using DiceBear for variant avatars
        const imgId = i + 1;
        avatar.innerHTML = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=avatar${imgId}" alt="Avatar ${imgId}">`;

        avatar.onclick = () => {
            modal.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            avatar.classList.add('selected');
            selectedAvatarId = i;
        };

        avatarGrid.appendChild(avatar);
    }
    modal.appendChild(avatarGrid);

    // 3. Next Button
    const nextBtn = createElement('button', { classes: ['btn-next'], text: 'NEXT' });

    const updateNextButtonState = () => {
        nextBtn.disabled = !state.validateName(input.value.trim());
    };

    input.oninput = updateNextButtonState;
    updateNextButtonState(); // Initial check

    nextBtn.onclick = () => {
        state.save(input.value.trim(), selectedAvatarId);
        overlay.remove();
        onComplete();
    };

    modal.appendChild(nextBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    input.focus();
}
