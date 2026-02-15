/**
 * Profile State - Manages current user identity and persistence.
 */
export class ProfileState {
    constructor(storage = window.localStorage) {
        this.storage = storage;
        this.displayName = '';
        this.avatarId = 0;
    }

    /**
     * Validates if a name is acceptable.
     * @param {string} name 
     * @returns {boolean}
     */
    validateName(name) {
        return name.length > 0 && name.length <= 12;
    }

    /**
     * Saves identity to memory and storage.
     */
    save(name, avatarId) {
        this.displayName = name;
        this.avatarId = avatarId;
        this.storage.setItem('ss_user_name', name);
        this.storage.setItem('ss_user_avatar', avatarId.toString());
    }

    /**
     * Loads identity from storage.
     */
    load() {
        this.displayName = this.storage.getItem('ss_user_name') || '';
        this.avatarId = parseInt(this.storage.getItem('ss_user_avatar') || '0', 10);
    }

    getAvatarUrl() {
        return `https://api.dicebear.com/7.x/bottts/svg?seed=avatar${this.avatarId + 1}`;
    }

    /**
     * Clears identity from memory and storage.
     */
    clear() {
        this.displayName = '';
        this.avatarId = 0;
        this.storage.removeItem('ss_user_name');
        this.storage.removeItem('ss_user_avatar');
    }
}
