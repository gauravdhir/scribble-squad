/**
 * Simple Profanity Filter - Detects and censors "potty mouth" words.
 */
const BANNED_WORDS = [
    'fuck', 'shit', 'asshole', 'bitch', 'crap', 'damn', 'piss', 'dick', 'pussy', 'cock', 'fag', 'nigger', 'kike', 'pimp', 'cunt', 'whore', 'slut', 'tit', 'boob', 'anus'
    // ... adding more for a demo
];

/**
 * Checks if a string contains banned language.
 */
export function hasProfanity(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return BANNED_WORDS.some(word => {
        // Simple word boundary check
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
}

/**
 * Returns a policy violation message if profanity is detected, otherwise returns original text.
 */
export function filterContent(text) {
    if (hasProfanity(text)) {
        return "msg removed for policy violation";
    }
    return text;
}
