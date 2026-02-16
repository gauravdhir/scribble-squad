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

    // Privacy Toggle
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
