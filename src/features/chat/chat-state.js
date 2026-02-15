/**
 * Chat State - Manages local chat history and settings.
 */
export const chatState = {
    messages: [],
    isEnabled: true,
    isMuted: false, // New capability
    isVisible: false,
    onMessage: null,
    onEnabledChange: null,
    onMuteChange: null // New event
};

export function addMessage(data) {
    chatState.messages.push(data);
    if (chatState.messages.length > 50) chatState.messages.shift();
    if (chatState.onMessage) chatState.onMessage(data);
}

export function setChatEnabled(enabled) {
    chatState.isEnabled = enabled;
    if (chatState.onEnabledChange) chatState.onEnabledChange(enabled);
}

export function setChatMuted(muted) {
    if (chatState.isMuted !== muted) {
        chatState.isMuted = muted;
        if (chatState.onMuteChange) chatState.onMuteChange(muted);
    }
}

export function toggleChatVisibility() {
    chatState.isVisible = !chatState.isVisible;
}
