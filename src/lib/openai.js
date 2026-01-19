import { supabase } from './supabase';

/**
 * PRODUCTION SECURITY: 
 * Direct API calls to OpenAI are disabled on the client to prevent key theft.
 * All requests are proxied through Supabase Edge Functions.
 */
export const getChatResponse = async (messages, model = "gpt-4o") => {
    const cleanMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }));

    try {
        const { data, error } = await supabase.functions.invoke('chat', {
            body: { messages: cleanMessages, model }
        });

        if (error || !data) {
            console.error("Secure Chat Function Error:", error || "No data returned");
            throw new Error(error?.message || "Lumi's magic is currently unavailable. (Secure Proxy Error)");
        }

        // RESILIENCE: Support both wrapped { message: ... } and direct message objects
        const message = data.message || (data.content ? data : null);
        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        if (!message || (!message.content && !message.tool_calls)) {
            console.error("Unexpected response structure from Edge Function:", data);
            throw new Error("Lumi's magic returned an incomplete response. Please try again.");
        }

        return { message, usage };
    } catch (error) {
        console.error("Critical Security Failure or Network Error:", error);
        throw error;
    }
};

export const generateSpeech = async (text, speed = 1.0) => {
    try {
        // Updated to use the central speech-gen function
        const { data, error } = await supabase.functions.invoke('generate-speech', {
            body: {
                text,
                speed,
                provider: 'openai',
                voice: 'alloy' // Default voice
            }
        });

        if (error || !data?.audioUrl) {
            console.error("Secure Speech Generation Error:", error);
            throw new Error("Lumi's voice is resting. (Secure Proxy Error)");
        }

        return data.audioUrl;
    } catch (e) {
        console.error("Secure TTS failed", e);
        throw e;
    }
};
