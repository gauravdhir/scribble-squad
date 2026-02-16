export const THEMES = {
    SPACE: 'space',
    FESTIVE: 'festive',
    NEON: 'neon',
    OCEAN: 'ocean',
    LAVA: 'lava'
};

class ThemeState {
    constructor() {
        const savedTheme = localStorage.getItem('scribble_theme');
        this.currentTheme = Object.values(THEMES).includes(savedTheme) ? savedTheme : THEMES.SPACE;
        this.listeners = new Set();
    }

    setTheme(themeId, roomCode = null) {
        if (!Object.values(THEMES).includes(themeId)) {
            console.warn(`Invalid theme: ${themeId}`);
            return;
        }

        this.currentTheme = themeId;
        localStorage.setItem('scribble_theme', themeId);
        this._notify();

        // If a room code is provided, broadcast to others
        if (roomCode && typeof roomCode === 'string' && roomCode.trim() !== '') {
            import('../lobby/room-api.js').then(({ RoomAPI }) => {
                console.log(`📡 Broadcasting theme change to room ${roomCode}: ${themeId}`);
                RoomAPI.setTheme(roomCode, themeId);
            });
        } else {
            console.warn(`[Theme State] No valid roomCode provided for broadcast: ${roomCode}`);
        }
    }

    applyRemoteTheme(themeId) {
        console.log(`[Theme Sync] Remote signal received: ${themeId}`);
        if (this.currentTheme === themeId) {
            console.log(`[Theme Sync] Theme ${themeId} already active. skipping.`);
            return;
        }
        this.currentTheme = themeId;
        this._notify();
    }


    getTheme() {
        return this.currentTheme;
    }

    subscribe(callback) {
        this.listeners.add(callback);
        // Immediate callback with current state
        callback(this.currentTheme);
        return () => this.listeners.delete(callback);
    }

    _notify() {
        this.listeners.forEach(cb => cb(this.currentTheme));
    }
}

export const themeState = new ThemeState();

