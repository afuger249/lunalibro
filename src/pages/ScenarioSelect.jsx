import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Coffee, MapPin, ArrowLeft, Home, Briefcase, CloudRain, Smile, Palmtree, Gift, Thermometer, Star, Sparkles, Map, Shuffle, Plus, X } from 'lucide-react';
import { useMystery } from '../hooks/useMystery';
import { generateSurpriseScenario } from '../lib/MysteryGenerator';
import AdventureMap from '../components/AdventureMap';
import { generateOpenAISpeech } from '../lib/openai_tts';
import { useRef } from 'react';
import { Volume2 } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

const SCENARIOS = [
    {
        id: 'ordering-coffee',
        title: 'Ordering a Drink',
        description: 'Practice ordering your favorite coffee or juice at the local cafe.',
        icon_name: 'Coffee',
        color: '#F97316',
        prompt: 'YOU ARE A BARISTA ☕. Take the user\'s order. PEDAGOGY: 1. Use "Forced Choice" (e.g. ¿Quieres café o té?). 2. Identify nouns with emojis. 3. RECAST: Repeat their order correctly ("Sí, un café ☕"). 4. Length: 2-3 sentences. Ask for their name.'
    },
    {
        id: 'abuela-visit',
        title: 'Visiting a Friend',
        description: 'Say hello to a friend at their house and practice basic greetings.',
        icon_name: 'Home',
        color: '#EC4899',
        prompt: 'YOU ARE A FRIEND 🏠. Greet the user. PEDAGOGY: 1. Offer a simple choice (e.g. ¿Cómo estás? ¿Bien o así-así?). 2. Use emojis for mood. 3. RECAST: Acknowledge their greeting. 4. Length: 2 sentences.'
    },
    {
        id: 'asking-directions',
        title: 'Asking for Directions',
        description: 'Lost in the plaza? Ask where the nearest landmarks are.',
        icon_name: 'MapPin',
        color: '#8B5CF6',
        prompt: 'YOU ARE A LOCAL CITIZEN 📍. Give simple directions. PEDAGOGY: 1. Use Relational Emojis (⬅️, ➡️, ⬆️, 📍). 2. Keep prepositions simple. 3. RECAST: Repeat the location they asked for. 4. Length: 2 sentences.'
    },
    {
        id: 'grocery-shopping',
        title: 'Grocery Shopping',
        description: 'Practice buying some fruit or milk at the local market.',
        icon_name: 'Gift',
        color: '#10B981',
        prompt: 'YOU ARE A SHOPKEEPER 🍎. PEDAGOGY: 1. Number Reinforcement: Output prices in words AND digits (e.g. "Tres euros (3€)"). 2. Offer a choice (e.g. ¿Manzana 🍎 o pera 🍐?). 3. RECAST their selection. 4. Length: 2 sentences.'
    }
];

const ICON_MAP = {
    'Coffee': <Coffee size={48} />,
    'Users': <Users size={48} />,
    'MapPin': <MapPin size={48} />,
    'Home': <Home size={48} />,
    'Briefcase': <Briefcase size={48} />,
    'CloudRain': <CloudRain size={48} />,
    'Smile': <Smile size={48} />,
    'Palmtree': <Palmtree size={48} />,
    'Gift': <Gift size={48} />,
    'Thermometer': <Thermometer size={48} />,
    'Star': <Star size={48} />,
    'Sparkles': <Sparkles size={48} />,
    'Shuffle': <Shuffle size={48} />,
    'Plus': <Plus size={48} />
};

