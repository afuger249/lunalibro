const audioCache = new Map();

export const getCachedAudio = (text) => {
    return audioCache.get(text);
};

export const setCachedAudio = (text, data) => {
    audioCache.set(text, data);
};

export const clearAudioCache = () => {
    // Revoke object URLs to free memory
    audioCache.forEach((value) => {
        if (value.audioUrl) {
            URL.revokeObjectURL(value.audioUrl);
        }
    });
    audioCache.clear();
};
