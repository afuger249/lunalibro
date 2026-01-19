
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, X, Settings, Loader, Volume2, Keyboard, Lightbulb, Languages, Sparkles, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatResponse } from '../lib/openai';
import { generateOpenAISpeech } from '../lib/openai_tts';

import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { useMystery } from '../hooks/useMystery';

// Assets
import learnerAvatar from '../assets/avatars/learner.png';
import baristaAvatar from '../assets/avatars/barista.png';
import abuelaAvatar from '../assets/avatars/abuela.png';
import tioAvatar from '../assets/avatars/tio.png';
import papiAvatar from '../assets/avatars/papi.png';
import mariAvatar from '../assets/avatars/mari.png';
import siblingAvatar from '../assets/avatars/sibling.png';
import mamiAvatar from '../assets/avatars/mami.png';
import tiaAvatar from '../assets/avatars/tia.png';
import juanAvatar from '../assets/avatars/juan.png';
import localAvatar from '../assets/avatars/local.png';
import icecreamAvatar from '../assets/avatars/icecream.png';

// Backgrounds
import cafeBg from '../assets/backgrounds/cafe.png';
import cottageBg from '../assets/backgrounds/cottage.png';
import beachBg from '../assets/backgrounds/beach.png';
import plazaBg from '../assets/backgrounds/plaza.png';
import officeBg from '../assets/backgrounds/office.png';
import stormBg from '../assets/backgrounds/storm.png';