export default function ScenarioSelect({ ageLevel, spanishLevel, setSpanishLevel }) {
    const navigate = useNavigate();
    const { mysteryState, startMystery, getCurrentObjective, previewMystery, resetMystery } = useMystery();
    const [scenarios, setScenarios] = useState(SCENARIOS);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [customTopic, setCustomTopic] = useState('');
    const [viewMode, setViewMode] = useState(ageLevel === 'kid' ? 'map' : 'grid'); // 'map' or 'grid'
    const [isNarrating, setIsNarrating] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        // Force map view if switching to kid, grid if adult
        setViewMode(ageLevel === 'kid' ? 'map' : 'grid');

        window.scrollTo(0, 0);
        const fetchScenarios = async () => {
            try {
                const { data, error } = await supabase
                    .from('scenarios')
                    .select('*')
                    .eq('is_active', true)
                    .eq('difficulty_level', spanishLevel) // Filter by user's Spanish level
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: true });

                if (!error && data && data.length > 0) {
                    const mappedData = data.map(s => {
                        if (ageLevel === 'kid') {
                            if (s.title.toLowerCase().includes('coffee') || s.title.toLowerCase().includes('drink')) {
                                s.title = "The Yummy Cafe";
                                s.description = "Can you order a yummy drink and a snack?";
                            } else if (s.title.toLowerCase().includes('friend') || s.title.toLowerCase().includes('abuela')) {
                                s.title = "A Friend's House";
                                s.description = "Visit a friend and say hello!";
                            } else if (s.title.toLowerCase().includes('direction') || s.title.toLowerCase().includes('plaza')) {
                                s.title = "Help in the Plaza";
                                s.description = "Ask for help finding your way around!";
                            }
                        }
                        return s;
                    });

                    // [Hardcoded] Inject "Pet Adoption Center" scenario
                    const petScenario = {
                        id: 'pet-adoption',
                        title: ageLevel === 'kid' ? 'Puppy Paradise' : 'Pet Adoption Center',
                        description: ageLevel === 'kid' ? 'Meet the cutest puppies and pick one to take home!' : 'Visit the shelter and find a new furry friend.',
                        icon_name: 'Smile',
                        color: '#10B981', // Emerald
                        avatar_type: 'mari', // Friendly cousin/volunteer
                        prompt: 'YOU ARE A VOLUNTEER AT A DOG SHELTER. You are holding a very cute, energetic puppy. Ask the user if they want to pet it. Describe the puppy. Use simple A1 Spanish. Keep it happy and short.',
                        is_active: true
                    };

                    // Avoid duplicates if it's already in DB
                    if (!mappedData.find(s => s.id === 'pet-adoption' || s.title.includes('Pet'))) {
                        mappedData.push(petScenario);
                    }

                    setScenarios(mappedData);
                }
            } catch (err) {
                console.warn('DB Fetch failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchScenarios();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [ageLevel]);

    const handleSelect = (scenario) => {
        // Ensure voice_id is passed if it exists
        const { icon, ...scenarioData } = scenario;
        navigate('/chat', { state: { scenario: scenarioData } });
    };

    const handleNarrate = async (text, scenarioVoiceId = null) => {
        if (isNarrating) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setIsNarrating(false);
            return;
        }

        setIsNarrating(true);
        try {
            const voiceId = scenarioVoiceId || 'nova';
            const url = await generateOpenAISpeech(text, voiceId, 1.0);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
                setIsNarrating(false);
                audioRef.current = null;
            };
            audio.play();
        } catch (err) {
            console.error("Narration failed", err);
            setIsNarrating(false);
        }
    };

    const handleSurpriseMe = async (locationId = null) => {
        setLoading(true);
        try {
            const scenarioData = await generateSurpriseScenario(ageLevel, spanishLevel, locationId);
            navigate('/chat', { state: { scenario: scenarioData } });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSubmit = () => {
        if (!customTopic.trim()) return;

        // Smart Voice Detection
        const topic = customTopic.toLowerCase();
        let voice_id = 'nova'; // Default

        if (topic.includes('abuela') || topic.includes('grandma') || topic.includes('elderly')) {
            voice_id = 'sage';
        } else if (topic.includes('kid') || topic.includes('child') || topic.includes('girl')) {
            voice_id = 'coral';
        } else if (topic.includes('boy') || topic.includes('youth')) {
            voice_id = 'ash';
        } else if (topic.includes('man') || topic.includes('guy') || topic.includes('onyx')) {
            voice_id = 'onyx';
        }

        const scenarioData = {
            title: customTopic,
            description: 'Your custom created scenario.',
            prompt: `YOU ARE A CHARACTER IN THIS SCENARIO: ${customTopic}. Roleplay with the user. 
            STRICTLY ADHERE TO THE SPANISH DIFFICULTY LEVEL: ${spanishLevel}.
            PEDAGOGY: 
            1. Use "Forced Choice" (A/B options).
            2. Match vocabulary and grammar to ${spanishLevel} level.
            3. Keep responses to 2-3 sentences max.
            4. Use emojis for main nouns.`,
            avatar_type: 'auto',
            voice_id: voice_id,
            color: '#F43F5E' // Rose
        };
        navigate('/chat', { state: { scenario: scenarioData } });
    };

    const CreateScenarioModal = ({ show, onClose, topic, setTopic, onSubmit }) => {
        if (!show) return null;
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none' }}><X size={20} /></button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--color-primary)' }}>Create Your Scenario</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>What do you want to talk about today?</p>

                    <input
                        type="text"
                        autoFocus
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Buying a magical hat"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '15px',
                            border: '2px solid var(--border-color)',
                            fontSize: '1rem',
                            marginBottom: '1.5rem',
                            outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    />

                    <button
                        onClick={onSubmit}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        Start Adventure!
                    </button>
                </div>
            </div>
        );
    };

    if (viewMode === 'map') {
        return (
            <>
                <AdventureMap
                    scenarios={scenarios}
                    onSelectScenario={handleSelect}
                    onBack={() => navigate('/dashboard')}
                    onSurpriseMe={handleSurpriseMe}
                    onCreateOwn={() => setShowCreateModal(true)}
                    mysteryState={mysteryState}
                    onStartMystery={startMystery}
                    currentObjective={getCurrentObjective()}
                    previewMystery={previewMystery}
                    onResetMystery={resetMystery}
                />
                <CreateScenarioModal
                    show={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    topic={customTopic}
                    setTopic={setCustomTopic}
                    onSubmit={handleCustomSubmit}
                />
            </>
        );
    }

    return (
        <div className="container" style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', position: 'relative' }}>
            <header style={{
                paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '1rem',
                    width: '100%'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: ageLevel === 'kid' ? '3px solid var(--border-color)' : '1px solid var(--border-color)',
                            borderRadius: ageLevel === 'kid' ? '20px' : '10px',
                            color: 'var(--color-primary)',
                            padding: '0.8rem',
                            boxShadow: ageLevel === 'kid' ? '0 4px 0 var(--border-color)' : 'var(--shadow-sm)',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h1 style={{
                            fontSize: 'clamp(1.2rem, 5vw, 2.25rem)',
                            fontWeight: '900',
                            color: 'var(--color-primary)',
                            letterSpacing: '-0.02em',
                            display: 'block',
                            lineHeight: 1.1
                        }}>
                            Select Your Scenario
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                            Choose a situation to practice your Spanish.
                        </p>
                    </div>
                </div>

                {/* Spanish Level Picker */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    background: 'var(--color-bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    minWidth: '200px'
                }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Your Spanish Level
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                        {['A0', 'A1', 'A2', 'B1', 'B2', 'C1'].map((lv) => (
                            <button
                                key={lv}
                                onClick={() => setSpanishLevel(lv)}
                                disabled={ageLevel === 'kid'}
                                style={{
                                    padding: '0.4rem 0',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    backgroundColor: spanishLevel === lv ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                                    color: spanishLevel === lv ? 'white' : 'var(--color-text-secondary)',
                                    border: `1px solid ${spanishLevel === lv ? 'var(--color-primary)' : 'var(--color-bg-surface)'}`,
                                    opacity: ageLevel === 'kid' ? 0.5 : 1,
                                    cursor: ageLevel === 'kid' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {lv}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2.5rem',
                }}
            >
                {/* Standard Scenarios */}
                {scenarios.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: '1rem', border: '2px dashed var(--color-border)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No adventures found for this level!</h3>
                        <p style={{ marginBottom: '1.5rem' }}>There are no scenarios tagged as <strong>{spanishLevel}</strong> yet.</p>
                        <button
                            onClick={() => setSpanishLevel(spanishLevel === 'A0' ? 'A1' : 'A0')}
                            className="btn btn-primary"
                        >
                            Try a different level
                        </button>
                    </div>
                )}
                {scenarios.map((scenario) => (
                    <motion.button
                        key={scenario.id}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                        }}
                        onClick={() => handleSelect(scenario)}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: ageLevel === 'kid' ? 'center' : 'flex-start',
                            textAlign: ageLevel === 'kid' ? 'center' : 'left',
                            gap: '1.5rem',
                            padding: '2rem',
                            cursor: 'pointer',
                            borderRadius: ageLevel === 'kid' ? '40px' : 'var(--radius-lg)',
                            background: 'var(--color-bg-secondary)',
                            borderColor: ageLevel === 'kid' ? scenario.color : 'var(--border-color)',
                            borderWidth: ageLevel === 'kid' ? '6px' : '1px',
                            boxShadow: ageLevel === 'kid' ? `0 10px 0 ${scenario.color}40` : 'var(--shadow-sm)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{
                            padding: ageLevel === 'kid' ? '1.5rem' : '1rem',
                            borderRadius: ageLevel === 'kid' ? '30px' : 'var(--radius-md)',
                            backgroundColor: ageLevel === 'kid' ? `${scenario.color}15` : 'var(--color-bg-surface)',
                            color: ageLevel === 'kid' ? scenario.color : 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {ICON_MAP[scenario.icon_name] || <Sparkles size={ageLevel === 'kid' ? 48 : 32} />}
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            {ageLevel === 'kid' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNarrate(`${scenario.title}. ${scenario.description}`, scenario.voice_id);
                                    }}
                                    style={{
                                        position: 'absolute', top: '-10px', right: '-10px',
                                        background: isNarrating ? scenario.color : `${scenario.color}20`,
                                        border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: isNarrating ? 'white' : scenario.color,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        zIndex: 10
                                    }}
                                >
                                    <Volume2 size={20} className={isNarrating ? 'pulse-audio' : ''} />
                                </button>
                            )}
                            <h3 style={{ fontSize: ageLevel === 'kid' ? '1.5rem' : '1.25rem', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>{scenario.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: ageLevel === 'kid' ? '1rem' : '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>{scenario.description}</p>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            backgroundColor: ageLevel === 'kid' ? scenario.color : 'var(--color-primary)',
                            color: 'white',
                            padding: '0.6rem 1.5rem',
                            borderRadius: '20px',
                            fontWeight: '900',
                            fontSize: '0.9rem',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: ageLevel === 'kid' ? '0 4px 0 rgba(0,0,0,0.2)' : 'none'
                        }}>
                            {ageLevel === 'kid' ? 'GO NOW!' : 'START PRACTICE'}
                        </div>
                    </motion.button>
                ))}

                {/* Surprise Me Card */}
                <motion.button
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                    }}
                    onClick={handleSurpriseMe}
                    className="card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: ageLevel === 'kid' ? 'center' : 'flex-start',
                        textAlign: ageLevel === 'kid' ? 'center' : 'left',
                        gap: '1.5rem',
                        padding: '2rem',
                        cursor: 'pointer',
                        borderRadius: ageLevel === 'kid' ? '40px' : 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                        borderColor: '#8B5CF6',
                        borderWidth: ageLevel === 'kid' ? '6px' : '0px',
                        boxShadow: ageLevel === 'kid' ? `0 10px 0 #8B5CF640` : 'var(--shadow-sm)',
                        transition: 'all 0.3s ease',
                        color: 'white'
                    }}
                >
                    <div style={{
                        padding: ageLevel === 'kid' ? '1.5rem' : '1rem',
                        borderRadius: ageLevel === 'kid' ? '30px' : 'var(--radius-md)',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Shuffle size={ageLevel === 'kid' ? 48 : 32} />
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {ageLevel === 'kid' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNarrate("Surprise Me! Get a random scenario.");
                                }}
                                style={{
                                    position: 'absolute', top: '-10px', right: '-10px',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none', borderRadius: '50%',
                                    width: '40px', height: '40px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    zIndex: 10
                                }}
                            >
                                <Volume2 size={20} className={isNarrating ? 'pulse-audio' : ''} />
                            </button>
                        )}
                        <h3 style={{ fontSize: ageLevel === 'kid' ? '1.5rem' : '1.25rem', fontWeight: '900', marginBottom: '0.75rem' }}>Surprise Me!</h3>
                        <p style={{ opacity: 0.9, fontSize: ageLevel === 'kid' ? '1rem' : '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>
                            Get a random scenario.
                        </p>
                    </div>
                </motion.button>

                {/* Create Your Own Card */}
                <motion.button
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                    }}
                    onClick={() => setShowCreateModal(true)}
                    className="card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: ageLevel === 'kid' ? 'center' : 'flex-start',
                        textAlign: ageLevel === 'kid' ? 'center' : 'left',
                        gap: '1.5rem',
                        padding: '2rem',
                        cursor: 'pointer',
                        borderRadius: ageLevel === 'kid' ? '40px' : 'var(--radius-lg)',
                        background: 'white',
                        borderColor: '#E11D48', // Rose-600
                        borderWidth: '2px', // Dashed look simulated with styled border
                        borderStyle: 'dashed',
                        boxShadow: 'none',
                        transition: 'all 0.3s ease',
                        color: '#E11D48'
                    }}
                >
                    <div style={{
                        padding: ageLevel === 'kid' ? '1.5rem' : '1rem',
                        borderRadius: ageLevel === 'kid' ? '30px' : 'var(--radius-md)',
                        backgroundColor: '#FFF1F2',
                        color: '#E11D48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Plus size={ageLevel === 'kid' ? 48 : 32} />
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {ageLevel === 'kid' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNarrate("Create Your Own. Type any topic you want.");
                                }}
                                style={{
                                    position: 'absolute', top: '-10px', right: '-10px',
                                    background: '#FFF1F2',
                                    border: 'none', borderRadius: '50%',
                                    width: '40px', height: '40px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#E11D48',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    zIndex: 10
                                }}
                            >
                                <Volume2 size={20} className={isNarrating ? 'pulse-audio' : ''} />
                            </button>
                        )}
                        <h3 style={{ fontSize: ageLevel === 'kid' ? '1.5rem' : '1.25rem', fontWeight: '900', marginBottom: '0.75rem' }}>Create Your Own</h3>
                        <p style={{ color: '#E11D48', opacity: 0.8, fontSize: ageLevel === 'kid' ? '1rem' : '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>
                            Type any topic you want.
                        </p>
                    </div>
                </motion.button>
            </motion.div>

            <CreateScenarioModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                topic={customTopic}
                setTopic={setCustomTopic}
                onSubmit={handleCustomSubmit}
            />
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse-audio {
                    animation: pulse 1.5s infinite ease-in-out;
                }
                `}
            </style>
        </div >
    );
}
