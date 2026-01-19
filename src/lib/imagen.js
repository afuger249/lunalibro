import { supabase } from './supabase';

/**
 * PRODUCTION SECURITY: 
 * Google Gemini/Imagen keys are kept server-side.
 */

export const generateStoryImage = async (prompt) => {
    // Style Anchor for 3D Animation look (Generic to avoid copyright filters)
    const styleAnchor = "In the style of a modern high-end 3D animated film, vibrant colors, soft lighting, charming character design, cinematic composition, 4k, digital art.";
    const finalPrompt = `${styleAnchor} Scene: ${prompt}`;

    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                prompt: finalPrompt,
                provider: 'google'
            }
        });

        console.log("Edge Function Response [Google]:", { data, error });

        if (data?.warning) {
            console.warn("Edge Function Warning:", data.warning);
        }

        if (error || !data?.image) {
            console.error("Secure Image Function Error:", error, data);
            // Return a reliable fallback if secure service fails
            return `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000&text=${encodeURIComponent(prompt)}`;
        }

        return data.image; // Expecting base64 or URL from the proxy
    } catch (error) {
        console.error("Secure Image Fetch failed:", error);
        return `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000&text=${encodeURIComponent(prompt)}`;
    }
};
