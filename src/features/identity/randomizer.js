/**
 * Identity Randomizer - Generates silly, kid-friendly nicknames.
 */

const ADJECTIVES = [
    'Neon', 'Cosmic', 'Galactic', 'Silly', 'Dancing',
    'Hyper', 'Magic', 'Giggling', 'Flying', 'Super'
];

const NOUNS = [
    'Noodle', 'Cat', 'Dino', 'Robot', 'Pancake',
    'Potato', 'Alien', 'Unicorn', 'Badger', 'Squid'
];

/**
 * Generates a random two-word nickname.
 * @returns {string} e.g. "Neon Noodle"
 */
export function generateSillyName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj} ${noun}`;
}
