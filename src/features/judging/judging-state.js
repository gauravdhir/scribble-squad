/**
 * Judging State - Tracks medals awarded and real-time observer reactions.
 */
export class JudgingState {
    constructor() {
        this.medals = { gold: 0, silver: 0, bronze: 0 };
        this.reactions = [];
    }

    /**
     * Increments medal count for a masterpiece.
     * @param {string} type - 'gold', 'silver', or 'bronze'
     */
    awardMedal(type) {
        if (this.medals[type] !== undefined) {
            this.medals[type]++;
        }
    }

    /**
     * Adds a reaction to the floating sticker list.
     * @param {string} type - Emoji or sticker ID
     * @param {number} x - Virtual X coord (0-1000)
     * @param {number} y - Virtual Y coord (0-1000)
     */
    addReaction(type, x, y) {
        this.reactions.push({ type, x, y, id: Date.now() + Math.random() });
    }

    clear() {
        this.medals = { gold: 0, silver: 0, bronze: 0 };
        this.reactions = [];
    }
}
