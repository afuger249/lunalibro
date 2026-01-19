import { useState, useCallback } from 'react';

export const useVoiceRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const startListening = useCallback((expectedWord, onInterim, onSuccess, onFailure) => {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'es-ES'; // Spanish (Spain) - can also use 'es-MX' for Mexican Spanish
        recognition.continuous = false;
        recognition.interimResults = true; // Enable interim results for real-time display
        recognition.maxAlternatives = 3; // Get multiple alternatives for better matching

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const results = event.results[event.results.length - 1];

            // Check if result is interim or final
            if (!results.isFinal) {
                // Interim result - show real-time speech
                const interimTranscript = results[0].transcript.toLowerCase().trim();
                if (onInterim) {
                    onInterim(interimTranscript);
                }
                return;
            }

            // Final result
            const spokenText = results[0].transcript.toLowerCase().trim();
            setTranscript(spokenText);

            console.log('Spoken:', spokenText, 'Expected:', expectedWord.toLowerCase());

            // Check if the spoken text matches the expected word
            const isMatch = checkFuzzyMatch(spokenText, expectedWord.toLowerCase());

            if (isMatch) {
                onSuccess();
            } else {
                // Check alternative transcripts
                let foundMatch = false;
                for (let i = 1; i < results.length; i++) {
                    const altText = results[i].transcript.toLowerCase().trim();
                    if (checkFuzzyMatch(altText, expectedWord.toLowerCase())) {
                        foundMatch = true;
                        onSuccess();
                        break;
                    }
                }

                if (!foundMatch) {
                    onFailure(spokenText);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);

            if (event.error === 'no-speech') {
                onFailure('No speech detected');
            } else if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access.');
                onFailure('');
            } else {
                onFailure('');
            }
        };

        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            setIsListening(false);
        }
    }, []);

    return { isListening, transcript, startListening };
};

/**
 * Fuzzy match to account for accents, articles, and minor variations
 */
function checkFuzzyMatch(spoken, expected) {
    // Direct match
    if (spoken === expected) return true;

    // Remove common articles and check again
    const cleanSpoken = removeArticles(spoken);
    const cleanExpected = removeArticles(expected);
    if (cleanSpoken === cleanExpected) return true;

    // Remove accents and check
    const noAccentSpoken = removeAccents(cleanSpoken);
    const noAccentExpected = removeAccents(cleanExpected);
    if (noAccentSpoken === noAccentExpected) return true;

    // Check if expected word is contained in spoken (for multi-word responses)
    if (cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)) {
        return true;
    }

    // Levenshtein distance for typos/pronunciation variations
    const distance = levenshteinDistance(noAccentSpoken, noAccentExpected);
    const threshold = Math.max(2, Math.floor(noAccentExpected.length * 0.2)); // 20% tolerance

    return distance <= threshold;
}

/**
 * Remove Spanish articles
 */
function removeArticles(text) {
    return text
        .replace(/^(el|la|los|las|un|una|unos|unas)\s+/gi, '')
        .trim();
}

/**
 * Remove Spanish accents
 */
function removeAccents(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}
