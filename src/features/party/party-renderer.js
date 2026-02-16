import { createElement } from '../../lib/dom.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';
import { appState } from '../../main.js';
import { createMemberItem, createRequestItem, createRoomCodeBox } from './lobby-components.js';
import { createPickerUI, createHostControls } from './lobby-controls.js';

export function createRoomLobbyUI(state, isHost, callbacks) {
  const { onApprove, onDeny, onStart, onDelete, onLeave, onPickPrompt, onKick, onMute, onUnmute, onFinish, onAbort, onResume, onUpdateSettings } = callbacks;
  const container = createElement('div', { classes: ['host-lobby-wrapper'] });

  // 1. Room Code Box
  container.appendChild(createRoomCodeBox(state.roomCode));

  // 2. Main Squad Panel
  const squadPanel = createElement('div', { classes: ['squad-panel'] });
  const lobbyTitle = isHost ? 'Host Lobby' : 'Squad Lobby';
  squadPanel.innerHTML = `
    <h1 class="host-lobby-title">
        <span class="room-name-display">${state.roomName || 'Unknown Room'}</span>
        <span class="lobby-subtitle">${lobbyTitle}</span>
    </h1>
  `;

  const currentUserId = appState.profileState.displayName;
  const squadGrid = createElement('div', { classes: ['squad-grid'] });
  if (state.participants) {
    state.participants.forEach(player => {
      const isMe = player.name === currentUserId;
      const isMuted = state.mutedPlayers && state.mutedPlayers.includes(player.id);
      squadGrid.appendChild(createMemberItem(player, isHost && !isMe, onKick, isHost && !isMe, isMuted, onMute, onUnmute));
    });
  }
  squadPanel.appendChild(squadGrid);

  // 4. Action Area
  const actionArea = createElement('div', { classes: ['squad-action-area'] });

  // Ritual UI (Picker)
  if (state.pickerId) {
    const pickerUI = createPickerUI(state, currentUserId, onPickPrompt, onLeave);
    actionArea.appendChild(pickerUI);
  }

  // Management UI (Host Only)
  if (isHost) {
    const hostControls = createHostControls(state, { onStart, onUpdateSettings, onResume, onFinish, onDelete });
    actionArea.appendChild(hostControls);
  } else if (!state.pickerId) {
    // Guest Waiting View
    const guestArea = createElement('div', { classes: ['guest-action-area'] });
    guestArea.innerHTML = `
        <div class="waiting-indicator">
            <span class="pulse-dot"></span>
            <p>Waiting for Host to start the chaos...</p>
        </div>
    `;

    const leaveBtn = createElement('button', {
      classes: ['btn-delete-room', 'btn-leave-room'],
      text: 'LEAVE SQUAD'
    });
    leaveBtn.onclick = () => {
      showConfirmationModal('Leave the squad?', onLeave);
    };
    guestArea.appendChild(leaveBtn);
    actionArea.appendChild(guestArea);
  }

  squadPanel.appendChild(actionArea);
  container.appendChild(squadPanel);

  // 3. Pending Requests Sidebar (Host Only)
  if (isHost) {
    const sidebar = createElement('div', { classes: ['pending-sidebar'] });
    sidebar.innerHTML = `
      <h2 class="sidebar-title">Pending<br>Requests</h2>
      <div class="status-icon-container"><span class="status-icon">🔔</span></div>
    `;

    const pendingList = createElement('div', { classes: ['pending-list'] });
    if (state.pendingRequests) {
      state.pendingRequests.forEach(request => {
        pendingList.appendChild(createRequestItem(request, onApprove, onDeny));
      });
    }

    sidebar.appendChild(pendingList);
    container.appendChild(sidebar);

    // 5. Host "Andon Cord"
    const andonCord = createElement('div', { classes: ['host-andon-cord'] });
    const pullBtn = createElement('button', { classes: ['btn-andon-cord'], text: '🚨' });
    const label = createElement('span', { classes: ['andon-label'], text: 'ABORT MISSION' });

    pullBtn.onclick = () => {
      showConfirmationModal(
        'PULL THE ANDON CORD? This will immediately terminate the mission and return the squad to the Discovery Lobby.',
        () => onAbort()
      );
    };

    andonCord.appendChild(pullBtn);
    andonCord.appendChild(label);
    container.appendChild(andonCord);
  }

  return container;
}
