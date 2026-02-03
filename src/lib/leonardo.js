/**
 * Leonardo.ai API Integration
 * Handles character portrait generation and character reference lookups.
 */

const API_KEY = import.meta.env.VITE_LEONARDO_API_KEY;
const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

/**
 * Generate candidate portraits for a character.
 * @param {Object} character - Character details (name, type, hair, skin, clothes)
 * @param {Object} style - Selected art style object
 * @returns {Promise<Object[]>} - Array of objects {id, url}
 */
export async function generateCandidatePortraits(character, style) {
    if (!API_KEY) {
        console.warn('Leonardo API key missing. Using simulated portraits.');
        return simulatePortraits(character, style);
    }

    try {
        const prompt = `${style.prompt.replace('[Subject]', `a stylized ${character.type} character named ${character.name}`)}. Features: ${character.hair} hair, ${character.eyes} eyes, ${character.skin} skin, wearing ${character.clothes}. Centered portrait, high quality, consistent lighting.`;
        const negativePrompt = "photorealistic, real life, photography, 3d render, hyperrealistic, textured skin, human features, real boy, real girl";

        // 1. Create Generation
        const response = await fetch(`${BASE_URL}/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                prompt: prompt,
                negative_prompt: negativePrompt,
                modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
                width: 1024,
                height: 1024,
                num_images: 3,
                alchemy: true,
                photoReal: false,
                presetStyle: 'NONE' // Allow the prompt style to take priority
            })
        });

        const data = await response.json();
        if (!data.sdGenerationJob) {
            throw new Error(data.message || 'Failed to start generation job');
        }
        const generationId = data.sdGenerationJob.generationId;

        // 2. Wait for completion (Polling)
        let images = [];
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await fetch(`${BASE_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const statusData = await statusRes.json();
            const gen = statusData.generations_by_pk;

            if (gen && gen.status === 'COMPLETE') {
                images = gen.generated_images.map(img => ({
                    id: img.id,
                    url: img.url
                }));
                break;
            } else if (gen && gen.status === 'FAILED') {
                throw new Error('Generation job failed');
            }
        }

        return images.length > 0 ? images : simulatePortraits(character, style);
    } catch (error) {
        console.error('Leonardo generation error:', error);
        return simulatePortraits(character, style);
    }
}

/**
 * Generate a story page image using character references.
 * @param {string} prompt - The image prompt.
 * @param {Object[]} characterReferences - Array of master portrait objects {id, url}.
 * @returns {Promise<string>} - Generated image URL.
 */
export async function generateLeonardoImage(prompt, characterReferences = []) {
    if (!API_KEY) {
        console.warn('Leonardo API key missing. Using simulated story image.');
        return `https://picsum.photos/seed/${Math.random()}/1024/1024`;
    }

    try {
        const body = {
            prompt: prompt,
            negative_prompt: "photorealistic, real life, photography, 3d render, hyperrealistic, textured skin, human features",
            modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
            width: 1024,
            height: 1024,
            num_images: 1,
            alchemy: true,
            photoReal: false,
            presetStyle: 'NONE' // Allow the prompt style to take priority
        };

        // Add character references if provided
        if (characterReferences.length > 0) {
            // If multiple refs, we use Image Prompt (67) instead of Character Reference (133)
            // to prevent the 400 "Multiple Character Reference not supported" error
            // and reduce identity bleeding.
            const useCR = characterReferences.length === 1;

            body.controlnets = characterReferences.slice(0, 2).map(ref => ({
                initImageId: ref.id,
                initImageType: 'GENERATED',
                preprocessorId: useCR ? 133 : 67, // 133 = CR, 67 = Image Prompt
                strengthType: 'High'
            }));
        }

        const response = await fetch(`${BASE_URL}/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!data.sdGenerationJob) {
            console.error('Leonardo API Error:', data);
            throw new Error(data.message || 'Failed to start generation job');
        }
        const generationId = data.sdGenerationJob.generationId;

        let imageUrl = '';
        for (let i = 0; i < 25; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await fetch(`${BASE_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const statusData = await statusRes.json();
            const gen = statusData.generations_by_pk;

            if (gen && gen.status === 'COMPLETE') {
                imageUrl = gen.generated_images[0]?.url;
                break;
            } else if (gen && gen.status === 'FAILED') {
                throw new Error('Generation job failed');
            }
        }

        return imageUrl || `https://picsum.photos/seed/${Math.random()}/1024/1024`;
    } catch (error) {
        console.error('Leonardo generation error:', error);
        return `https://picsum.photos/seed/${Math.random()}/1024/1024`;
    }
}

/**
 * Simulated portraits for testing and demonstration.
 * Uses placeholder images or dynamically generated URLs if possible.
 */
function simulatePortraits(character, style) {
    // Using high-quality diverse placeholders for demonstration
    const seed = Math.floor(Math.random() * 1000);
    return [
        { id: `sim_${seed}_1`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_1_${seed}` },
        { id: `sim_${seed}_2`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_2_${seed}` },
        { id: `sim_${seed}_3`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_3_${seed}` }
    ];
}
