/**
 * Party Renderer - Responsible for creating the Host Lobby UI.
 * Strictly follows the premium iPad mock for Scribble Squad.
 */
import { createElement } from '../../lib/dom.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';
import { appState } from '../../main.js';


export function createRoomLobbyUI(state, isHost, { onApprove, onDeny, onStart, onDelete, onLeave, onPickPrompt, onKick, onMute, onUnmute, onFinish, onAbort, onResume, onUpdateSettings }) {
  const container = createElement('div', { classes: ['host-lobby-wrapper'] });

  // 1. Room Code Box
  const codeContainer = createElement('div', { classes: ['room-code-container'] });
  codeContainer.innerHTML = `
    <span class="room-code-label">ROOM CODE:</span>
    <div class="room-code-box">
      <span class="room-code-text">${state.roomCode}</span>
    </div>
  `;
  container.appendChild(codeContainer);

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
  state.participants.forEach(player => {
    const isMe = player.name === currentUserId;
    const isMuted = state.mutedPlayers && state.mutedPlayers.includes(player.id);
    squadGrid.appendChild(createMemberItem(player, isHost && !isMe, onKick, isHost && !isMe, isMuted, onMute, onUnmute));
  });

  squadPanel.appendChild(squadGrid);

  // 4. Action Area
  const actionArea = createElement('div', { classes: ['squad-action-area'] });
  const isPicker = state.pickerId === currentUserId;

  // Ritual UI (if any)
  if (state.pickerId) {
    const ritualContainer = createElement('div', { classes: ['picker-ritual-container'] });

    if (isPicker) {
      ritualContainer.innerHTML = `
        <div class="picker-self-ui">
          <label class="host-prompt-label">YOU ARE THE CHOSEN ONE! PROVIDE A PROMPT:</label>
          <div class="picker-input-group">
            <input type="text" class="host-prompt-input picker-input" placeholder="Enter next mission prompt...">
            <div class="picker-timer">
              <span class="picker-timer-value">${state.pickerTimeLeft}</span>s
            </div>
          </div>
          <div class="picker-actions">
              <button class="btn-next btn-liftoff btn-pick-submit">LAUNCH ROUND</button>
              <button class="btn-text btn-leave-picker" style="margin-top:10px; opacity:0.7">🚪 Leave Squad</button>
          </div>
        </div>
      `;
      const input = ritualContainer.querySelector('.picker-input');
      const submitBtn = ritualContainer.querySelector('.btn-pick-submit');
      const leaveBtn = ritualContainer.querySelector('.btn-leave-picker');

      submitBtn.onclick = () => {
        const prompt = input.value.trim();
        if (prompt) {
          onPickPrompt(prompt);
        }
      };

      leaveBtn.onclick = () => {
        showConfirmationModal('Are you sure you want to abandon your duty as Picker?', onLeave);
      };

    } else {
      ritualContainer.innerHTML = `
        <div class="picker-wait-ui">
          <span class="pulse-dot"></span>
          <p><span class="highlight-name">${state.pickerId}</span> is dreaming up the next chaos...</p>
          <button class="btn-text btn-leave-wait" style="margin-top:15px; font-size:0.9rem; opacity:0.6">🚪 Leave Squad</button>
        </div>
      `;
      const leaveBtn = ritualContainer.querySelector('.btn-leave-wait');
      leaveBtn.onclick = () => {
        showConfirmationModal('Leave the squad?', onLeave);
      };
    }
    actionArea.appendChild(ritualContainer);
  }

  // Management UI (Host Only)
  if (isHost) {
    const actionBtns = createElement('div', { classes: ['host-action-btns'] });

    // Host: Prompt Input (Only show if not currently waiting for a picker)
    if (!state.pickerId && state.status === 'LOBBY') {
      const promptContainer = createElement('div', { classes: ['host-prompt-container'] });
      promptContainer.innerHTML = `
        <label class="host-prompt-label">INITIAL PROMPT:</label>
        <input type="text" class="host-prompt-input" placeholder="e.g. A space hamster on Mars...">
      `;
      const promptInput = promptContainer.querySelector('.host-prompt-input');

      const liftOffBtn = createElement('button', {
        classes: ['btn-next', 'btn-liftoff'],
        text: 'LIFT OFF'
      });

      const updateBtnStatus = () => {
        liftOffBtn.disabled = state.participants.length < 2 || !promptInput.value.trim();
      };

      promptInput.oninput = updateBtnStatus;
      updateBtnStatus();

      liftOffBtn.onclick = () => {
        const prompt = promptInput.value.trim();
        if (prompt) onStart(prompt);
      };

      actionBtns.appendChild(promptContainer);
      actionBtns.appendChild(liftOffBtn);
    }

    // Active Game/Management Actions (Always visible for Host)
    const managementActions = createElement('div', { classes: ['host-management-grid'] });

    // Round Duration
    const durationContainer = createElement('div', { classes: ['duration-control'] });
    durationContainer.innerHTML = `
      <label class="host-prompt-label">ROUND TIME: <span class="duration-value">${state.roundDuration}</span>s</label>
      <input type="range" class="neon-slider duration-slider" min="30" max="180" step="10" value="${state.roundDuration}">
    `;
    const durationSlider = durationContainer.querySelector('.duration-slider');
    const durationValue = durationContainer.querySelector('.duration-value');

    durationSlider.oninput = (e) => {
      durationValue.textContent = e.target.value;
    };
    durationSlider.onchange = (e) => {
      onUpdateSettings({ roundDuration: parseInt(e.target.value, 10) });
    };
    managementActions.appendChild(durationContainer);

    // Chat Toggle
    const chatToggleContainer = createElement('div', { classes: ['duration-control'] });
    chatToggleContainer.innerHTML = `
      <label class="host-prompt-label">SQUAD CHAT: <span class="chat-status-label status-${state.chatEnabled ? 'enabled' : 'disabled'}">${state.chatEnabled ? 'ENABLED' : 'DISABLED'}</span></label>
      <button class="btn-chat-action ${state.chatEnabled ? 'btn-disable' : 'btn-enable'}">
        ${state.chatEnabled ? '🚫 DISABLE SQUAD CHAT' : '💬 ENABLE SQUAD CHAT'}
      </button>
    `;
    const chatToggleBtn = chatToggleContainer.querySelector('.btn-chat-action');
    chatToggleBtn.onclick = () => {
      onUpdateSettings({ chatEnabled: !state.chatEnabled });
    };
    managementActions.appendChild(chatToggleContainer);

    // Privacy Toggle (New Feature)
    const privacyToggleContainer = createElement('div', { classes: ['duration-control'] });
    privacyToggleContainer.innerHTML = `
      <label class="host-prompt-label">VISIBILITY: <span class="chat-status-label status-${state.isPrivate ? 'disabled' : 'enabled'}">${state.isPrivate ? 'PRIVATE' : 'PUBLIC'}</span></label>
      <button class="btn-chat-action ${state.isPrivate ? 'btn-enable' : 'btn-disable'}">
        ${state.isPrivate ? '🔓 MAKE PUBLIC' : '🔒 MAKE PRIVATE'}
      </button>
    `;
    const privacyToggleBtn = privacyToggleContainer.querySelector('.btn-chat-action');
    privacyToggleBtn.onclick = () => {
      onUpdateSettings({ isPrivate: !state.isPrivate });
    };
    managementActions.appendChild(privacyToggleContainer);


    // Contextual Buttons (Return / Finish / Delete)
    const contextBtns = createElement('div', { classes: ['host-context-btns-grid'] });

    // Show Resume if active game (Playing or Judging)
    if (state.status === 'PLAYING' || state.status === 'JUDGING') {
      const resumeBtn = createElement('button', {
        classes: ['btn-premium', 'btn-resume-mission'],
        text: '🚀 RETURN TO MISSION'
      });
      resumeBtn.onclick = onResume;
      contextBtns.appendChild(resumeBtn);

      const finishBtn = createElement('button', {
        classes: ['btn-premium', 'btn-finish-round'],
        text: '🏁 FINISH MISSION'
      });
      finishBtn.onclick = onFinish;
      contextBtns.appendChild(finishBtn);
    }

    const deleteBtn = createElement('button', {
      classes: ['btn-premium', 'btn-delete-squad'],
      text: '🗑️ DELETE ROOM'
    });
    deleteBtn.onclick = () => {
      showConfirmationModal(
        'DELETE ROOM? This will kick everyone out and remove this room from existence.',
        () => onDelete()
      );
    };
    contextBtns.appendChild(deleteBtn);

    managementActions.appendChild(contextBtns);
    actionBtns.appendChild(managementActions);
    actionArea.appendChild(actionBtns);
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
      <div class="status-icon-container">
          <span class="status-icon">🔔</span>
      </div>
    `;

    const pendingList = createElement('div', { classes: ['pending-list'] });
    state.pendingRequests.forEach(request => {
      pendingList.appendChild(createRequestItem(request, onApprove, onDeny));
    });

    sidebar.appendChild(pendingList);
    container.appendChild(sidebar);

    // 5. Host "Andon Cord" (Persistent End Mission)
    const andonCord = createElement('div', { classes: ['host-andon-cord'] });
    const pullBtn = createElement('button', {
      classes: ['btn-andon-cord'],
      text: '🚨'
    });
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

function createMemberItem(player, canKick, onKick, canMute, isMuted, onMute, onUnmute) {
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
    const muteBadge = createElement('span', { text: 'MUTED', classes: ['badge-host'] }); // Reuse badge style or add new
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
    // Force static to respect flex layout
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
    // Force static to respect flex layout
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

function createRequestItem(request, onApprove, onDeny) {
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
