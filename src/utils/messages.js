/**
 * Message Utilities
 * Centralized mapping for user-facing messages.
 */

export const MESSAGE_CODES = {
    ROOM_FULL: 'This squad is already full!',
    ALREADY_IN_ROOM: 'You are already in this squad (or waiting to be approved).',
    ROOM_NOT_FOUND: 'We couldn’t find that room. It may have vanished into a black hole.',
    USER_NOT_IN_QUEUE: 'User went missing from the queue.',
    ERROR: 'An unknown error occurred. Try again.',
    APPROVED: 'User approved!',
    REJECTED: 'User rejected.',
    LEFT_ROOM: 'You have left the squad.',
    ROOM_DELETED: 'The host has aborted the mission.',
    GAME_STARTED: 'Mission launched! 🚀',
    JOIN_SUCCESS: 'Knock sent! Waiting for host approval.',
    JOIN_SUCCESS_INSTANT: 'Welcome to the squad!',
    CREATE_SUCCESS: 'Squad created successfully!',
    CREATE_ERROR: 'Failed to create squad.',
    PRIVATE_ROOM: 'This room is private. You need the room code from the host.'
};

/**
 * Returns a friendly message for a given code.
 * @param {string} code 
 * @param {string} fallback 
 * @returns {string}
 */
export function getFriendlyMessage(code, fallback = 'Something went wrong.') {
    return MESSAGE_CODES[code] || fallback;
}
