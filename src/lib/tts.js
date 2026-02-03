import { supabase } from './supabase';

/**
 * PRODUCTION SECURITY: 
 * TTS API keys are kept server-side in Supabase Edge Functions.
 * Supports Azure TTS voices for Spanish language learning.
 */

/**
 * Available Azure Spanish Voices:
 * - es-MX-DaliaNeural (Female, warm and friendly)
 * - es-MX-JorgeNeural (Male, clear and professional)
 * - es-MX-MarinaNeural (Female, young and energetic)
 * - es-ES-ElviraNeural (Female, Spanish from Spain)
 * - es-ES-AlvaroNeural (Male, Spanish from Spain)
 */

export const generateSpeech = async (text, voice = 'es-MX-DaliaNeural', speed = 1.0) => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-speech', {
            body: {
                text,
                speed,
                voice
            }
        });

        if (error) {
            const details = error.context ? await error.context.json().catch(() => null) : null;
            const message = details?.error || error.message || 'Unknown error';
            throw new Error(`TTS Error: ${message}`);
        }

        if (!data?.audioUrl) {
            throw new Error(`TTS Error: Empty response from server`);
        }

        return data.audioUrl;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};

/**
 * Generates speech with estimated timestamps for "karaoke" style highlighting.
 */
export const generateSpeechWithTimestamps = async (text, voice = 'es-MX-DaliaNeural', speed = 1.0) => {
    try {
        const audioUrl = await generateSpeech(text, voice, speed);

        // Calculate estimated alignment
        return new Promise((resolve) => {
            const audio = new Audio(audioUrl);
            audio.onloadedmetadata = () => {
                const duration = audio.duration;
                const charCount = text.length;
                const timePerChar = duration / charCount;

                const characters = text.split('');
                const character_start_times_seconds = [];
                const character_end_times_seconds = [];

                for (let i = 0; i < charCount; i++) {
                    character_start_times_seconds.push(i * timePerChar);
                    character_end_times_seconds.push((i + 1) * timePerChar);
                }

                resolve({
                    audioUrl,
                    alignment: {
                        characters,
                        character_start_times_seconds,
                        character_end_times_seconds
                    }
                });
            };
            audio.onerror = () => {
                resolve({ audioUrl, alignment: null });
            };
        });
    } catch (error) {
        console.error("TTS Timestamp Generation Failed:", error);
        throw error;
    }
};

// Legacy export for backwards compatibility
export const generateOpenAISpeech = generateSpeech;
export const generateOpenAISpeechWithTimestamps = generateSpeechWithTimestamps;
