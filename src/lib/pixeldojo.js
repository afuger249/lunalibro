import { supabase } from './supabase';

export const generatePixelDojoImage = async (prompt) => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                prompt,
                provider: 'pixeldojo'
            }
        });

        console.log("Edge Function Response [PixelDojo]:", { data, error });

        if (error || !data?.image) {
            console.error("Secure Image Error (PixelDojo):", error, data);
            return null;
        }

        return data.image;
    } catch (error) {
        console.error("Secure PixelDojo Fetch Error:", error);
    }
    return null;
};
