/**
 * storage_guard.js
 * Utility for monitoring and managing localStorage to prevent QuotaExceededError.
 */

const STORAGE_THRESHOLD = 0.8; // Warn at 80% usage (approx 4MB of 5MB)

/**
 * Calculates current localStorage usage in bytes.
 */
export const getStorageUsage = () => {
    let total = 0;
    for (let key in localStorage) {
        if (!localStorage.hasOwnProperty(key)) continue;
        total += ((localStorage[key].length + key.length) * 2);
    }
    return total;
};

/**
 * Checks if storage is nearing its limit.
 * @returns {Object} { isNearLimit: boolean, percentage: number }
 */
export const checkStorageQuota = () => {
    const usage = getStorageUsage();
    const limit = 5 * 1024 * 1024; // 5MB typical browser limit
    const percentage = usage / limit;

    return {
        isNearLimit: percentage > STORAGE_THRESHOLD,
        percentage: Math.round(percentage * 100),
        usageBytes: usage
    };
};

/**
 * Purges non-essential data if storage is tight.
 * @returns {number} Number of items removed
 */
export const cleanupOldData = () => {
    console.warn("Storage Guard: Starting aggressive cleanup...");

    const legacyPrefixes = ['story_', 'temp_', 'chat_'];
    const specificKeys = [
        'LUMILIBRO_STORY_SEED',
        'LUMILIBRO_COMPLETED_NODE',
        'chat_sessions'
    ];

    let removedCount = 0;

    // 1. Clear specific known keys
    specificKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
        }
    });

    // 2. Clear by prefix
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (legacyPrefixes.some(p => key.startsWith(p))) {
            localStorage.removeItem(key);
            removedCount++;
            i--; // Adjust index after removal
        }
    }

    console.log(`Storage Guard: Removed ${removedCount} legacy/temporary items.`);
    return removedCount;
};

/**
 * Prunes the oldest character data to make space.
 */
export const deepCleanupOldData = () => {
    const charData = localStorage.getItem('saved_characters');
    if (!charData) return 0;

    try {
        let characters = JSON.parse(charData);
        if (characters.length <= 2) return 0; // Keep at least 2

        // Assuming characters are already sorted by recent first (unshift used in storage)
        // We remove the last 3 (the oldest)
        const itemsToRemove = Math.min(3, characters.length - 2);
        characters = characters.slice(0, characters.length - itemsToRemove);

        localStorage.setItem('saved_characters', JSON.stringify(characters));
        console.log(`Storage Guard: Pruned ${itemsToRemove} oldest characters.`);
        return itemsToRemove;
    } catch (e) {
        console.error("Deep cleanup failed", e);
        return 0;
    }
};

/**
 * Returns a report of the largest keys in localStorage.
 */
export const getStorageReport = () => {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        const size = (val.length + key.length) * 2;
        items.push({ key, size, sizeKB: Math.round(size / 1024) });
    }
    return items.sort((a, b) => b.size - a.size).slice(0, 5);
};

/**
 * The "Nuclear Option": Wipes everything except essential Auth and Settings.
 * Used when standard cleanups fail to resolve QuotaExceededError.
 */
export const nuclearCleanup = () => {
    console.warn("Storage Guard: PERPARATION FOR NUCLEAR CLEANUP...");

    // Whitelist: DO NOT DELETE THESE
    const whitelist = [
        'saved_characters',
        'ageLevel',
        'spanishLevel',
        'settings_use_elevenlabs',
        'VITE_TTS_PROVIDER'
    ];

    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Skip Supabase auth tokens (usually start with 'sb-')
        if (key.startsWith('sb-')) continue;

        // Skip whitelist
        if (whitelist.includes(key)) continue;

        keysToDelete.push(key);
    }

    console.log(`Storage Guard: Purging ${keysToDelete.length} keys...`);
    keysToDelete.forEach(key => localStorage.removeItem(key));

    return keysToDelete.length;
};