// Helper for safer UUID generation
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function ChatSession({ ageLevel, setAgeLevel, spanishLevel, setSpanishLevel }) {
    const isA0 = spanishLevel === 'A0';

    const navigate = useNavigate();
    const location = useLocation();
    const { scenario } = location.state || {};
    const { mysteryState, advanceStep, jumpToLocation, closeBriefing } = useMystery();

    // Safety check for direct navigation
    if (!scenario) {
        // Redirect if no scenario data found
        useEffect(() => { navigate('/dashboard'); }, []);
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading or Invalid Scenario...</div>;
    }

    // State
    const [isListening, setIsListening] = useState(false);
    const [showClueFound, setShowClueFound] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSaving, setIsSaving] = useState(false); // New state for saving status
    const [messages, setMessages] = useState([]);
    const [isNarrating, setIsNarrating] = useState(false);
    const modalAudioRef = useRef(null);
    const [showAdventureRecap, setShowAdventureRecap] = useState(false); // Can double as our "Checkpoint"
    const [showSuggestionsUI, setShowSuggestionsUI] = useState(false);
    const [isSuggestionsRevealed, setIsSuggestionsRevealed] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isKeyboardMode, setIsKeyboardMode] = useState(false);
    const [keyboardText, setKeyboardText] = useState('');
    const keyboardInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Initial safe voice selection
    const [selectedVoiceId, setSelectedVoiceId] = useState('nova');

    const initializationRef = useRef(false);

    // Initialize messages
    useEffect(() => {
        // Reset state for new scenario
        setMessages([]);
        setExchangeCount(0);
        setShowClueFound(false);
        setTranscript('');
        setIsListening(false);
        setIsProcessing(false);
        setIsSpeaking(false);

        const scenarioPrompt = scenario?.prompt || 'Eres un tutor de español muy amable.';

        // Dynamic Twist
        const moods = ['excited', 'curious', 'calm', 'slightly hurried', 'very happy', 'helpful'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];

        let systemInstruction = "";

        if (scenario.isMystery) {
            // --- MASTER PROMPT FOR MYSTERY ---
            systemInstruction = `
            ROLE: You are playing the character "${scenario.npc}" in a Lumi Adventure for children (Ages 6-12). 
            You are a Lumi Spirit—magical, warm, and helpful.
            LOCATION: ${scenario.locationName || 'The Town'}.
            
            YOUR GOAL: Help the child find the glowing object by giving them THE CLUE, but only if they ask nicely or say the magic word.
            
            THE CLUE: "${scenario.clue}"
            MAGIC WORD: "${scenario.requiredKeyword}" (user might say this or similar).
            
            CONVERSATION RULES:
            1. BE BRIEF: 1-2 short sentences maximum.
            2. SIMPLE SPANISH (A1): Use common words. Speak slowly (implied by short text).
            3. ONE CLUE AT A TIME: Do not overwhelm.
            4. GLOWING TONE: Use words related to light, magic, and friendship.
            5. CHARACTER ONLY: Do not narrate actions like *smiles*. Just speak.
            
            INTERACTION LOGIC:
            - If the user greets you, greet back warmly and DROP A HINT that you have a spark of information.
            - If the user asks about the object or says "${scenario.requiredKeyword}", GIVE THE CLUE immediately.
            - If the user is struggling, give a very obvious hint in simple Spanish.
            
            TONE: Magical, warm, slightly whimsical.
            `;
        } else {
            // --- STANDARD CONVERSATION LOGIC ---
            // A0 Specific Logic
            const kidModifier = ageLevel === 'kid' ? `KIDS MODE: Simple words. Fun tone.` : `Target: ${spanishLevel}`;

            let levelInstruction = "";
            if (isA0) {
                levelInstruction = `
                ABSOLUTE BEGINNER (A0) MODE:
                1. SPANISH ONLY in main response: Only say the Spanish phrase. Do NOT include English in parentheses.
                2. VISUAL VOCAB: Use an emoji next to every noun. Example: "Veo un gato 🐱".
                3. SUPER SIMPLE: Use max 3-5 word sentences.
                4. SLOW: Do not ask complex questions. Just ask "Yes or No?" or "Red or Blue?".
                5. OPTIONS: At the very end of your response, provide 2-3 simple suggested replies for the user. output them as a hidden JSON block like this:
                |||JSON:[{"spanish":"Si","english":"Yes"},{"spanish":"No","english":"No"}]|||
                `;
            } else {
                levelInstruction = `
                 1. LENGTH: 2-3 sentences per response. (Maintain "Flow and Melody").
                 2. RECAST: Always repeat the user's correct intent in natural Spanish as your first sentence.
                 3. SCAFFOLDING (Forced Choice): If the user is struggling or to move the task forward, offer 2 choices (e.g. "¿Quieres A o B?").
                 4. VISUALS: Use an emoji next to every noun (e.g. café ☕). Use relational emojis for directions (⬅️, ➡️, 📍).
                 5. NUMBER REINFORCEMENT: Write prices/numbers in WORDS and DIGITS (e.g. "diez (10)").
                 6. ${kidModifier}
                 7. 100% Spanish. No translations.
                 8. DIRECT BUT FRIENDLY: Eliminate fluff, but keep the conversation natural and helpful.
                 `;
            }

            systemInstruction = `
            ACT AS THE CHARACTER: ${scenarioPrompt}
            CORE MISSION: You are a Lumi Language Guide. Your goal is to provide warm, Comprehensible Input while going on this adventure together.
            CURRENT MOOD: ${randomMood}
            
            CRITICAL LEARNING RULES:
            ${levelInstruction}
            
            BRAND TONE: You are LumiLibro's spirit. Use small magical metaphors (e.g., "Let's light up this path").
            `;
        }

        const initialMessages = [{ role: 'system', content: systemInstruction.trim() }];
        setMessages(initialMessages);
        if (scenario) {
            handleUserMessage('¡Hola!', true, initialMessages);
        }
    }, [scenario, ageLevel, spanishLevel]);

    const [captions, setCaptions] = useState('Press mic to start...');
    const [englishCaption, setEnglishCaption] = useState('');
    const [speechSpeed, setSpeechSpeed] = useState(0.85);
    const [showEnglish, setShowEnglish] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [exchangeCount, setExchangeCount] = useState(0);

    // Refs for latest state
    const messagesRef = useRef([]);    // Sync messagesRef for auto-save and closure access
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Scroll to bottom on improved UX
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing, isSpeaking]);
    const exchangeCountRef = useRef(0);
    useEffect(() => { exchangeCountRef.current = exchangeCount; }, [exchangeCount]);

    const showClueFoundRef = useRef(false);
    useEffect(() => { showClueFoundRef.current = showClueFound; }, [showClueFound]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, transcript]);

    const getAIAvatar = () => {
        if (scenario?.avatar_url) return scenario.avatar_url;
        let type = scenario?.avatar_type || 'barista';

        // Dynamic Avatar Selection
        if (type === 'auto') {
            const text = ((scenario?.title || '') + ' ' + (scenario?.prompt || '')).toLowerCase();
            const femaleKeywords = ['woman', 'lady', 'girl', 'mom', 'mother', 'sister', 'aunt', 'abuela', 'queen', 'princess', 'actress', 'waitress', 'female'];
            const maleKeywords = ['man', 'guy', 'boy', 'father', 'dad', 'brother', 'uncle', 'abuelo', 'king', 'prince', 'actor', 'waiter', 'male', 'caballero'];

            if (femaleKeywords.some(k => text.includes(k))) type = 'mari';
            else if (maleKeywords.some(k => text.includes(k))) type = 'tio';
            else type = 'barista'; // Default friendly
        }

        const avatarMap = {
            'barista': baristaAvatar,
            'abuela': abuelaAvatar,
            'tio': tioAvatar,
            'papi': papiAvatar,
            'mari': mariAvatar,
            'sibling': siblingAvatar,
            'mami': mamiAvatar,
            'tia': tiaAvatar,
            'juan': juanAvatar,
            'local': localAvatar,
            'icecream': icecreamAvatar,
            'learner': learnerAvatar // Fallback
        };
        return avatarMap[type] || baristaAvatar;
    };
    const aiAvatar = getAIAvatar();
    const userAvatar = learnerAvatar;

    const getScenarioBackground = () => {
        const title = scenario?.title?.toLowerCase() || '';
        if (title.includes('coffee')) return `url(${cafeBg})`;
        if (title.includes('beach')) return `url(${beachBg})`;
        return `url(${plazaBg})`;
    };
    const scenarioBg = getScenarioBackground();

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const silenceTimerRef = useRef(null);

    // Safe Speech Recognition Init
    useEffect(() => {
        // Init Audio
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.lang = 'es-ES';
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        interimTranscript += event.results[i][0].transcript;
                    }
                    if (interimTranscript) {
                        setTranscript(interimTranscript.trim());
                        console.log("STT Interim Transcript:", interimTranscript.trim());
                    }
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        const final = interimTranscript.trim();
                        if (final && final.toLowerCase() !== 'test') {
                            console.log("STT Silence Detected, processing final transcript:", final);
                            handleUserMessage(final);
                            setTranscript('');
                            recognition.stop();
                        }
                    }, 1500); // Reduced from 2000ms to 1500ms for snappiness
                };
                recognition.onerror = (event) => {
                    console.error("STT Error Event:", event.error);
                    setIsListening(false);
                };
                recognition.onstart = () => {
                    console.log("STT Recognition Started");
                    setIsListening(true);
                };
                recognition.onend = () => {
                    console.log("STT Recognition Ended");
                    setIsListening(false);
                };
                recognitionRef.current = recognition;
            } else {
                console.warn("Speech recognition not supported in this browser.");
            }
        } catch (err) {
            console.error("Failed to initialize speech recognition:", err);
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Stop audio when showing success modals or recap
    useEffect(() => {
        if ((showClueFound || showAdventureRecap) && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            setIsSpeaking(false);
        }
    }, [showClueFound, showAdventureRecap]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not available on this device.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        } else {
            setTranscript('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Start error", e);
                // Sometimes it fails if already started, just reset state
                setIsListening(false);
            }
        }
    };

    const fetchSuggestions = async (lastMsg, history) => {
        setIsLoadingSuggestions(true);
        try {
            // 1. Context: Get last 3 messages to give context, but strip original system prompts
            const recentHistory = history
                .filter(m => m.role !== 'system')
                .slice(-3); // Last 3 turns

            // 2. Prompt: Strong instruction for JSON
            const promptMessages = [
                {
                    role: 'system',
                    content: `
                    TASK: You are the USER'S BRAIN. Your job is to suggest what the USER should say NEXT to answer the AI.
                    CONTEXT: The user is learning Spanish.
                    INPUT: Recent conversation history.
                    OUTPUT: Returns strictly an array of 3 JSON objects.
                    FORMAT: [{"spanish": "Response 1", "english": "Meaning 1"}, ...]
                    RULES:
                    - NO markdown. NO code blocks. NO explanation. matched strictly to the array format.
                    - Responses must be DIRECT REPLIES (1st person).
                    - Responses must be simple (A1/A2 level).
                    - Do NOT give advice (e.g. "You should ask...").
                    - Do NOT describe the object (e.g. "Shoes have soles...").
                    - EXAMPLE: If AI asks "Do you want coffee?", valid suggestions:
                      1. "Sí, por favor." (Yes, please.)
                      2. "No, gracias." (No, thanks.)
                      3. "Quiero agua." (I want water.)
                    `
                },
                ...recentHistory,
                { role: 'user', content: 'Generate suggestions now.' }
            ];

            const resp = await getChatResponse(promptMessages);
            let rawText = resp.message.content;

            // 3. Robust Parsing: Find array brackets
            const start = rawText.indexOf('[');
            const end = rawText.lastIndexOf(']');

            if (start !== -1 && end !== -1) {
                const jsonStr = rawText.substring(start, end + 1);
                const parsed = JSON.parse(jsonStr);
                setSuggestions(parsed.slice(0, 3));
            } else {
                throw new Error("No JSON array found");
            }

        } catch (e) {
            console.error("Suggestion fetch failed", e);
            // Context-aware fallback fallback if possible, else generic
            setSuggestions([
                { spanish: 'Sí, claro.', english: 'Yes, sure.' },
                { spanish: 'No, gracias.', english: 'No, thanks.' },
                { spanish: 'No entiendo.', english: 'I don\'t understand.' }
            ]);
        }
        finally { setIsLoadingSuggestions(false); }
    };



    const playCelebrationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'triangle';

            // Arpeggio effect
            const now = ctx.currentTime;

            // Note 1
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            gainNode.gain.setValueAtTime(0.5, now);

            // Note 2
            oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5

            // Note 3
            oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

            // Note 4
            oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6

            // Fade out
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            oscillator.start(now);
            oscillator.stop(now + 1);
        } catch (e) {
            console.error("Audio context error", e);
        }
    };

    const triggerCelebration = () => {
        // Set Lumi Flag for the Map Celebration
        if (scenario?.id) {
            localStorage.setItem('LUMILIBRO_COMPLETED_NODE', JSON.stringify({
                id: scenario.id,
                color: scenario.color || '#F59E0B'
            }));

            // Create a "Story Seed" for the nightly ritual
            localStorage.setItem('LUMILIBRO_STORY_SEED', JSON.stringify({
                scenarioId: scenario.id,
                title: scenario.title,
                timestamp: new Date().toISOString(),
                promptSnippet: `We had a great time at the ${scenario.title} today!`
            }));
        }

        playCelebrationSound();
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const handleNarrate = async (text) => {
        if (isNarrating) {
            if (modalAudioRef.current) {
                modalAudioRef.current.pause();
                modalAudioRef.current = null;
            }
            setIsNarrating(false);
            return;
        }

        setIsNarrating(true);
        setIsSpeaking(true);
        try {
            // Use scenario-specific voice if provided, default to 'nova'
            const voiceId = scenario?.voice_id || 'nova';
            console.log(`OpenAI TTS using voice: ${voiceId} for scenario: ${scenario?.title}`);

            const url = await generateOpenAISpeech(text, voiceId, speechSpeed);

            const audio = new Audio(url);
            modalAudioRef.current = audio;
            audio.onended = () => {
                setIsNarrating(false);
                modalAudioRef.current = null;
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'AbortError') return;
                    console.warn("Playback interrupted or blocked:", error);
                });
            }
        } catch (err) {
            console.error("Narration failed completely", err);
            setIsNarrating(false);
        }
    };

    const handleUserMessage = async (text, isInternal = false, overrideHistory = null) => {
        setIsProcessing(true);
        setIsSuggestionsRevealed(false);
        const base = overrideHistory || messagesRef.current;
        const userMsg = { role: 'user', content: text };

        if (!isInternal) setMessages([...base, userMsg]);

        // MYSTERY LOGIC: Check for clue keyword
        if (!isInternal && scenario?.isMystery && mysteryState?.isActive && !mysteryState?.isSolved) {
            const currentStep = mysteryState.caseData.steps[mysteryState.currentStepIndex];
            // Simple keyword check (normalized)
            if (currentStep && text.toLowerCase().includes(currentStep.requiredKeyword.toLowerCase())) {
                // Determine if this was the FINAL step to customizing the success message
                const isFinal = currentStep.isFinal;

                // Advance the mystery logic
                advanceStep();

                // Trigger celebration
                triggerCelebration();

                // Show the success modal after a short delay so they can see the AI's response too (if any)
                // Actually, let's show it immediately or after 1s? 
                // Let's show it immediately so they know they succeeded.
                setShowClueFound(true);
            }
        }

        // Checkpoint Logic
        let currentHistory = [...base, userMsg];
        const currentCount = exchangeCountRef.current; // Use ref for accurate count in async

        if (!isInternal && currentCount === 5) {
            // Inject wrap-up instruction for this turn
            currentHistory.push({ role: 'system', content: 'IMPORTANT: This is the last turn. Wrap up the conversation naturally. Say goodbye or thank you.' });
        }

        try {
            const aiResp = await getChatResponse(currentHistory);
            let aiText = aiResp.message.content;

            // A0 Parsing: Check for hidden JSON options
            if (isA0 && aiText.includes('|||JSON:')) {
                try {
                    const parts = aiText.split('|||JSON:');
                    aiText = parts[0].trim(); // distinct content
                    const jsonPart = parts[1].split('|||')[0]; // Extract JSON
                    const parsedOptions = JSON.parse(jsonPart);
                    setSuggestions(parsedOptions);
                    setShowSuggestionsUI(true); // Auto-show for A0
                } catch (e) {
                    console.error("Failed to parse A0 options", e);
                }
            } else if (isA0) {
                // Fallback if AI forgets format
                setSuggestions([
                    { spanish: 'Sí', english: 'Yes' },
                    { spanish: 'No', english: 'No' }
                ]);
                setShowSuggestionsUI(true);
            }

            // Always fetch translation so the toggle works retroactively
            let translation = '';
            try {
                const transResp = await getChatResponse([{ role: 'system', content: 'Translate to English. Output only translation.' }, { role: 'user', content: aiText }]);
                translation = transResp.message.content;
            } catch (err) {
                console.error("Translation failed", err);
            }

            const aiMsgWithExtra = { role: 'assistant', content: aiText, translation };
            setMessages(prev => [...prev, aiMsgWithExtra]);
            setCaptions(aiText);
            setEnglishCaption(translation);

            // Audio - OpenAI Dedicated
            let url = null;

            try {
                const narrationText = aiText;
                // Pass speechSpeed explicitly
                url = await generateOpenAISpeech(narrationText, scenario?.voice_id || 'nova', speechSpeed);
            } catch (oaError) {
                console.error("OpenAI TTS failed.", oaError);
            }

            if (url && audioRef.current && !showClueFoundRef.current) {
                audioRef.current.src = url;
                audioRef.current.playbackRate = speechSpeed;
                audioRef.current.onplay = () => setIsSpeaking(true);
                audioRef.current.onended = () => setIsSpeaking(false);

                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Audio playback prevented by browser policy:", error);
                        setIsSpeaking(false);
                    });
                }
            }

            if (!isInternal) {
                const newCount = currentCount + 1;
                setExchangeCount(newCount);

                // Trigger Checkpoint after AI finishes (approx timing)
                // Trigger Checkpoint after AI finishes (approx timing)
                if (newCount === 6) {
                    setTimeout(() => {
                        triggerCelebration();
                        setShowAdventureRecap(true);
                    }, 2000); // Give time to read/listen
                }
            }
            if (showSuggestionsUI) {
                // Fix: Include the AI's latest message in history so hints are relevant to the CURRENT turn
                const historyWithAI = [...currentHistory, { role: 'assistant', content: aiText }];
                fetchSuggestions(aiText, historyWithAI);
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const startTimeRef = useRef(Date.now());
    const hasSavedRef = useRef(false);

    const saveSession = async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setIsSaving(true);

        const durationMs = Date.now() - startTimeRef.current;
        const durationMin = Math.max(1, Math.round(durationMs / 60000)); // Minimum 1 minute

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // ... (Profile update omitted for brevity/safety - keeping existing logic if I multi-replace just the block)
                // Actually, I need to keep the Profile update logic or the MultiReplace will fail if I don't match exact content.
                // I will use replace_file_content on the whole function logic or just the try/catch block.

                // 1. Update Profile (Simplified view here, matching existing code structure in logic)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('total_minutes')
                    .eq('id', user.id)
                    .single();

                const currentTotal = profile?.total_minutes || 0;
                await supabase
                    .from('profiles')
                    .update({ total_minutes: currentTotal + durationMin })
                    .eq('id', user.id);

                // 2. Archive Session
                const currentMessages = messagesRef.current;

                // Debug Check
                if (!currentMessages || currentMessages.length === 0) {
                    console.warn("Attempting to save empty session");
                    // We still save it to see the record
                }

                const finalMessages = [
                    ...currentMessages,
                    { role: 'system', content: `META:DURATION=${durationMin}` }
                ];

                const { error } = await supabase.from('sessions').insert({
                    id: uuidv4(),
                    user_id: user.id,
                    scenario_title: scenario?.title || 'Unknown Scenario',
                    messages: finalMessages,
                    created_at: new Date().toISOString()
                });

                if (error) throw error;
            } else {
                alert("Error: No user found. Session not saved.");
            }
        } catch (err) {
            console.error("Failed to save session:", err);
            alert(`Failed to save session: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save on unmount
    useEffect(() => {
        return () => {
            saveSession();
        };
    }, []);

    const handleEndSession = async () => {
        await saveSession();
        if (scenario?.isMystery) {
            navigate('/dashboard'); // HQ
        } else if (ageLevel === 'kid') {
            navigate('/scenarios');
        } else {
            navigate('/dashboard');
        }
    };
    return (
        <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-bg-primary)' }}
        >
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, background: `${scenarioBg} center/cover`, zIndex: 0, pointerEvents: 'none' }} />
            {/* Simpler Overlay for iOS Performance */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', zIndex: 1, pointerEvents: 'none' }} />

            <header style={{ position: 'relative', zIndex: 10, padding: '1rem', paddingTop: 'max(1rem, env(safe-area-inset-top))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(0,0,0,0.05)', gap: '1rem' }}>
                <button onClick={handleEndSession} style={{ flexShrink: 0 }}><X size={24} /></button>

                <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
                    <h1 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--color-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {scenario?.title || 'LumiLibro'}
                    </h1>
                    {scenario?.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
                            {scenario.description}
                        </p>
                    )}
                </div>

                <button onClick={() => setShowSettings(!showSettings)} style={{ flexShrink: 0 }}><Settings size={24} /></button>
            </header>

            {/* Status indicators */}
            <div style={{ position: 'relative', zIndex: 5, padding: '0.5rem', textAlign: 'center' }}>
                {isProcessing && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Thinking...</div>}
                {isSpeaking && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <span>AI is speaking</span>
                    </div>
                )}
            </div>

            {/* Avatars (Sticky) */}
            <div style={{ position: 'relative', zIndex: 6, display: 'flex', justifyContent: 'center', gap: '2rem', padding: '0.5rem 0' }}>
                <motion.div
                    animate={isListening ? {
                        scale: 1.15,
                        boxShadow: "0 0 0 6px rgba(0, 163, 218, 0.4)"
                    } : {
                        scale: 1,
                        boxShadow: "0 0 0 0px rgba(0, 0, 0, 0)"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ borderRadius: '50%' }}
                >
                    <img src={userAvatar} style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        border: isListening ? '4px solid var(--color-primary)' : '4px solid white',
                        transition: 'border 0.3s ease',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }} />
                </motion.div>


                <div style={{ position: 'relative' }}>
                    <motion.img
                        src={aiAvatar}
                        alt="AI"
                        animate={{
                            boxShadow: isSpeaking
                                ? ["0 0 0 0px rgba(245, 158, 11, 0.4)", "0 0 0 20px rgba(245, 158, 11, 0)"]
                                : "0 0 0 0px rgba(0,0,0,0)",
                            scale: isSpeaking ? [1, 1.05, 1] : 1
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            border: isSpeaking ? '4px solid var(--color-accent)' : '4px solid white',
                            transition: 'border 0.3s ease',
                            objectFit: 'cover',
                            display: 'block', // Prevents inline gap
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                        }}
                    />
                </div>
            </div>

            {/* Chat Content */}
            <div ref={scrollRef} style={{ position: 'relative', flex: 1, overflowY: 'auto', zIndex: 5, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* MYSTERY HINT CARD */}
                {scenario?.isMystery && mysteryState?.isActive && !mysteryState?.isSolved && (() => {
                    const currentStep = mysteryState.caseData?.steps[mysteryState.currentStepIndex];
                    if (!currentStep) return null;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: '#FFFBEB',
                                border: '2px solid #FCD34D',
                                borderRadius: '16px',
                                padding: '0.8rem',
                                marginBottom: '0.5rem',
                                boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem'
                            }}
                        >
                            <div style={{ background: '#F59E0B', color: 'white', padding: '0.5rem', borderRadius: '10px' }}>
                                <Sparkles size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#B45309', textTransform: 'uppercase' }}>Current Mission</div>
                                <div style={{ fontSize: '0.9rem', color: '#78350F' }}>
                                    Try using the word: <b style={{ color: '#D97706', fontSize: '1rem' }}>{currentStep.requiredKeyword}</b> ({currentStep.requiredKeywordEnglish || '...'})
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}

                {/* Messages */}
                {messages.filter(m => m.role !== 'system').map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            background: m.role === 'user' ? 'var(--color-primary)' : 'white',
                            color: m.role === 'user' ? 'white' : 'black',
                            padding: '0.8rem 1.2rem',
                            borderRadius: m.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '2px solid white'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', flex: 1 }}>{m.content}</div>
                            {m.role === 'assistant' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleNarrate(m.content)}
                                        style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        title="Repeat Spanish"
                                    >
                                        <Volume2 size={16} />
                                    </button>
                                    {showEnglish && m.translation && (
                                        <button
                                            onClick={() => handleNarrate(m.translation)}
                                            style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            title="English Translation"
                                        >
                                            <Languages size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {showEnglish && m.translation && (
                            <>
                                <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '0.5rem 0' }} />
                                <div style={{ fontSize: '0.9rem', opacity: 0.85, fontStyle: 'italic', color: m.role === 'user' ? '#E0E7FF' : '#475569' }}>
                                    {m.translation}
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}

                {/* Transcribing live */}
                {isListening && transcript && (
                    <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'rgba(0,163,218,0.5)', color: 'white', padding: '0.8rem 1.2rem', borderRadius: '20px 20px 0 20px' }}>
                        {transcript}...
                    </div>
                )}
            </div>

            {/* Suggestions Overlay with Close Button */}
            <AnimatePresence>
                {showSuggestionsUI && (suggestions.length > 0 || isLoadingSuggestions) && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'relative', zIndex: 10, padding: '1.25rem', background: 'white', borderTop: '2px solid var(--border-color)', boxShadow: '0 -10px 25px rgba(0,0,0,0.05)' }}>
                        {!isA0 && <button onClick={() => setShowSuggestionsUI(false)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', padding: '0.2rem', cursor: 'pointer' }}><X size={18} color="#94A3B8" /></button>}

                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Lightbulb size={12} fill="currentColor" /> {isA0 ? 'How to reply' : 'Suggested replies'}
                        </div>

                        {isLoadingSuggestions && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Thinking...</div>}

                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                            style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', paddingRight: '1.5rem', justifyContent: isA0 ? 'center' : 'flex-start' }}
                        >
                            {suggestions.map((s, i) => (
                                <motion.button
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.9, x: 10 },
                                        show: { opacity: 1, scale: 1, x: 0 }
                                    }}
                                    onClick={() => handleUserMessage(s.spanish)}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '16px',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.9rem',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'transform 0.1s ease'
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <b style={{ display: 'block', color: 'var(--color-text-primary)' }}>{s.spanish}</b>
                                        <small style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{s.english}</small>
                                    </div>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            generateOpenAISpeech(s.spanish, selectedVoiceId, 0.9).then(url => {
                                                const audio = new Audio(url);
                                                audio.play();
                                            }).catch(err => console.error(err));
                                        }}
                                        style={{ background: 'white', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                                    >
                                        <Volume2 size={16} color="var(--color-primary)" />
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Input Area */}
            {
                isKeyboardMode && (
                    <div style={{ position: 'relative', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
                        <input
                            ref={keyboardInputRef}
                            type="text"
                            value={keyboardText}
                            onChange={(e) => setKeyboardText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && keyboardText.trim()) {
                                    handleUserMessage(keyboardText);
                                    setKeyboardText('');
                                }
                            }}
                            placeholder="Type your message..."
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '20px',
                                border: '1px solid #ccc',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={() => {
                                if (keyboardText.trim()) {
                                    handleUserMessage(keyboardText);
                                    setKeyboardText('');
                                }
                            }}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            ➤
                        </button>
                    </div>
                )
            }

            {/* Saving Overlay */}
            <AnimatePresence>
                {isSaving && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', flexDirection: 'column', gap: '1rem'
                        }}
                    >
                        <Loader size={48} className="animate-spin" />
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Saving your progress...</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* End Session Confirmation - Only show if not saving */}


            {/* Footer with Mic */}
            {
                !isKeyboardMode && (
                    <footer style={{ position: 'relative', zIndex: 20, padding: '1rem 1rem calc(1.5rem + env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                        <button
                            onClick={() => setIsKeyboardMode(true)}
                            aria-label="Open Keyboard Mode"
                            style={{
                                width: '60px', height: '60px',
                                background: '#eee',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            <Keyboard size={28} color="#555" />
                        </button>

                        <button
                            onClick={toggleListening}
                            aria-label={isListening ? "Stop Listening" : "Start Listening"}
                            style={{
                                width: '80px', height: '80px',
                                borderRadius: '50%',
                                background: isListening ? 'var(--color-danger)' : 'var(--color-accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            {isListening ? <MicOff size={32} color="white" /> : <Mic size={32} color="white" />}
                        </button>

                        <button
                            onClick={() => {
                                // Toggle Logic: Open/Close
                                if (showSuggestionsUI) {
                                    setShowSuggestionsUI(false);
                                } else {
                                    setShowSuggestionsUI(true);
                                    // Generate if empty
                                    if (suggestions.length === 0) {
                                        fetchSuggestions(messages[messages.length - 1]?.content || 'Hola', messages);
                                    }
                                }
                            }}
                            aria-label={showSuggestionsUI ? "Close Suggestions" : "Show Suggestions"}
                            style={{
                                width: '60px', height: '60px',
                                background: showSuggestionsUI ? 'var(--color-accent)' : '#eee',
                                borderRadius: '50%',
                                transition: 'background 0.3s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            <Lightbulb size={28} color={showSuggestionsUI ? '#333' : '#555'} />
                        </button>
                    </footer>
                )
            }

            {/* Keyboard Mode Footer (Simplified) */}
            {
                isKeyboardMode && (
                    <footer style={{ position: 'relative', zIndex: 20, padding: '0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom))', background: '#f8f9fa', display: 'flex', justifyContent: 'center', gap: '2rem', borderTop: '1px solid #eee' }}>
                        <button onClick={() => setIsKeyboardMode(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mic size={16} /> Switch to Voice
                        </button>
                    </footer>
                )
            }

            {/* Settings Modal */}
            {
                showSettings && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div className="card" style={{ maxWidth: '350px', width: '100%', padding: '1.5rem', position: 'relative' }}>
                            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none' }}><X size={20} /></button>
                            <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>Chat Settings</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span>Show English</span>
                                <input type="checkbox" checked={showEnglish} onChange={e => setShowEnglish(e.target.checked)} />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Audio Speed: {speechSpeed}x</label>
                                <input
                                    type="range"
                                    min="0.75"
                                    max="1.25"
                                    step="0.05"
                                    value={speechSpeed}
                                    onChange={e => setSpeechSpeed(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowSettings(false)}>Done</button>
                        </div>
                    </div>
                )
            }

            {/* Modal Adventure Recap */}
            {
                showAdventureRecap && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => handleNarrate("Great job! Enjoying this chat? Keep going or start a new adventure.")}
                                    style={{
                                        background: isNarrating ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                        border: 'none', borderRadius: '50%',
                                        width: '44px', height: '44px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'var(--color-primary)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <Volume2 size={24} className={isNarrating ? 'pulse-audio' : ''} />
                                </button>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Great Job!</h2>
                            <p>Enjoying this chat? Keep going or start a new adventure.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowAdventureRecap(false)}>Keep Chatting</button>
                                <button className="btn btn-secondary" onClick={() => handleEndSession()}>New Scenario</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mystery Briefing Overlay */}
            <AnimatePresence>
                {mysteryState.showBriefing && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="card"
                            style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '2rem', border: '5px solid var(--color-primary)', position: 'relative' }}
                        >
                            <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                NEW MISSION
                            </div>

                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕵️‍♂️✨</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                                {mysteryState.caseData?.title}
                            </h2>
                            <p style={{ fontSize: '1.2rem', color: '#444', lineHeight: '1.5', marginBottom: '2rem' }}>
                                {mysteryState.caseData?.intro}
                            </p>

                            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '15px', border: '1px dashed #CBD5E1', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Objective</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{mysteryState.caseData?.goal}</div>
                            </div>

                            <button
                                onClick={closeBriefing}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.3rem', fontWeight: '900', borderRadius: '50px' }}
                            >
                                START INVESTIGATION
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mystery Jump / Warp Overlay */}
            <AnimatePresence>
                {mysteryState.isAwaitingJump && !mysteryState.isSolved && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            style={{ textAlign: 'center', maxWidth: '400px' }}
                        >
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#64748B', marginBottom: '1rem', textTransform: 'uppercase' }}>Next Clue Found!</div>
                            <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem' }}>
                                Let's go to the <span style={{ color: 'var(--color-primary)' }}>{mysteryState.caseData?.steps[mysteryState.currentStepIndex]?.targetLocation}</span>!
                            </h2>

                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ display: 'inline-flex', padding: '2rem', background: '#F1F5F9', borderRadius: '50%', marginBottom: '2rem' }}
                            >
                                <ArrowRight size={64} color="var(--color-primary)" />
                            </motion.div>

                            <button
                                onClick={() => {
                                    jumpToLocation();
                                    const nextStep = mysteryState.caseData.steps[mysteryState.currentStepIndex];
                                    navigate(location.pathname, {
                                        state: {
                                            scenario: {
                                                ...scenario,
                                                locationName: nextStep.targetLocation,
                                                npc: nextStep.npc,
                                                clue: nextStep.clue,
                                                requiredKeyword: nextStep.requiredKeyword,
                                                voice_id: nextStep.voice_id || 'nova'
                                            }
                                        }
                                    });
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.3rem', fontWeight: '900' }}
                            >
                                ON MY WAY! 🏃‍♂️
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mystery Clue Found Modal */}
            {
                showClueFound && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="card"
                            style={{
                                maxWidth: '400px',
                                width: '100%',
                                textAlign: 'center',
                                padding: '2rem',
                                border: '4px solid #F59E0B',
                                boxShadow: '0 0 50px rgba(245, 158, 11, 0.5)'
                            }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                                {mysteryState.isSolved ? (mysteryState.caseData?.collectible?.emoji || '🏆') : '🧩✨'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => handleNarrate(
                                        mysteryState.isSolved
                                            ? `Case solved! You collected ${mysteryState.caseData?.collectible?.nameSpanish || 'the item'}. Check your backpack.`
                                            : `Clue found! You got the info.`
                                    )}
                                    style={{
                                        background: isNarrating ? '#F59E0B' : '#FEF3C7',
                                        border: 'none', borderRadius: '50%',
                                        width: '50px', height: '50px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#B45309',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <Volume2 size={28} className={isNarrating ? 'pulse-audio' : ''} />
                                </button>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#B45309', marginBottom: '0.5rem' }}>
                                {mysteryState.isSolved ? 'CASE SOLVED!' : 'CLUE LISTO!'}
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: '#92400E', marginBottom: '1.5rem' }}>
                                {mysteryState.isSolved
                                    ? `You collected ${mysteryState.caseData?.collectible?.nameSpanish || 'the item'}! It's in your backpack.`
                                    : "Great job! You found the clue. We are one step closer!"}
                            </p>

                            <button
                                onClick={() => {
                                    if (mysteryState.isSolved) {
                                        handleEndSession();
                                    } else {
                                        setShowClueFound(false);
                                    }
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    fontSize: '1.2rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    width: '100%',
                                    boxShadow: '0 4px 0 #92400E'
                                }}
                            >
                                {mysteryState.isSolved ? 'RETURN TO HQ' : 'CONTINUE'}
                            </button>
                        </motion.div>
                    </div>
                )
            }
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse-audio {
                    animation: pulse 1.5s infinite ease-in-out;
                    color: white !important;
                }
                `}
            </style>
        </motion.div >
    );
}
