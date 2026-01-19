import { supabase } from './supabase';

export const generateGetImgImage = async (prompt) => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                prompt,
                provider: 'getimg'
            }
        });

        console.log("Edge Function Response [GetImg]:", { data, error });

        if (error || !data?.image) {
            console.error("Secure Image Error (GetImg):", error, data);
            return null;
        }

        return data.image;
    } catch (error) {
        console.error("Secure GetImg Fetch Error:", error);
    }
    return null;
};
