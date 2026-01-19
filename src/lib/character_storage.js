/**
 * Utility for persisting characters in localStorage.
 * Characters are stored as an array of objects.
 */

const STORAGE_KEY = 'saved_characters';

export const saveCharacter = (character) => {
    try {
        const characters = getSavedCharacters();

        // Check if character with same ID exists, update it
        const existingIndex = characters.findIndex(c => c.id === character.id);

        if (existingIndex >= 0) {
            characters[existingIndex] = { ...character, last_updated: new Date().toISOString() };
        } else {
            characters.unshift({
                ...character,
                id: character.id || Date.now(),
                created_at: new Date().toISOString()
            });
        }

        // Keep only limited characters (limit 10 to avoid QuotaExceededError with large SVG data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characters.slice(0, 10)));
        return true;
    } catch (e) {
        console.error("Failed to save character", e);
        return false;
    }
};

export const getSavedCharacters = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load saved characters", e);
        return [];
    }
};

export const deleteCharacter = (id) => {
    try {
        const characters = getSavedCharacters();
        const newCharacters = characters.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCharacters));
        return true;
    } catch (e) {
        console.error("Failed to delete character", e);
        return false;
    }
};
