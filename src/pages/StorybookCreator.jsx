import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, BookOpen, UserPlus, ArrowRight, ArrowLeft, Wand2, X, Loader, Palette, Info, CheckCircle, AlertTriangle, Check, Globe, Smile, Heart, Zap, Ghost, Trash2, Save, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatResponse } from '../lib/openai';
import { generateStoryImage } from '../lib/imagen';
import { generateGetImgImage } from '../lib/getimg';
import { generatePixelDojoImage } from '../lib/pixeldojo';
import { saveCharacter, getSavedCharacters, deleteCharacter } from '../lib/character_storage';
import { saveStorybook, getStorybookById } from '../lib/storybook_storage';
import { supabase } from '../lib/supabase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { checkStorageQuota, cleanupOldData, deepCleanupOldData, getStorageReport, nuclearCleanup } from '../lib/storage_guard';
import CustomModal from '../components/CustomModal';
import PremiumSelect from '../components/PremiumSelect';
import { generateCandidatePortraits, generateLeonardoImage } from '../lib/leonardo';

const CHARACTER_OPTIONS = {
    Kid: {
        hair: {
            label: "Hair Color",
            options: [
                { label: 'Brown', value: '#5D4037' },
                { label: 'Black', value: '#1a1a1a' },
                { label: 'Blonde', value: '#E6C200' },
                { label: 'Red', value: '#B71C1C' },
                { label: 'White', value: '#F5F5F5' },
                { label: 'Blue', value: '#2196F3' }
            ]
        },
        skin: {
            label: "Skin Tone",
            options: [
                { label: 'Light', value: '#FFE0BD' },
                { label: 'Medium', value: '#EAC086' },
                { label: 'Tan', value: '#D2A679' },
                { label: 'Dark', value: '#8D5524' },
                { label: 'Pale', value: '#FFF5EB' }
            ]
        },
        clothes: {
            label: "Outfit",
            options: ['Red Shirt', 'Blue Hoodie', 'Space Suit', 'Princess Dress', 'Superhero Cape', 'School Uniform', 'Pajamas']
        },
        personalities: [
            { label: 'Silly', emoji: '🤪', description: 'mischievous, joking, funny face, energetic' },
            { label: 'Brave', emoji: '🛡️', description: 'heroic, confident, standing tall, determined look' },
            { label: 'Kind', emoji: '🌟', description: 'helpful, gentle, warm smile, caring pose' },
            { label: 'Curious', emoji: '🕵️', description: 'inquisitive, wide-eyed, tilt of head, exploring' },
            { label: 'Sleepy', emoji: '😴', description: 'yawning, cozy, relaxed, ready for bed' }
        ],
        hasEyes: true
    },
    Adult: {
        hair: {
            label: "Hair Style",
            options: [
                { label: 'Brown', value: '#5D4037' },
                { label: 'Black', value: '#1a1a1a' },
                { label: 'Blonde', value: '#E6C200' },
                { label: 'Grey', value: '#9E9E9E' },
                { label: 'Bald', value: '#EAC086' }
            ]
        },
        skin: {
            label: "Skin Tone",
            options: [
                { label: 'Light', value: '#FFE0BD' },
                { label: 'Medium', value: '#EAC086' },
                { label: 'Tan', value: '#D2A679' },
                { label: 'Dark', value: '#8D5524' }
            ]
        },
        clothes: {
            label: "Attire",
            options: ['Suit', 'Casual', 'Doctor Coat', 'Police Uniform', 'Chef Apron', 'Yoga Gear']
        },
        personalities: [
            { label: 'Wise', emoji: '🧙', description: 'thoughtful, calm, knowing smile, gentle posture' },
            { label: 'Brave', emoji: '🛡️', description: 'heroic, confident, strong stance, protector' },
            { label: 'Funny', emoji: '🤡', description: 'making jokes, playful, laughing, animated' },
            { label: 'Gentle', emoji: '🌿', description: 'patient, soft expression, kind-hearted, peaceful' },
            { label: 'Cheerful', emoji: '😊', description: 'always smiling, warm presence, friendly wave' }
        ],
        hasEyes: true
    },
    Dog: {
        hair: {
            label: "Fur Color",
            options: [
                { label: 'Golden', value: '#D4AF37' },
                { label: 'Black', value: '#1a1a1a' },
                { label: 'Brown', value: '#5D4037' },
                { label: 'White', value: '#F5F5F5' },
                { label: 'Spotted', value: 'url(#spots)' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Red Collar', 'Blue Bandana', 'Superhero Cape', 'None', 'Bow Tie']
        },
        personalities: [
            { label: 'Playful', emoji: '🎾', description: 'wagging tail, zoomies, tongue out, happy energy' },
            { label: 'Loyal', emoji: '🐕‍🦺', description: 'sitting by owner, protective, calm, sweet eyes' },
            { label: 'Goofy', emoji: '🤪', description: 'tilted head, floppy ears, goofy accidental pose' },
            { label: 'Sleepy', emoji: '💤', description: 'curled in a ball, cozy, peaceful snoring' },
            { label: 'Hungry', emoji: '🦴', description: 'drooling slightly, begging look, paws up' }
        ],
        hasEyes: true
    },
    Cat: {
        hair: {
            label: "Fur Color",
            options: [
                { label: 'Orange', value: '#FF9800' },
                { label: 'Black', value: '#1a1a1a' },
                { label: 'Grey', value: '#9E9E9E' },
                { label: 'White', value: '#F5F5F5' },
                { label: 'Calico', value: '#D2A679' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Pink Collar', 'Bell', 'Bow', 'None']
        },
        personalities: [
            { label: 'Sassy', emoji: '💅', description: 'tail flicking, clever look, elegant pose, smart' },
            { label: 'Lucky', emoji: '🍀', description: 'purring, happy, bringer of good vibes' },
            { label: 'Hunter', emoji: '🧶', description: 'pouncing, focused eyes, ready for a yarn ball' },
            { label: 'Royal', emoji: '👑', description: 'sitting on a pillow, aloof but cute, fancy' },
            { label: 'Napping', emoji: '🌙', description: 'curled up, peaceful, dreaming of treats' }
        ],
        hasEyes: true
    },
    Robot: {
        hair: {
            label: "Metal Color",
            options: [
                { label: 'Silver', value: '#B0BEC5' },
                { label: 'Gold', value: '#FFC107' },
                { label: 'Rusty', value: '#795548' },
                { label: 'White', value: '#ECEFF1' },
                { label: 'Blue', value: '#2196F3' }
            ]
        },
        skin: null,
        clothes: {
            label: "Style",
            options: ['Retro', 'Futuristic', 'Steampunk', 'Cute']
        },
        personalities: [
            { label: 'Beeping', emoji: '🤖', description: 'blinking lights, happy mechanical sounds, friendly' },
            { label: 'Helpful', emoji: '🔧', description: 'holding a tool, ready to work, reliable gear' },
            { label: 'Glitchy', emoji: '⚡', description: 'chaotic but fun, sparks of joy, funny movements' },
            { label: 'Smart', emoji: '🧠', description: 'recalculating, binary eyes, bright glowing ideas' },
            { label: 'Friendly', emoji: '🤝', description: 'waving, metallic smile, soft robot heart' }
        ],
        hasEyes: true
    },
    Dinosaur: {
        hair: {
            label: "Scales Color",
            options: [
                { label: 'Green', value: '#4CAF50' },
                { label: 'Blue', value: '#2196F3' },
                { label: 'Purple', value: '#9C27B0' },
                { label: 'Orange', value: '#FF9800' },
                { label: 'Red', value: '#F44336' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Bow Tie', 'Party Hat', 'Scientist Glasses', 'Explorer Vest', 'None']
        },
        personalities: [
            { label: 'Stompy', emoji: '🦖', description: 'big steps, loud happy stomps, energetic' },
            { label: 'Gentle', emoji: '🦕', description: 'long neck, peaceful, slow moving, kind eyes' },
            { label: 'Hungry', emoji: '🍕', description: 'always looking for snacks, wide mouth, excited' },
            { label: 'Roaring', emoji: '🔊', description: 'big friendly roars, expressive, vocal' },
            { label: 'Sleepy', emoji: '💤', description: 'napping in the sun, cozy, relaxed' }
        ],
        hasEyes: true
    },
    Monster: {
        hair: {
            label: "Fur Color",
            options: [
                { label: 'Purple', value: '#9C27B0' },
                { label: 'Blue', value: '#03A9F4' },
                { label: 'Pink', value: '#E91E63' },
                { label: 'Green', value: '#8BC34A' },
                { label: 'Orange', value: '#FF5722' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Scarf', 'Cape', 'Horn Ribbons', 'Tiny Sweater', 'None']
        },
        personalities: [
            { label: 'Ticklish', emoji: '🤭', description: 'giggling, wiggling, happy monster' },
            { label: 'Huggable', emoji: '🫂', description: 'soft, open arms, big friendly smile' },
            { label: 'Silly', emoji: '🤪', description: 'funny faces, multiple eyes blinking, playful' },
            { label: 'Shy', emoji: '🥺', description: 'hiding behind hands, peeking, bashful' },
            { label: 'Helpful', emoji: '🤝', description: 'eager to help, many hands working, polite' }
        ],
        hasEyes: true
    },
    Hamster: {
        hair: {
            label: "Fur Color",
            options: [
                { label: 'Golden', value: '#FFC107' },
                { label: 'Brown', value: '#795548' },
                { label: 'White', value: '#F5F5F5' },
                { label: 'Grey', value: '#9E9E9E' },
                { label: 'Mixed', value: 'linear-gradient(to right, #795548, #FFC107)' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Tiny Hat', 'Seed Bag', 'Mini Glasses', 'None']
        },
        personalities: [
            { label: 'Zippy', emoji: '⚡', description: 'running fast, energetic, twitching nose' },
            { label: 'Cheeky', emoji: '🐹', description: 'full cheeks, hoarding seeds, playful' },
            { label: 'Curious', emoji: '🕵️', description: 'sniffing around, standing on hind legs, exploring' },
            { label: 'Hungry', emoji: '🌻', description: 'always nibbling, excited for treats' },
            { label: 'Sleepy', emoji: '💤', description: 'buried in woodchips, cozy, tiny snores' }
        ],
        hasEyes: true
    },
    'Sea Turtle': {
        hair: {
            label: "Shell Color",
            options: [
                { label: 'Green', value: '#2E7D32' },
                { label: 'Teal', value: '#009688' },
                { label: 'Brown', value: '#5D4037' },
                { label: 'Teal Teal', value: '#4DB6AC' },
                { label: 'Ocean Blue', value: '#0277BD' }
            ]
        },
        skin: null,
        clothes: {
            label: "Accessories",
            options: ['Bow', 'Shell Stickers', 'Goggles', 'Flower', 'None']
        },
        personalities: [
            { label: 'Steady', emoji: '🐢', description: 'slow and steady, thoughtful, patient' },
            { label: 'Wise', emoji: '🧙', description: 'old soul, kind eyes, sharing stories' },
            { label: 'Adventurous', emoji: '🌊', description: 'swimming far, brave explorer, surfer vibes' },
            { label: 'Shy', emoji: '🙈', description: 'hiding in shell, peeking out, quiet' },
            { label: 'Happy', emoji: '😊', description: 'smiling, bobbing along, peaceful' }
        ],
        hasEyes: true
    }
}

const DEFAULT_PERSONALITY = { label: 'Cheerful', emoji: '😊', description: 'always smiling, warm presence' };

const EYE_COLORS = [
    { label: 'Brown', value: '#5D4037' },
    { label: 'Blue', value: '#2196F3' },
    { label: 'Green', value: '#4CAF50' },
    { label: 'Hazel', value: '#dcb163' },
    { label: 'Black', value: '#1a1a1a' }
];

// STORY_IDEAS removed in favor of AI-driven Surprise Me

const ART_STYLES = [
    {
        id: '3d-pixar',
        label: '3D Pixar Adventure',
        prompt: 'Stylized 3D animated character illustration of [Subject] in a whimsical movie style. Soft rim lighting, vibrant cinematic colors, smooth toon-shaded surfaces, clean 3D render, high-res children\'s digital art, no photorealism, no realistic human skin.',
        preview: '/assets/styles/3d-pixar.png'
    },
    {
        id: 'watercolor',
        label: 'Watercolor Dreams',
        prompt: 'Artistic whimsical watercolor illustration of [Subject]. Gentle washes of paint, visible hand-painted brush strokes, heavy cold-press paper texture, soft bleeds, nostalgic storybook atmosphere, no photography, no realism.',
        preview: '/assets/styles/watercolor.png'
    },
    {
        id: 'fantasy',
        label: 'Whimsical Fantasy',
        prompt: 'Enchanting whimsical digital painting of [Subject]. Painterly texture, dreamlike lighting, magical sparkles, rich deep colors, stylized character proportions, storybook aesthetic, no photorealistic features.',
        preview: '/assets/styles/fantasy.png'
    },
    {
        id: 'pencil',
        label: 'Classic Pencil Sketch',
        prompt: 'Hand-drawn stylized pencil sketch illustration of [Subject]. Expressive dark graphite lines, soft charcoal shading, visible paper grain, subtle artistic color washes, classic sketchbook feel, no photographic qualities.',
        preview: '/assets/styles/pencil.png'
    },
    {
        id: 'flat',
        label: 'Modern Flat Design',
        prompt: 'Stylized minimalist vector-style flat design illustration of [Subject]. Bold geometric shapes, clean sharp lines, limited high-contrast color palette, simple 2D shapes, modern commercial illustration style, no 3D shading, no photorealism.',
        preview: '/assets/styles/flat.png'
    },
    {
        id: 'collage',
        label: 'Cut Paper Collage',
        prompt: 'Physical layered cut-paper collage illustration of [Subject]. Crafted from vibrant cardstock, sharp hand-cut paper edges, visible paper textures, 3D paper layers with physical shadows, handmade artistic style, no photorealism.',
        preview: '/assets/styles/collage.png'
    }
];


export default function StorybookCreator({ ageLevel, spanishLevel }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [savedCharacters, setSavedCharacters] = useState([]);
    const [showLoadModal, setShowLoadModal] = useState(false);

    const [userId, setUserId] = useState(null);

    // Get User ID
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
            }
        });
    }, []);

    // Load saved data when user is ready
    useEffect(() => {
        if (userId) {
            const saved = getSavedCharacters();
            setSavedCharacters(saved);
        }
    }, [userId]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    // State
    const [characters, setCharacters] = useState([
        { id: 1, name: '', type: 'Kid', hair: 'Brown', eyes: 'Brown', skin: 'Medium', clothes: 'Red Shirt', personality: 'Silly' }
    ]);
    const [plot, setPlot] = useState('');
    const [settingAnchor, setSettingAnchor] = useState('');
    const [readingTime, setReadingTime] = useState(5);
    const [language, setLanguage] = useState('Spanish'); // English, Spanish, Bilingual
    const [isTestMode, setIsTestMode] = useState(false); // New Test Mode state
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStatus, setGenStatus] = useState('');
    const [imageModel, setImageModel] = useState('google'); // 'google', 'getimg', 'pixeldojo', 'all'
    const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);
    const [searchParams] = useSearchParams();
    const [previousStory, setPreviousStory] = useState(null);
    const [previewPages, setPreviewPages] = useState([]); // Real-time preview
    const [storageWarning, setStorageWarning] = useState(null); // { isNearLimit: bool, percentage: num }
    const [storyData, setStoryData] = useState(null); // Track the generated story structure
    const [masterPortraits, setMasterPortraits] = useState({}); // { charId: [imageUrl1, imageUrl2, ...], selected: imageUrl }
    const [isGeneratingPortraits, setIsGeneratingPortraits] = useState(false);
    const [isGeneratingPlot, setIsGeneratingPlot] = useState(false);

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showModal = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type });
    };

    const handleAISurpriseMe = async () => {
        setIsGeneratingPlot(true);
        try {
            const charNames = characters.map(c => c.name || `the ${c.type}`).join(', ');
            const systemPrompt = `You are a professional children's book author. Given a list of characters, invent a single, whimsical, and highly creative 1-sentence story idea. 
            Keep it brief (max 25 words), magical, and ensure it features the characters provided. 
            Output ONLY the story sentence. No intro, no quotes, no conversational filler.`;

            const userPrompt = `Characters: ${charNames}. Tell me a magical story idea!`;
            const response = await getChatResponse([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            const suggestion = response?.message?.content;

            if (suggestion) {
                setPlot(suggestion.replace(/^"|"$/g, '').trim());
            }
        } catch (error) {
            console.error("Failed to generate plot idea:", error);
            showModal("Oops!", "Lumi's imagination took a nap. Try again!", "error");
        } finally {
            setIsGeneratingPlot(false);
        }
    };

    // Initial load: Check if we are continuing an adventure or have a story seed
    useEffect(() => {
        const fetchContinue = async () => {
            const continueId = searchParams.get('continueFrom');

            // Check for Story Seed first (Nightly Ritual)
            const seedStr = localStorage.getItem('LUNALIBRO_STORY_SEED');
            if (seedStr) {
                try {
                    const seed = JSON.parse(seedStr);
                    setPlot(`Continuing our adventure from the ${seed.title}! ${seed.promptSnippet}`);
                    // Optionally clear the seed so it doesn't pop up again unless a new session happens
                    // localStorage.removeItem('LUNALIBRO_STORY_SEED'); 
                } catch (e) {
                    console.error("Failed to parse story seed", e);
                }
            }

            if (continueId && userId) {
                const story = await getStorybookById(userId, continueId);
                if (story) {
                    setPreviousStory(story);
                    setCharacters(story.characters || characters);
                    setLanguage(story.language || 'Spanish');
                    setStep(2);
                }
            }
        }
        fetchContinue();
    }, [searchParams, userId]);

    const addCharacter = () => {
        const newCharacter = {
            id: Date.now(),
            name: '',
            type: 'Kid',
            hair: CHARACTER_OPTIONS['Kid'].hair.options[0].label,
            eyes: 'Brown',
            skin: CHARACTER_OPTIONS['Kid'].skin.options[0].label,
            clothes: CHARACTER_OPTIONS['Kid'].clothes.options[0],
            personality: CHARACTER_OPTIONS['Kid'].personalities[0].label
        };
        setCharacters([...characters, newCharacter]);
    };

    const handleSaveCharacter = (char) => {
        if (!char.name) return showModal("Whoops!", "Please give your character a name first!", "warning");

        // Storage Guard check
        const quota = checkStorageQuota();
        if (quota.isNearLimit) {
            setStorageWarning(quota);
            return;
        }

        const currentPortrait = masterPortraits[char.id]?.selected;
        const portraitsMap = { ...(char.portraits || {}) };

        if (currentPortrait) {
            portraitsMap[selectedStyle.id] = currentPortrait;
        }

        const charToSave = {
            ...char,
            portraits: portraitsMap,
            // portraitUrl remains as a fallback for the UI or legacy items
            portraitUrl: currentPortrait || char.portraitUrl || Object.values(portraitsMap)[0] || null
        };

        saveCharacter(charToSave);
        setSavedCharacters(getSavedCharacters());
        showModal("Magic Saved!", `${char.name} is now in your collection!`, "success");
    };

    const handleLoadCharacter = (savedChar) => {
        // Replace the first character or add a new one
        if (characters.length === 1 && characters[0].name === '') {
            setCharacters([savedChar]);
        } else {
            setCharacters([...characters, savedChar]);
        }

        // Restore portrait if it exists
        // Restore portrait for the CURRENT style specifically
        const styleMatch = savedChar.portraits?.[selectedStyle.id];

        if (styleMatch) {
            setMasterPortraits(prev => ({
                ...prev,
                [savedChar.id]: {
                    selected: styleMatch,
                    candidates: [styleMatch]
                }
            }));
        } else {
            // Clear current session portrait if it's from a different world
            setMasterPortraits(prev => {
                const next = { ...prev };
                delete next[savedChar.id];
                return next;
            });
        }

        setShowLoadModal(false);
    };

    const updateCharacter = (id, field, value) => {
        setCharacters(characters.map(c => {
            if (c.id !== id) return c;

            let updates = { [field]: value };

            // If changing type, reset attributes to defaults for that type
            if (field === 'type') {
                updates.hair = CHARACTER_OPTIONS[value].hair.options[0].label;
                if (CHARACTER_OPTIONS[value].skin) {
                    updates.skin = CHARACTER_OPTIONS[value].skin.options[0].label;
                } else {
                    updates.skin = null; // Clear skin if new type doesn't have it
                }
                updates.clothes = CHARACTER_OPTIONS[value].clothes.options[0];
                updates.personality = CHARACTER_OPTIONS[value].personalities[0].label;
            }

            return { ...c, ...updates };
        }));
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => { });
    };

    const removeCharacter = (id) => {
        if (characters.length > 1) {
            setCharacters(characters.filter(c => c.id !== id));
        }
    };

    /**
     * Phase 2: Generate candidate portraits for all characters.
     */
    const handleGeneratePortraits = async () => {
        if (isGeneratingPortraits) return;

        setIsGeneratingPortraits(true);
        const newPortraits = { ...masterPortraits };

        try {
            for (const char of characters) {
                // Skip if already has portraits (optional: check if user wants to re-generate)
                if (newPortraits[char.id]?.candidates?.length > 0) continue;

                setGenStatus(`Painting portraits for ${char.name}...`);
                const candidates = await generateCandidatePortraits(char, selectedStyle);

                newPortraits[char.id] = {
                    candidates: candidates,
                    selected: candidates[0] // Default to first
                };
            }
            setMasterPortraits(newPortraits);
            showModal("Heroes are Ready!", "Candidate portraits have been generated. Pick your favorites!", "success");
        } catch (error) {
            console.error("Portrait generation failed:", error);
            showModal("Oops!", "We had trouble painting the portraits. Please try again.", "error");
        } finally {
            setIsGeneratingPortraits(false);
            setGenStatus('');
        }
    };

    const handleSelectPortrait = (charId, portrait) => {
        setMasterPortraits(prev => ({
            ...prev,
            [charId]: {
                ...prev[charId],
                selected: portrait
            }
        }));
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { });
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenStatus("Weaving the plot...");
        setPreviewPages([]);

        const charSummary = characters.map(c => {
            const robotDetails = c.type === 'Robot' ? `, a mechanical being with a metallic silver body, visible brass gears, and glowing blue LED eyes` : '';
            const speciesDesc = c.type === 'Kid' ? 'stylized human child' : c.type === 'Adult' ? 'stylized human adult' : c.type;
            const personality = CHARACTER_OPTIONS[c.type].personalities.find(p => p.label === c.personality) || DEFAULT_PERSONALITY;
            return `[CHARACTER INFO NAME: ${c.name} | SPECIES: ${c.type} | PERSONALITY: ${c.personality} (${personality.description}) | MANDATORY VISUAL DESCRIPTION: A cute ${speciesDesc}${robotDetails} with ${c.hair} hair/color, ${c.eyes} eyes, ${c.skin} skin tone, wearing ${c.clothes}]`;
        }).join('\n');

        const pageLimit = isTestMode ? "EXACTLY 1 page" : "5-7 pages";

        let continuationContext = "";
        if (previousStory && previousStory.pages) {
            continuationContext = `
            THIS IS A SEQUEL. 
            Previous Title: ${previousStory.title}
            Previous Plot Summary: ${previousStory.plot}
            Context: The children want to continue this adventure but change the scenery/location for this new book.
            Previously in this adventure: ${previousStory.pages[previousStory.pages.length - 1].spanishText || previousStory.pages[previousStory.pages.length - 1].text}
            `;
        }

        const systemPrompt = `You are a world-class, award-winning children's book author and magical illustrator. 
            YOUR MISSION: Create a ${readingTime} minute story for a child (Age: ${ageLevel}) that is CAPTIVATING, JOYFUL, and MAGICAL.
            
            STORY STRUCTURE RULES:
            - BEGINNING: Set the scene and introduce the characters with warmth. Establish a sense of wonder.
            - MIDDLE: Introduce a small obstacle, a mystery, or a playful challenge that the characters must solve together.
            - END: A heartwarming and satisfying resolution that leaves the child feeling happy and inspired.
            - PACING: Do not be "matter of fact". Use descriptive, sensory language (sights, sounds, feelings).
            - TEXT LENGTH: Each page should have 3-5 RICH sentences. It is better to have more descriptive text than short, dry facts. Use natural, engaging Spanish at the ${spanishLevel} level.

            ${charSummary}

            SETTING (MANDATORY LOCATION LOCK): 
            ${settingAnchor ? settingAnchor : 'Determine a fitting setting based on the plot theme and lock it for the entire story.'}

            PLOT THEME: ${plot}
            TARGET SPANISH LEVEL: ${spanishLevel}
            
            FORMAT: Output ONLY a valid JSON object.
            SCHEMA:
            {
              "title": "Title",
              "coverImagePrompt": "A stunning, high-interest cover illustration that would make a child gasp with joy. [Style Description]",
              "pages": [
                {
                  "spanishText": "Story text in natural, rich, and engaging Spanish",
                  "englishText": "English translation",
                  "imagePrompt": "A truly magical and atmospheric visual description. Focus on expressions of wonder, beautiful lighting, and whimsical details that capture a child's imagination."
                }
              ],
              "vocabulary": [{"spanish": "word", "english": "translation"}]
            }

            CRITICAL CHARACTER SEPARATION & VISUAL MAGIC:
            When creating "imagePrompt", you MUST describe EVERY character present using their full "MANDATORY VISUAL DESCRIPTION". 
            - NO DRY PROMPTS: Instead of "A turtle in the water", use "A cute Sea Turtle with a vibrant green shell and sparkly stickers swimming through a glowing, crystal-blue magical tidepool, his face filled with pure joy."
            - EXPRESSIONS: Always describe the characters' emotions (e.g., "wide eyes filled with wonder", "a mischievous giggle", "a warm, gentle smile").
            - DYNAMICS: Characters should be doing something magical or active, not just standing there.
            - FORMAT: "A [Visual Description] named [Name] and a [Visual Description] named [Name]..."

            PHASE 3: ILLUSTRATOR'S DIRECTION:
            1. SETTING ANCHOR: Refer to the specific location details (e.g., "sparkling dust in the attic", "glowing coral in the sea") consistently in every page.
            2. COMPOSITION: Use "Cinematic lighting", "Soft glow", "Vibrant colors", and "Perspective: Wide/Medium/Close-up" to guide the art.
            3. ROSTER: Use ONLY the provided characters: ${characters.map(c => c.name).join(', ')}.
            4. STYLE ADHERENCE: All characters, especially humans, MUST strictly follow the ${selectedStyle.label} aesthetic. Never use photorealistic features for humans.

            VISUAL POLISH:
            - NO text, letters, or watermarks in the image prompts.
            - Ensure wide-angle "master shots" to capture the environment and characters.
            `;

        try {
            const response = await getChatResponse([{ role: 'system', content: systemPrompt }], 'gpt-4o');

            if (!response?.message?.content) {
                throw new Error("Lumi was unable to weave this story.");
            }

            let content = response.message.content;
            const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

            // Cleanup JSON
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstOpen = content.indexOf('{');
            const lastClose = content.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                content = content.substring(firstOpen, lastClose + 1);
            }

            let parsedStoryData = JSON.parse(content);

            if (!parsedStoryData.pages || parsedStoryData.pages.length === 0) {
                throw new Error("Story generated but has no pages!");
            }

            setStoryData(parsedStoryData);

            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const modelsToRun = imageModel === 'all' ? ['google', 'getimg', 'pixeldojo'] : [imageModel];

            for (const currentModel of modelsToRun) {
                const generatedPages = [];
                const modelLabel = currentModel === 'google' ? 'Google' : currentModel === 'getimg' ? 'GetImg' : 'PixelDojo';

                setGenStatus(`[${modelLabel}] Painting the cover...`);
                let coverImage = null;
                try {
                    if (currentModel === 'google') coverImage = await generateStoryImage(parsedStoryData.coverImagePrompt);
                    else if (currentModel === 'getimg') coverImage = await generateGetImgImage(parsedStoryData.coverImagePrompt);
                    else if (currentModel === 'pixeldojo') coverImage = await generatePixelDojoImage(parsedStoryData.coverImagePrompt);
                    else if (currentModel === 'leonardo') {
                        const refs = Object.values(masterPortraits).map(p => p.selected).filter(ref => !!ref?.id);
                        coverImage = await generateLeonardoImage(parsedStoryData.coverImagePrompt, refs);
                    }
                } catch (e) { console.error("Cover failed", e); }

                if (!coverImage || coverImage.length < 100) {
                    coverImage = `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1000&text=${encodeURIComponent(parsedStoryData.title)}`;
                }

                generatedPages.push({
                    text: parsedStoryData.title, // Keep title in 'text' for backward compatibility
                    spanishText: parsedStoryData.title,
                    image: coverImage
                });
                setPreviewPages([...generatedPages]);

                for (let i = 0; i < parsedStoryData.pages.length; i++) {
                    const page = parsedStoryData.pages[i];
                    setGenStatus(`[${modelLabel}] Painting page ${i + 1} of ${parsedStoryData.pages.length}...`);

                    await sleep(currentModel === 'google' ? 3000 : 1500);

                    let pageImage = null;
                    try {
                        if (currentModel === 'google') pageImage = await generateStoryImage(page.imagePrompt);
                        else if (currentModel === 'getimg') pageImage = await generateGetImgImage(page.imagePrompt);
                        else if (currentModel === 'pixeldojo') pageImage = await generatePixelDojoImage(page.imagePrompt);
                        else if (currentModel === 'leonardo') {
                            // PHASE 4: Presence Detection
                            // Only include references for characters actually mentioned in the prompt.
                            // We sort them by their appearance in the prompt to pick the focal character first.
                            const focusedChars = characters
                                .map(char => ({
                                    char,
                                    index: page.imagePrompt.toLowerCase().indexOf(char.name.toLowerCase())
                                }))
                                .filter(item => item.index !== -1)
                                .sort((a, b) => a.index - b.index);

                            const refs = focusedChars
                                .map(item => masterPortraits[item.char.id]?.selected)
                                .filter(ref => !!ref?.id);

                            // If no names found, fallback to all selected portraits
                            const finalRefs = refs.length > 0 ? refs : Object.values(masterPortraits).map(p => p.selected).filter(ref => !!ref?.id);

                            pageImage = await generateLeonardoImage(page.imagePrompt, finalRefs);
                        }
                    } catch (e) { console.error(`Page ${i + 1} failed`, e); }

                    if (!pageImage || pageImage.length < 100) {
                        pageImage = `https://images.unsplash.com/photo-1512418490979-92798ccc9340?auto=format&fit=crop&q=80&w=1000&text=Page+${i + 1}`;
                    }

                    generatedPages.push({
                        text: page.spanishText || page.text, // Added for UI compatibility
                        spanishText: page.spanishText,
                        englishText: page.englishText,
                        image: pageImage,
                        imagePrompt: page.imagePrompt
                    });
                    setPreviewPages([...generatedPages]);
                }

                if (generatedPages.length > 0) {
                    const finalBook = {
                        id: Date.now().toString() + Math.random().toString().substring(2, 5),
                        title: imageModel === 'all' ? `${parsedStoryData.title} (${modelLabel})` : parsedStoryData.title,
                        pages: generatedPages,
                        characters,
                        plot,
                        language,
                        coverImagePrompt: parsedStoryData.coverImagePrompt,
                        seriesId: previousStory?.seriesId || Date.now().toString()
                    };

                    if (userId) {
                        setGenStatus(`[${modelLabel}] Saving...`);
                        await saveStorybook(finalBook, userId);
                        try {
                            await supabase.from('story_generations').insert({
                                id: finalBook.id, user_id: userId, title: finalBook.title,
                                page_count: finalBook.pages.length, language: finalBook.language,
                                created_at: new Date().toISOString(),
                                details: { model: currentModel, tokens: usage }
                            });
                        } catch (logErr) { console.error("Admin log failed", logErr); }
                    }
                }
            }
            setStoryData(null);
            navigate('/bookshelf');
        } catch (error) {
            console.error("Story generation failed:", error);
            showModal("The magic hit a snag!", "Please try again!", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)',
            padding: '2rem 1rem 8rem',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Immersive Attic Background Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'url(/the_lantern_room_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.1,
                filter: 'blur(20px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <style>
                {`
                @keyframes float-slow {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(1deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .floating-workshop {
                    animation: float-slow 6s ease-in-out infinite;
                }
                .magic-paper-premium {
                    background: rgba(255, 255, 255, 0.85) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.05) !important;
                }
                .hall-of-heroes {
                    display: flex;
                    gap: 1.2rem;
                    overflow-x: auto;
                    padding: 1rem 0.5rem 2rem;
                    margin: 0 -0.5rem;
                    scrollbar-width: none;
                }
                .hall-of-heroes::-webkit-scrollbar { display: none; }
                .hero-mini-card {
                    flex: 0 0 150px;
                    background: white;
                    border-radius: 24px;
                    padding: 1.2rem;
                    text-align: center;
                    border: 2px solid #F1F5F9;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                }
                .hero-mini-card:hover {
                    transform: translateY(-8px);
                    border-color: #8B5CF6;
                    box-shadow: 0 15px 30px rgba(139, 92, 246, 0.15);
                }
                .hero-invite-btn {
                    margin-top: 0.8rem;
                    background: #F5F3FF;
                    color: #8B5CF6;
                    border: none;
                    min-height: 44px;
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 0.9rem;
                    width: 100%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                }
                .hero-mini-card:hover .hero-invite-btn {
                    background: #8B5CF6;
                    color: white;
                }
                /* Passport styles */
                .passport-card {
                    background: white;
                    border-radius: 35px !important;
                    border: 2px solid #F1F5F9 !important;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important;
                }
                .passport-header {
                    background: #F8FAFC;
                    padding: 1.2rem 2rem;
                    border-bottom: 2px solid #F1F5F9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .attribute-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                    padding: 2.5rem;
                }
                .attribute-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .attribute-label {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                
                /* Mobile Responsive Overrides */
                @media (max-width: 768px) {
                    .magic-paper-premium {
                        padding: 1.5rem !important;
                        border-radius: 30px !important;
                    }
                    .workshop-title {
                        font-size: 2.2rem !important;
                    }
                    .workshop-subtitle {
                        font-size: 1rem !important;
                    }
                    .step-indicator-container {
                        gap: 0.8rem !important;
                        margin-bottom: 2rem !important;
                    }
                    .step-indicator-item {
                        width: 40px !important;
                        height: 40px !important;
                        min-width: 40px !important;
                        min-height: 40px !important;
                    }
                    .step-indicator-item svg {
                        size: 16px !important;
                        width: 16px !important;
                        height: 16px !important;
                    }
                    .attribute-grid {
                        grid-template-columns: 1fr !important;
                        padding: 1.5rem !important;
                        gap: 1.5rem !important;
                    }
                    .passport-header {
                        padding: 1rem 1.2rem !important;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .passport-header > div:last-child {
                        width: 100%;
                        justify-content: flex-end;
                    }
                    .style-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .nav-buttons {
                        flex-direction: column-reverse !important;
                    }
                    .personality-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .attribute-row[style*="grid-column: span 2"] {
                        grid-column: span 1 !important;
                    }
                    .appearance-subgrid {
                        grid-template-columns: 1fr !important;
                        padding: 1.5rem !important;
                        gap: 2.5rem !important;
                        background: transparent !important;
                    }
                    .attribute-section-card {
                        background: white;
                        border-radius: 20px;
                        padding: 1.2rem;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                        border: 1px solid #f1f5f9;
                    }
                    .attribute-row {
                        gap: 1.5rem !important;
                    }
                    .hero-invite-btn {
                        min-height: 48px;
                    }
                    .personality-grid button {
                        min-height: 54px;
                        font-size: 1rem !important;
                    }
                    .portrait-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .choice-buttons {
                        flex-direction: column !important;
                    }
                    .choice-buttons button {
                        width: 100% !important;
                    }
                }
                `}
            </style>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: '800px', margin: '0 auto' }}
            >
                <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
                        <button
                            onClick={() => navigate('/bookshelf')}
                            style={{
                                background: 'white', border: '1px solid #e2e8f0', padding: '0.6rem 1rem',
                                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                color: '#64748B', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <ArrowLeft size={18} /> Back to Library
                        </button>
                    </div>
                    <div className="floating-workshop" style={{ display: 'inline-flex', background: 'white', color: '#8B5CF6', padding: '1.2rem', borderRadius: '30px', marginBottom: '1.5rem', boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)', border: '4px solid #F59E0B' }}>
                        <Sparkles size={40} className="glowing-lantern" />
                    </div>
                    <h1 className="workshop-title" style={{ fontSize: '3rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        The Story <span style={{ color: '#8B5CF6' }}>Workshop</span>
                    </h1>
                    <p className="workshop-subtitle" style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '600px', margin: '0 auto', fontWeight: '500' }}>
                        Design your cast and set the scene for a brand new adventure!
                    </p>
                </header>



                <div className="card magic-paper magic-paper-premium" style={{ borderRadius: '40px' }}>
                    <div className="step-indicator-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="step-indicator-item" style={{
                                width: '48px', height: '48px',
                                minWidth: '48px', minHeight: '48px',
                                flexShrink: 0,
                                borderRadius: '50%',
                                background: step >= i ? '#8B5CF6' : 'white',
                                color: step >= i ? 'white' : '#94A3B8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '900',
                                fontSize: '1.2rem',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: step === i ? 'scale(1.15)' : 'scale(1)',
                                boxShadow: step === i ? '0 10px 25px rgba(139, 92, 246, 0.3)' : '0 4px 10px rgba(0,0,0,0.05)',
                                border: step >= i ? '3px solid #8B5CF6' : '3px solid #E2E8F0',
                                cursor: i < step ? 'pointer' : 'default'
                            }} onClick={() => i < step && setStep(i)}>
                                {i === 1 ? <Palette size={20} /> : i === 2 ? <UserPlus size={20} /> : i === 3 ? <Smile size={20} /> : i === 4 ? <Sparkles size={20} /> : <BookOpen size={20} />}
                            </div>
                        ))}
                    </div>

                    {previousStory && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: '#f0f9ff',
                                border: '2px solid #bae6fd',
                                borderRadius: '15px',
                                padding: '0.8rem 1.2rem',
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem'
                            }}
                        >
                            <BookOpen size={18} color="#0369a1" />
                            <p style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: '600' }}>
                                Continuing Sequel to: <strong>{previousStory.title}</strong>
                            </p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem' }}>1. Choose Your World Style 🎨</h2>
                                    <p style={{ color: '#64748B', fontSize: '0.95rem' }}>The visual "soul" of your story begins here.</p>
                                </div>
                                <div className="style-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
                                    {ART_STYLES.map((style) => (
                                        <motion.div
                                            key={style.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setSelectedStyle(style);
                                                Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { });
                                            }}
                                            style={{
                                                background: 'white',
                                                borderRadius: '24px',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                border: selectedStyle.id === style.id ? '3px solid #8B5CF6' : '2px solid #F1F5F9',
                                                boxShadow: selectedStyle.id === style.id ? '0 10px 20px rgba(139, 92, 246, 0.1)' : '0 4px 10px rgba(0,0,0,0.02)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ aspectRatio: '1/1', borderRadius: '15px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {style.preview ? (
                                                    <img src={style.preview} alt={style.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Palette size={32} color={selectedStyle.id === style.id ? '#8B5CF6' : '#CBD5E1'} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: '800', fontSize: '1rem', color: selectedStyle.id === style.id ? '#8B5CF6' : '#1F2937', textAlign: 'center' }}>
                                                {style.label}
                                            </div>
                                            {selectedStyle.id === style.id && (
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#8B5CF6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle size={14} />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '20px', fontSize: '1.2rem', background: '#8B5CF6' }} onClick={() => setStep(2)}>
                                    Next: Meet the Heroes <ArrowRight size={20} style={{ marginLeft: '1rem' }} />
                                </button>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>2. Assemble Your <span style={{ color: '#8B5CF6' }}>Cast</span> ⭐</h2>
                                    <p style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '500' }}>Add your favorites or build new friends for this story!</p>
                                </div>

                                {savedCharacters.length > 0 && (
                                    <div style={{ marginBottom: '3.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1E293B', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ padding: '6px', background: '#F59E0B', color: 'white', borderRadius: '8px' }}><Sparkles size={16} /></div>
                                            Saved Characters
                                        </div>
                                        <div className="hall-of-heroes">
                                            {savedCharacters.map(sc => (
                                                <motion.div
                                                    key={sc.id}
                                                    whileHover={{ y: -5 }}
                                                    className="hero-mini-card"
                                                    onClick={() => {
                                                        handleLoadCharacter(sc);
                                                        showModal("Added!", `${sc.name} joined the cast!`, "success");
                                                    }}
                                                >
                                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6', margin: '0 auto 1rem', border: '2px solid white', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.1)', overflow: 'hidden' }}>
                                                        {(() => {
                                                            const displayUrl = sc.portraits?.[selectedStyle.id] || sc.portraitUrl;
                                                            return displayUrl ? (
                                                                <img src={displayUrl} alt={sc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <User size={30} />
                                                            );
                                                        })()}
                                                    </div>
                                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1E293B', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginBottom: '0.5rem' }}>{sc.type}</div>

                                                    {/* Style Indicator */}
                                                    {sc.portraits?.[selectedStyle.id] ? (
                                                        <div style={{ fontSize: '0.65rem', color: '#10B981', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '0.8rem', fontWeight: '800' }}>
                                                            <Check size={10} style={{ marginRight: '2px' }} /> World Match
                                                        </div>
                                                    ) : sc.portraits && Object.keys(sc.portraits).length > 0 ? (
                                                        <div style={{ fontSize: '0.65rem', color: '#F59E0B', background: '#FFFBEB', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '0.8rem', fontWeight: '800' }}>
                                                            Another World
                                                        </div>
                                                    ) : <div style={{ marginBottom: '0.8rem', height: '1.2rem' }} />}

                                                    <button className="hero-invite-btn">
                                                        <UserPlus size={16} /> +Add
                                                    </button>
                                                </motion.div>
                                            ))}
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                onClick={addCharacter}
                                                style={{ flex: '0 0 150px', borderRadius: '24px', border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem', color: '#94A3B8' }}
                                            >
                                                <UserPlus size={24} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>New Hero</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '4rem' }}>
                                    {characters.map((char, index) => (
                                        <motion.div
                                            layout
                                            key={char.id}
                                            className="passport-card"
                                        >
                                            <div className="passport-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#8B5CF6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hero Identity</div>
                                                        <div style={{ fontWeight: '800', color: '#1E293B' }}>{char.name || "Unnamed Hero"}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    <button
                                                        onClick={() => handleSaveCharacter(char)}
                                                        title="Save to Library"
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F9FF', color: '#0EA5E9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    {characters.length > 1 && (
                                                        <button
                                                            onClick={() => removeCharacter(char.id)}
                                                            title="Remove Hero"
                                                            style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFF1F2', color: '#F43F5E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="attribute-grid">
                                                {/* Left Column: Basic Info */}
                                                <div className="attribute-row">
                                                    <label className="attribute-label"><User size={14} /> Character Name</label>
                                                    <input
                                                        value={char.name}
                                                        onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                                                        placeholder="e.g. Luna the Brave"
                                                        inputMode="text"
                                                        style={{ border: '2px solid #F1F5F9', padding: '1.2rem', borderRadius: '18px', width: '100%', fontSize: '1.1rem', fontWeight: '600', outline: 'none', transition: 'border-color 0.2s', minHeight: '54px' }}
                                                        onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                                                        onBlur={(e) => e.target.style.borderColor = '#F1F5F9'}
                                                    />

                                                    <div style={{ marginTop: '1rem' }}>
                                                        <PremiumSelect
                                                            label="Species / Type"
                                                            value={char.type}
                                                            options={['Kid', 'Adult', 'Dog', 'Cat', 'Robot', 'Dinosaur', 'Monster', 'Hamster', 'Sea Turtle']}
                                                            onChange={(val) => updateCharacter(char.id, 'type', val)}
                                                            icon={Ghost}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Personality Card */}
                                                <div className="attribute-row">
                                                    <label className="attribute-label"><Heart size={14} /> Personality & Vibe</label>
                                                    <div className="personality-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                                                        {CHARACTER_OPTIONS[char.type].personalities.map((p) => (
                                                            <button
                                                                key={p.label}
                                                                onClick={() => updateCharacter(char.id, 'personality', p.label)}
                                                                style={{
                                                                    padding: '0.8rem', borderRadius: '15px', border: '2px solid',
                                                                    borderColor: char.personality === p.label ? '#8B5CF6' : '#F1F5F9',
                                                                    backgroundColor: char.personality === p.label ? '#F5F3FF' : 'white',
                                                                    color: char.personality === p.label ? '#8B5CF6' : '#64748B',
                                                                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                                                                    display: 'flex', alignItems: 'center', gap: '0.6rem'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
                                                                <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{p.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Appearance Styling */}
                                                <div className="attribute-row" style={{ gridColumn: 'span 2' }}>
                                                    <div className="appearance-subgrid" style={{ padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                                                        {/* Dynamic Attributes based on Type */}
                                                        {CHARACTER_OPTIONS[char.type]?.hair && (
                                                            <div className="attribute-section-card">
                                                                <label className="attribute-label" style={{ marginBottom: '1rem' }}><Palette size={14} /> {CHARACTER_OPTIONS[char.type].hair.label}</label>
                                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                                    {CHARACTER_OPTIONS[char.type].hair.options.map((opt, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            onClick={() => updateCharacter(char.id, 'hair', opt.label)}
                                                                            style={{
                                                                                cursor: 'pointer', width: '3rem', height: '3rem', borderRadius: '50%',
                                                                                backgroundColor: opt.value,
                                                                                border: char.hair === opt.label ? '3px solid #8B5CF6' : '3px solid #f1f5f9',
                                                                                boxShadow: char.hair === opt.label ? '0 0 0 3px rgba(139, 92, 246, 0.2)' : 'none',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                                                                position: 'relative'
                                                                            }}
                                                                            whileHover={{ scale: 1.1, borderColor: '#8B5CF6' }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            title={opt.label}
                                                                        >
                                                                            {char.hair === opt.label && (
                                                                                <div style={{ background: '#8B5CF6', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '-5px', right: '-5px', border: '2px solid white' }}>
                                                                                    <Check size={12} color="white" strokeWidth={4} />
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {CHARACTER_OPTIONS[char.type]?.hasEyes && (
                                                            <div className="attribute-section-card">
                                                                <label className="attribute-label" style={{ marginBottom: '1rem' }}><Zap size={14} /> Eye Color</label>
                                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                                    {EYE_COLORS.map((opt, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            onClick={() => updateCharacter(char.id, 'eyes', opt.label)}
                                                                            style={{
                                                                                cursor: 'pointer', width: '2.8rem', height: '2.8rem', borderRadius: '50%',
                                                                                backgroundColor: opt.value,
                                                                                border: char.eyes === opt.label ? '3px solid #8B5CF6' : '3px solid #f1f5f9',
                                                                                boxShadow: char.eyes === opt.label ? '0 0 0 3px rgba(139, 92, 246, 0.2)' : 'none',
                                                                                position: 'relative',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                            whileHover={{ scale: 1.1, borderColor: '#8B5CF6' }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            title={opt.label}
                                                                        >
                                                                            <div style={{ position: 'absolute', top: '30%', left: '30%', width: '40%', height: '40%', background: 'black', borderRadius: '50%' }}></div>
                                                                            {char.eyes === opt.label && (
                                                                                <div style={{ background: '#8B5CF6', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '-5px', right: '-5px', border: '2px solid white', zIndex: 2 }}>
                                                                                    <Check size={10} color="white" strokeWidth={4} />
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {CHARACTER_OPTIONS[char.type]?.skin && (
                                                            <div className="attribute-section-card">
                                                                <label className="attribute-label" style={{ marginBottom: '1rem' }}><Palette size={14} /> {CHARACTER_OPTIONS[char.type].skin.label}</label>
                                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                                    {CHARACTER_OPTIONS[char.type].skin.options.map((opt, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            onClick={() => updateCharacter(char.id, 'skin', opt.label)}
                                                                            style={{
                                                                                cursor: 'pointer', width: '3rem', height: '3rem', borderRadius: '50%',
                                                                                backgroundColor: opt.value,
                                                                                border: char.skin === opt.label ? '3px solid #8B5CF6' : '3px solid #f1f5f9',
                                                                                boxShadow: char.skin === opt.label ? '0 0 0 3px rgba(139, 92, 246, 0.2)' : 'none',
                                                                                transition: 'all 0.2s',
                                                                                position: 'relative'
                                                                            }}
                                                                            whileHover={{ scale: 1.1, borderColor: '#8B5CF6' }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            title={opt.label}
                                                                        >
                                                                            {char.skin === opt.label && (
                                                                                <div style={{ background: '#8B5CF6', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '-5px', right: '-5px', border: '2px solid white' }}>
                                                                                    <Check size={12} color="white" strokeWidth={4} />
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {CHARACTER_OPTIONS[char.type]?.clothes && (
                                                            <div className="attribute-section-card" style={{ gridColumn: 'span 2' }}>
                                                                <label className="attribute-label" style={{ marginBottom: '1rem' }}><Palette size={14} /> {CHARACTER_OPTIONS[char.type].clothes.label}</label>
                                                                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                                    {CHARACTER_OPTIONS[char.type].clothes.options.map((opt, i) => (
                                                                        <motion.button
                                                                            key={i}
                                                                            onClick={() => updateCharacter(char.id, 'clothes', opt)}
                                                                            whileHover={{ scale: 1.02, backgroundColor: char.clothes === opt ? '#7C3AED' : '#f1f5f9' }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            style={{
                                                                                padding: '0.8rem 1.4rem', borderRadius: '15px',
                                                                                backgroundColor: char.clothes === opt ? '#8B5CF6' : 'white',
                                                                                color: char.clothes === opt ? 'white' : '#475569',
                                                                                border: char.clothes === opt ? '2px solid #8B5CF6' : '2px solid #F1F5F9',
                                                                                fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                                                                minHeight: '44px',
                                                                                boxShadow: char.clothes === opt ? '0 4px 10px rgba(139, 92, 246, 0.2)' : 'none'
                                                                            }}
                                                                        >
                                                                            {opt}
                                                                        </motion.button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        onClick={addCharacter}
                                        style={{ background: '#F8FAFC', padding: '2rem', borderRadius: '30px', border: '3px dashed #E2E8F0', textAlign: 'center', cursor: 'pointer' }}
                                    >
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                                            <UserPlus size={28} />
                                        </div>
                                        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#1E293B' }}>Add Another Hero</div>
                                        <div style={{ color: '#64748B', fontWeight: '500' }}>The more friends, the bigger the adventure!</div>
                                    </motion.div>
                                </div>

                                <div className="nav-buttons" style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '1.2rem', borderRadius: '20px' }} onClick={() => setStep(1)}>
                                        <ArrowLeft size={20} style={{ marginRight: '0.8rem' }} /> Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 2, padding: '1.2rem', borderRadius: '20px', fontSize: '1.2rem', background: '#8B5CF6' }} onClick={() => setStep(3)}>
                                        Next: Meet the Heroes <ArrowRight size={20} style={{ marginLeft: '1rem' }} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem' }}>3. Meet Your Heroes ⭐</h2>
                                    <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Pick the perfect look for your cast members!</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                                    {characters.map((char) => (
                                        <div key={char.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '2px solid #F1F5F9' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '1rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6' }} />
                                                The look of {char.name} ({char.type})
                                            </div>

                                            <div className="portrait-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                {(masterPortraits[char.id]?.candidates || [1, 2, 3]).map((item, i) => {
                                                    const isCandidate = typeof item === 'object' && item !== null && item.url;
                                                    const isSelected = masterPortraits[char.id]?.selected?.id === item.id;

                                                    return (
                                                        <motion.div
                                                            key={i}
                                                            whileHover={isCandidate ? { scale: 1.05 } : {}}
                                                            whileTap={isCandidate ? { scale: 0.95 } : {}}
                                                            onClick={() => isCandidate && handleSelectPortrait(char.id, item)}
                                                            style={{
                                                                aspectRatio: '1/1',
                                                                borderRadius: '50%',
                                                                background: '#F8FAFC',
                                                                border: isSelected ? '4px solid #8B5CF6' : '2px solid #F1F5F9',
                                                                position: 'relative',
                                                                overflow: 'visible',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: isCandidate ? 'pointer' : 'default',
                                                                transition: 'all 0.2s',
                                                                boxShadow: isSelected ? '0 10px 25px rgba(139, 92, 246, 0.3)' : 'none'
                                                            }}
                                                        >
                                                            {isCandidate ? (
                                                                <>
                                                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                                        <img src={item.url} alt="Candidate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-5px',
                                                                            right: '-5px',
                                                                            background: '#8B5CF6',
                                                                            color: 'white',
                                                                            borderRadius: '50%',
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            zIndex: 10,
                                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                                                            border: '2px solid white'
                                                                        }}>
                                                                            <Check size={16} strokeWidth={4} />
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <Loader size={20} className={isGeneratingPortraits ? "animate-spin text-slate-400" : "text-slate-200"} />
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                                <button
                                                    disabled={isGeneratingPortraits}
                                                    onClick={handleGeneratePortraits}
                                                    style={{
                                                        background: isGeneratingPortraits ? '#F1F5F9' : '#F5F3FF',
                                                        color: isGeneratingPortraits ? '#94A3B8' : '#8B5CF6',
                                                        border: 'none', padding: '0.8rem 1.5rem', borderRadius: '15px',
                                                        fontWeight: '800', fontSize: '0.95rem',
                                                        cursor: isGeneratingPortraits ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 auto'
                                                    }}
                                                >
                                                    {isGeneratingPortraits ? (
                                                        <><Loader size={18} className="animate-spin" /> Painting Heroes...</>
                                                    ) : (
                                                        <><Sparkles size={18} /> {masterPortraits[char.id]?.candidates ? "Redraw Portraits" : "Paint Candidate Portraits"}</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="nav-buttons" style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '1.2rem', borderRadius: '20px' }} onClick={() => setStep(2)}>
                                        <ArrowLeft size={20} style={{ marginRight: '0.8rem' }} /> Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 2, padding: '1.1rem', borderRadius: '20px', fontSize: '1.2rem', background: '#8B5CF6' }} onClick={() => setStep(4)}>
                                        Next: The Story Plot <ArrowRight size={20} style={{ marginLeft: '1rem' }} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '1.5rem' }}>4. The Big Idea 💡</h2>
                                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>What adventure will they go on today?</p>

                                <textarea
                                    value={plot}
                                    onChange={(e) => setPlot(e.target.value)}
                                    placeholder="e.g. They find a hidden candy castle in the clouds..."
                                    style={{ width: '100%', height: '140px', padding: '1.5rem', borderRadius: '25px', border: '3px solid #f1f5f9', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.5', transition: 'border-color 0.3s' }}
                                />

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Globe size={18} className="text-indigo-500" /> Where does it happen?
                                    </h3>
                                    <input
                                        type="text"
                                        value={settingAnchor}
                                        onChange={(e) => setSettingAnchor(e.target.value)}
                                        placeholder="e.g. A magical treehouse, The bottom of the ocean..."
                                        style={{ width: '100%', padding: '1.2rem', borderRadius: '20px', border: '3px solid #f1f5f9', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wand2 size={14} /> Need an idea?
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <button
                                            disabled={isGeneratingPlot}
                                            onClick={handleAISurpriseMe}
                                            style={{
                                                padding: '0.8rem 2rem', background: isGeneratingPlot ? '#F1F5F9' : '#FCD34D',
                                                border: '2px solid #F59E0B',
                                                borderRadius: '20px', fontSize: '1rem', color: isGeneratingPlot ? '#94A3B8' : '#92400E',
                                                cursor: isGeneratingPlot ? 'not-allowed' : 'pointer',
                                                fontWeight: '900', boxShadow: '0 4px 10px rgba(252, 211, 77, 0.4)',
                                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {isGeneratingPlot ? (
                                                <><Loader size={20} className="animate-spin" /> Dreaming...</>
                                            ) : (
                                                <>🎲 Surprise Me with AI!</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '3rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>How long is the story?</h3>
                                    <div className="choice-buttons" style={{ display: 'flex', gap: '1rem' }}>
                                        {[3, 5, 10].map(mins => (
                                            <button
                                                key={mins}
                                                onClick={() => setReadingTime(mins)}
                                                style={{
                                                    flex: 1, padding: '1rem', borderRadius: '15px',
                                                    background: readingTime === mins ? '#8B5CF6' : 'white',
                                                    color: readingTime === mins ? 'white' : '#64748B',
                                                    border: readingTime === mins ? 'none' : '2px solid #e2e8f0',
                                                    fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                {mins} Minutes
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="nav-buttons" style={{ display: 'flex', gap: '1.5rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '1.2rem', borderRadius: '20px' }} onClick={() => setStep(3)}>
                                        <ArrowLeft size={20} style={{ marginRight: '0.8rem' }} /> Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1, padding: '1.2rem', borderRadius: '20px', fontSize: '1.1rem', background: '#8B5CF6' }} onClick={() => setStep(5)}>
                                        Ready? <ArrowRight size={20} style={{ marginLeft: '0.8rem' }} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '1.5rem' }}>5. Ready to Read? 📖</h2>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <PremiumSelect
                                        label="Reading Language"
                                        value={language}
                                        options={['English', 'Spanish', 'Bilingual']}
                                        onChange={(val) => setLanguage(val)}
                                        icon={BookOpen}
                                    />
                                </div>

                                {/* Reading Preferences */}
                                <div style={{ marginBottom: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#eef2ff', borderRadius: '0.75rem', border: '1px solid #e0e7ff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Wand2 style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Test Mode</p>
                                                <p style={{ fontSize: '0.75rem', color: '#4f46e5' }}>Generate just 1 page (saves credits!)</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsTestMode(!isTestMode)}
                                            style={{
                                                width: '3rem', height: '1.5rem', borderRadius: '9999px', transitionProperty: 'background-color', position: 'relative',
                                                backgroundColor: isTestMode ? '#4f46e5' : '#d1d5db'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: '0.25rem', width: '1rem', height: '1rem', backgroundColor: 'white', borderRadius: '9999px', transitionProperty: 'transform',
                                                left: isTestMode ? '1.75rem' : '0.25rem'
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Image Model Selector */}
                                <div style={{ marginBottom: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                    <PremiumSelect
                                        label="Image Artist"
                                        value={imageModel === 'google' ? 'Google Imagen' : imageModel === 'getimg' ? 'GetImg.ai' : imageModel === 'pixeldojo' ? 'PixelDojo' : imageModel === 'leonardo' ? 'Leonardo.ai (Consistency)' : 'TEST ALL 3'}
                                        options={[
                                            { label: 'Google Imagen', value: 'google' },
                                            { label: 'GetImg.ai', value: 'getimg' },
                                            { label: 'PixelDojo', value: 'pixeldojo' },
                                            { label: 'Leonardo.ai (Consistency)', value: 'leonardo' },
                                            { label: 'TEST ALL 3', value: 'all' }
                                        ].map(v => v.label)}
                                        onChange={(label) => {
                                            const mapping = { 'Google Imagen': 'google', 'GetImg.ai': 'getimg', 'PixelDojo': 'pixeldojo', 'Leonardo.ai (Consistency)': 'leonardo', 'TEST ALL 3': 'all' };
                                            setImageModel(mapping[label]);
                                        }}
                                        icon={Palette}
                                    />
                                </div>

                                <div className="nav-buttons" style={{ display: 'flex', gap: '1.5rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '1.2rem', borderRadius: '20px' }} onClick={() => setStep(4)}>
                                        <ArrowLeft size={20} style={{ marginRight: '0.8rem' }} /> Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 2, padding: '1.5rem', borderRadius: '25px', fontSize: '1.4rem', background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '0 15px 30px rgba(139, 92, 246, 0.4)' }}
                                        onClick={handleGenerate}
                                    >
                                        Build My Story! <Wand2 size={24} style={{ marginLeft: '1rem' }} />
                                    </button>
                                </div>

                                <button className="btn btn-link" style={{ width: '100%', marginTop: '1.5rem', color: '#64748B' }} onClick={() => setStep(2)}>
                                    Go Back
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div >
            </motion.div >

            {/* GENERATION OVERLAY */}
            < AnimatePresence >
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', padding: '2rem'
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ color: '#8B5CF6', marginBottom: '1.5rem' }}
                        >
                            <Sparkles size={60} />
                        </motion.div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1f2937', marginBottom: '0.5rem' }}>Printing the Magic...</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748B', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            <Loader className="animate-spin" size={20} />
                            {genStatus}
                        </div>

                        {/* Real-time Preview */}
                        {previewPages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    width: '100%', maxWidth: '500px', background: 'white',
                                    padding: '1rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                                    display: 'flex', flexDirection: 'column', gap: '1rem'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Latest Page Painted:
                                </div>
                                <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '15px', overflow: 'hidden', border: '4px solid #f1f5f9' }}>
                                    <img
                                        src={previewPages[previewPages.length - 1].image}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt="Current Preview"
                                    />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>
                                        {previewPages[previewPages.length - 1]?.text?.substring(0, 60) || "Capturing the magic..."}...
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    {Array.from({ length: (storyData?.pages?.length || 0) + 1 }).map((_, idx) => (
                                        <div key={idx} style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: idx < previewPages.length ? '#8B5CF6' : '#e2e8f0',
                                            transition: 'background 0.3s ease'
                                        }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <p style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.8rem', maxWidth: '300px' }}>
                            Our AI artists are working hard. You can see the pages appearing as they finish!
                        </p>
                    </motion.div>
                )
                }
            </AnimatePresence >

            {/* Storage Warning Modal */}
            < AnimatePresence >
                {storageWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 2000,
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '1.5rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="card magic-paper"
                            style={{
                                maxWidth: '400px', width: '100%',
                                textAlign: 'center', padding: '2rem',
                                border: '4px solid #F59E0B'
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒✨</div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#B45309', marginBottom: '1rem' }}>
                                Your Magic Bag is Full!
                            </h1>
                            <p style={{ color: '#92400E', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                You've saved a lot of magic! To save more characters, we need to tidy up and remove some old ones.
                            </p>
                            <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '15px', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#B45309', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Storage Usage: {storageWarning.percentage}%
                                </div>
                                <div style={{ width: '100%', height: '10px', background: '#FDE68A', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{ width: `${storageWarning.percentage}%`, height: '100%', background: '#F59E0B' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <button
                                    onClick={() => {
                                        const removed = cleanupOldData();
                                        const newQuota = checkStorageQuota();
                                        setStorageWarning(newQuota);

                                        if (newQuota.percentage > 95) {
                                            showModal("Bag Still Heavy!", "Normal cleanup was not enough. You might need to 'Deep Clean' which removes your 3 oldest characters.", "warning");
                                        } else {
                                            showModal("Bag Tidy!", `Removed ${removed} items. Your bag has more room now!`, "success");
                                        }
                                    }}
                                    className="btn btn-primary"
                                    style={{ background: '#F59E0B', color: 'white', border: 'none' }}
                                >
                                    Dust Off Old Magic (Clean Up)
                                </button>

                                {storageWarning.percentage > 95 && (
                                    <button
                                        onClick={() => {
                                            const pruned = deepCleanupOldData();
                                            const finalQuota = checkStorageQuota();
                                            setStorageWarning(finalQuota);
                                            setSavedCharacters(getSavedCharacters()); // Refresh the bench

                                            if (finalQuota.percentage > 98) {
                                                showModal("Still Full!", "Standard pruning wasn't enough. We might need a Nuclear Reset.", "error");
                                            } else if (pruned > 0) {
                                                showModal("Deep Clean Done!", `Removed ${pruned} oldest characters. You're ready to save new ones!`, "success");
                                            }
                                        }}
                                        className="btn"
                                        style={{ background: '#FEF2F2', color: '#B91C1C', border: '2px solid #FECACA', fontWeight: '800' }}
                                    >
                                        Deep Clean (Prune Old Characters)
                                    </button>
                                )}

                                {storageWarning.percentage > 98 && (
                                    <button
                                        onClick={() => {
                                            nuclearCleanup();
                                            const finalQuota = checkStorageQuota();
                                            setStorageWarning(finalQuota);
                                            setSavedCharacters(getSavedCharacters());
                                            showModal("Reset Complete!", "Everything but your essentials has been cleared. Your bag is empty!", "success");
                                        }}
                                        className="btn"
                                        style={{ background: '#4C1D95', color: 'white', border: 'none', fontWeight: '900', boxShadow: '0 4px 12px rgba(76, 29, 149, 0.4)' }}
                                    >
                                        Nuclear Reset (Wipe Junk)
                                    </button>
                                )}

                                <button
                                    onClick={() => setStorageWarning(null)}
                                    className="btn btn-secondary"
                                    style={{ background: 'transparent', border: 'none', color: '#B45309' }}
                                >
                                    I'll do it later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Custom Notification Modal */}
            < CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div >
    );
}
