import { createElement } from '../../lib/dom.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';

export function createRoomCodeBox(roomCode) {
    const codeContainer = createElement('div', { classes: ['room-code-container'] });
    codeContainer.innerHTML = `
    <span class="room-code-label">ROOM CODE:</span>
    <div class="room-code-box">
      <span class="room-code-text">${roomCode}</span>
    </div>
  `;
    return codeContainer;
}

export function createMemberItem(player, canKick, onKick, canMute, isMuted, onMute, onUnmute) {
    const item = createElement('div', { classes: ['member-item'] });

    const avatar = createElement('div', { classes: ['avatar-large'] });
    avatar.innerHTML = `<img src="${player.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + player.name}" alt="${player.name}">`;

    item.appendChild(avatar);
    const nameWrapper = createElement('div', { classes: ['member-info'] });
    nameWrapper.appendChild(createElement('span', { text: player.name, classes: ['member-name'] }));

    if (player.isHost) {
        const hostBadge = createElement('span', { text: 'HOST', classes: ['badge-host'] });
        nameWrapper.appendChild(hostBadge);
    }
    if (isMuted) {
        const muteBadge = createElement('span', { text: 'MUTED', classes: ['badge-host'] });
        muteBadge.style.backgroundColor = '#ff0000';
        nameWrapper.appendChild(muteBadge);
    }
    item.appendChild(nameWrapper);

    const actions = createElement('div', { classes: ['member-actions'] });
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.alignItems = 'center';

    if (canMute) {
        const muteBtn = createElement('button', { classes: ['btn-kick'], text: isMuted ? '🔊' : '🔇' });
        muteBtn.title = isMuted ? 'Unmute Player' : 'Mute Player';
        muteBtn.style.position = 'static';
        muteBtn.onclick = () => {
            if (isMuted) onUnmute(player.name);
            else onMute(player.name);
        };
        actions.appendChild(muteBtn);
    }

    if (canKick) {
        const kickBtn = createElement('button', { classes: ['btn-kick'], text: '✕' });
        kickBtn.title = 'Remove from Squad';
        kickBtn.style.position = 'static';
        kickBtn.onclick = () => {
            showConfirmationModal(
                `Are you sure you want to remove ${player.name} from the squad?`,
                () => onKick(player.name)
            );
        };
        actions.appendChild(kickBtn);
    }

    if (actions.children.length > 0) item.appendChild(actions);

    return item;
}

export function createRequestItem(request, onApprove, onDeny) {
    const item = createElement('div', { classes: ['request-item'] });

    const user = createElement('div', { classes: ['request-user'] });
    const avatar = createElement('div', { classes: ['avatar-small'] });
    avatar.innerHTML = `<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}" style="width:100%; height:100%; border-radius:50%">`;

    user.appendChild(avatar);
    user.appendChild(createElement('span', { text: request.name, classes: ['request-name'] }));

    const actions = createElement('div', { classes: ['action-btns'] });

    const approveBtn = createElement('button', { classes: ['btn-action', 'btn-approve'], text: '✓' });
    approveBtn.onclick = () => onApprove(request.id);

    const denyBtn = createElement('button', { classes: ['btn-action', 'btn-deny'], text: '✕' });
    denyBtn.onclick = () => onDeny(request.id);

    actions.appendChild(approveBtn);
    actions.appendChild(denyBtn);

    item.appendChild(user);
    item.appendChild(actions);

    return item;
}
