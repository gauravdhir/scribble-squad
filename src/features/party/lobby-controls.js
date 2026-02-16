import { createElement } from '../../lib/dom.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';

export function createPickerUI(state, currentUserId, onPickPrompt, onLeave) {
  const isPicker = state.pickerId === currentUserId;
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
              <button class="btn-state-toggle status-leave btn-leave-picker">
                <span class="toggle-icon">🚪</span>
                <span class="toggle-text">LEAVE SQUAD</span>
              </button>
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
          <button class="btn-state-toggle status-leave btn-leave-wait">
            <span class="toggle-icon">🚪</span>
            <span class="toggle-text">LEAVE SQUAD</span>
          </button>
        </div>
      `;
    const leaveBtn = ritualContainer.querySelector('.btn-leave-wait');
    leaveBtn.onclick = () => {
      showConfirmationModal('Leave the squad?', onLeave);
    };
  }
  return ritualContainer;
}

export function createHostControls(state, callbacks) {
  const { onStart, onUpdateSettings, onResume, onFinish, onDelete } = callbacks;
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
      liftOffBtn.disabled = (state.participants || []).length < 2 || !promptInput.value.trim();
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

  // Grid for Toggles
  const toggleGrid = createElement('div', { classes: ['host-toggles-grid'] });

  // Chat Toggle
  const chatToggleContainer = createElement('div', { classes: ['toggle-item'] });
  const chatStatus = state.chatEnabled ? 'enabled' : 'disabled';
  chatToggleContainer.innerHTML = `
      <label class="toggle-label">COMMS</label>
      <button class="btn-state-toggle status-${chatStatus}">
        <span class="toggle-icon">${state.chatEnabled ? '💬' : '🔇'}</span>
        <span class="toggle-text">${state.chatEnabled ? 'CHAT OPEN' : 'CHAT MUTED'}</span>
      </button>
    `;
  const chatBtn = chatToggleContainer.querySelector('button');
  chatBtn.onclick = () => onUpdateSettings({ chatEnabled: !state.chatEnabled });
  toggleGrid.appendChild(chatToggleContainer);

  // Privacy Toggle
  const privacyToggleContainer = createElement('div', { classes: ['toggle-item'] });
  const privacyStatus = state.isPrivate ? 'private' : 'public';
  const privacyIcon = state.isPrivate ? '🔒' : '🔓';
  privacyToggleContainer.innerHTML = `
      <label class="toggle-label">SECURITY</label>
      <button class="btn-state-toggle status-${privacyStatus}">
        <span class="toggle-icon">${privacyIcon}</span>
        <span class="toggle-text">${state.isPrivate ? 'PRIVATE ROOM' : 'PUBLIC ROOM'}</span>
      </button>
    `;
  const privacyBtn = privacyToggleContainer.querySelector('button');
  privacyBtn.onclick = () => onUpdateSettings({ isPrivate: !state.isPrivate });
  toggleGrid.appendChild(privacyToggleContainer);

  managementActions.appendChild(toggleGrid);


  // Contextual Buttons
  const contextBtns = createElement('div', { classes: ['host-context-btns-grid'] });

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

  return actionBtns;
}
