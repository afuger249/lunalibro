import { supabase } from './supabase';

/**
 * PRODUCTION SECURITY: 
 * OpenAI TTS keys are kept server-side.
 */

export const generateOpenAISpeech = async (text, voice = 'nova', speed = 1.0) => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-speech', {
            body: {
                text,
                speed,
                provider: 'openai',
                voice
            }
        });

        if (error) {
            const details = error.context ? await error.context.json().catch(() => null) : null;
            const message = details?.error || error.message || 'Unknown error';
            throw new Error(`Secure Speech Error (OpenAI): ${message}`);
        }

        if (!data?.audioUrl) {
            throw new Error(`Secure Speech Error (OpenAI): Empty response from server`);
        }

        return data.audioUrl;
    } catch (error) {
        console.error("Error generating speech with secured OpenAI TTS:", error);
        throw error;
    }
};

/**
 * Generates speech with estimated timestamps for "karaoke" style highlighting.
 */
export const generateOpenAISpeechWithTimestamps = async (text, voice = 'nova', speed = 1.0) => {
    try {
        const audioUrl = await generateOpenAISpeech(text, voice, speed);

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
        console.error("OpenAI Timestamp Gen Failed (Secured):", error);
        throw error;
    }
};
