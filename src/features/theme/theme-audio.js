import { THEMES } from './theme-state.js';

class ThemeAudio {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0.4;
        this.currentTheme = null;

        this.themeMap = {
            [THEMES.SPACE]: '/sounds/game-background.mp3',
            [THEMES.FESTIVE]: '/sounds/festive.mp3',
            [THEMES.NEON]: '/sounds/cyber.mp3',
            [THEMES.OCEAN]: '/sounds/deep-sea.mp3',
            [THEMES.LAVA]: '/sounds/fire.mp3'
        };

        // Global unlocker for mobile/strict browsers
        const unlock = () => {
            console.log('🔊 Audio system primed via interaction');
            if (!this.currentTheme) {
                this.playTheme(THEMES.SPACE);
            } else {
                this.audio.play().catch(() => { });
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
    }

    playTheme(themeId) {
        if (!themeId) themeId = THEMES.SPACE;
        if (this.currentTheme === themeId && !this.audio.paused) return;

        const soundPath = this.themeMap[themeId];
        if (!soundPath) return;

        console.log(`🎵 Theme Audio: Attempting to play ${themeId} (${soundPath})`);

        this.audio.src = soundPath;
        this.audio.load();

        this.audio.play().then(() => {
            console.log(`✅ Success: ${themeId} audio playing`);
        }).catch(err => {
            console.warn('⚠️ Auto-play blocked. Player must interact with page.', err);
        });

        this.currentTheme = themeId;
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.currentTheme = null;
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        return this.audio.muted;
    }

    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
    }
}

export const themeAudio = new ThemeAudio();
