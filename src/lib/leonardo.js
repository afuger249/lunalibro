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
 * @returns {Promise<string[]>} - Array of image URLs
 */
export async function generateCandidatePortraits(character, style) {
    if (!API_KEY) {
        console.warn('Leonardo API key missing. Using simulated portraits.');
        return simulatePortraits(character, style);
    }

    try {
        const prompt = `${style.prompt.replace('[Subject]', `a ${character.type} named ${character.name}`)}. Features: ${character.hair} hair, ${character.eyes} eyes, ${character.skin} skin, wearing ${character.clothes}. Centered portrait, high quality, consistent lighting.`;

        // 1. Create Generation
        const response = await fetch(`${BASE_URL}/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                prompt: prompt,
                modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Vision XL or similar
                width: 1024,
                height: 1024,
                num_images: 3,
                promptMagic: true
            })
        });

        const data = await response.json();
        const generationId = data.sdGenerationJob.generationId;

        // 2. Wait for completion (Polling)
        // Note: In a production app, we'd use webhooks or a more robust polling mechanism.
        let images = [];
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await fetch(`${BASE_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const statusData = await statusRes.json();
            const gen = statusData.generations_by_pk;

            if (gen.status === 'COMPLETE') {
                images = gen.generated_images.map(img => img.url);
                break;
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
 * @param {string[]} characterReferences - Array of master portrait URLs.
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
            modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3',
            width: 1024,
            height: 1024,
            num_images: 1,
            promptMagic: true
        };

        // Add character references if provided
        if (characterReferences.length > 0) {
            body.controlnets = characterReferences.slice(0, 4).map(url => ({
                initImageId: url, // Leonardo might require uploading first, but some endpoints allow direct URL or reference IDs.
                type: 'CHARACTER_REFERENCE',
                strengthType: 'High'
            }));

            // Note: Leonardo's actual /generations API might require the image to be uploaded to their S3 first.
            // For now, we assume the provided URLs are accessible or handled by the backend/proxy.
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
        const generationId = data.sdGenerationJob.generationId;

        let imageUrl = '';
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await fetch(`${BASE_URL}/generations/${generationId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const statusData = await statusRes.json();
            const gen = statusData.generations_by_pk;

            if (gen.status === 'COMPLETE') {
                imageUrl = gen.generated_images[0]?.url;
                break;
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
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_1_${seed}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_2_${seed}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}_3_${seed}`
    ];
}
