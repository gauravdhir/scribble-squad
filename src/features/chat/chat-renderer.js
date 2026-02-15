import { createElement } from '../../lib/dom.js';
import { chatState } from './chat-state.js';
import { RoomAPI } from '../lobby/room-api.js';
import { appState } from '../../main.js';

const EMOJIS = ['🚀', '🎨', '✨', '🔥', '💖', '😂', '🤔', '💩', '🌈', '💀'];

// Module-level reference to the active UI update function
let activeUiUpdate = null;

// Ensure global handler redirects to the active UI
chatState.onMessage = (data) => {
    if (activeUiUpdate) {
        activeUiUpdate();
    }
};

export function createChatUI(roomCode) {
    const container = createElement('div', { id: 'chat-container', classes: ['chat-widget'] });

    const toggleBtn = createElement('button', { classes: ['chat-toggle-btn'], text: '💬' });
    const chatPanel = createElement('div', { classes: ['chat-panel'] });

    // Header
    const header = createElement('div', { classes: ['chat-header'] });
    const title = createElement('h3', { text: chatState.isMuted ? 'SQUAD CHAT (MUTED)' : 'SQUAD CHAT' });
    if (chatState.isMuted) title.style.color = '#ff4444';

    header.appendChild(title);

    const closeBtn = createElement('button', { classes: ['chat-close-btn'], text: '✕' });
    header.appendChild(closeBtn);

    // Messages Area
    const messagesArea = createElement('div', { classes: ['chat-messages'] });

    // Footer / Input
    const footer = createElement('div', { classes: ['chat-footer'] });
    const inputArea = createElement('div', { classes: ['chat-input-wrapper'] });

    const input = createElement('input', {
        classes: ['chat-input'],
        attr: { placeholder: 'Type a message...', type: 'text' }
    });

    const emojiRow = createElement('div', { classes: ['emoji-row'] });
    EMOJIS.forEach(emoji => {
        const span = createElement('span', { classes: ['emoji-btn'], text: emoji });
        span.onclick = () => {
            if (!input.disabled) {
                input.value += emoji;
                input.focus();
            }
        };
        emojiRow.appendChild(span);
    });

    const sendBtn = createElement('button', { classes: ['chat-send-btn'], text: 'SEND' });

    const sendMessage = () => {
        const text = input.value.trim();
        if (text && chatState.isEnabled && !chatState.isMuted) {
            RoomAPI.sendChatMessage(roomCode, appState.profileState.displayName, text);
            input.value = '';
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    footer.appendChild(emojiRow);
    footer.appendChild(inputArea);

    chatPanel.appendChild(header);
    chatPanel.appendChild(messagesArea);
    chatPanel.appendChild(footer);
    container.appendChild(toggleBtn);
    container.appendChild(chatPanel);

    // Update messages function
    const renderMessages = () => {
        messagesArea.innerHTML = '';
        chatState.messages.forEach(msg => {
            const item = createElement('div', { classes: ['chat-msg-item'] });
            const isMe = msg.userId === appState.profileState.displayName;
            if (isMe) item.classList.add('me');

            item.innerHTML = `
                <div class="msg-sender">${msg.userId}</div>
                <div class="msg-text">${msg.message}</div>
            `;
            messagesArea.appendChild(item);
        });
        // Auto-scroll logic
        setTimeout(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 50);
    };

    closeBtn.onclick = () => chatPanel.classList.remove('visible');

    // Define the update handler
    const handleNewMessage = () => {
        if (!chatPanel.classList.contains('visible')) {
            toggleBtn.classList.add('has-new');
        } else {
            toggleBtn.classList.remove('has-new');
        }
        renderMessages();
    };

    // Register as active
    activeUiUpdate = handleNewMessage;

    toggleBtn.onclick = () => {
        chatPanel.classList.toggle('visible');
        if (chatPanel.classList.contains('visible')) {
            toggleBtn.classList.remove('has-new');
            renderMessages();
            if (!input.disabled) input.focus();
        }
    };

    const updateInputState = () => {
        if (!chatState.isEnabled) {
            input.disabled = true;
            input.placeholder = 'Chat disabled by host';
            sendBtn.disabled = true;
        } else if (chatState.isMuted) {
            input.disabled = true;
            input.placeholder = 'You are muted by host';
            sendBtn.disabled = true;
            title.textContent = 'SQUAD CHAT (MUTED)';
            title.style.color = '#ff4444';
        } else {
            input.disabled = false;
            input.placeholder = 'Type a message...';
            sendBtn.disabled = false;
            title.textContent = 'SQUAD CHAT';
            title.style.color = '';
        }
    };

    chatState.onEnabledChange = updateInputState;
    chatState.onMuteChange = updateInputState;

    // Initial render
    renderMessages();
    updateInputState();

    return container;
}

export function showChat(roomCode) {
    let existing = document.getElementById('chat-container');

    // If UI exists but we have no active handler (zombie UI), kill it and rebuild
    if (existing && !activeUiUpdate) {
        console.warn('Found zombie chat UI. Rebuilding...');
        existing.remove();
        existing = null;
    }

    if (existing) return;

    const ui = createChatUI(roomCode);
    document.body.appendChild(ui);
}

export function hideChat() {
    activeUiUpdate = null; // Detach handler
    const elements = document.querySelectorAll('.chat-widget, #chat-container');
    elements.forEach(el => el.remove());
}
