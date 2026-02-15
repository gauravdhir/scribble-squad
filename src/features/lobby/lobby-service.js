/**
 * Lobby Service - Handles room discovery and creation logic.
 */
export class LobbyService {
    /**
     * Determines room status based on participant count.
     * @param {number} count - Current number of players.
     * @returns {string} 'FULL' or 'OPEN'.
     */
    calculateRoomStatus(count) {
        return count >= 8 ? 'FULL' : 'OPEN';
    }

    /**
     * Generates a random 4-letter room code.
     * @returns {string} 4 uppercase letters.
     */
    generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }
}
