import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Coffee, Home, Palmtree, GraduationCap, MapPin, Sparkles, Loader, Volume2, Info, Plus } from 'lucide-react';
import lumiTownMap from '../assets/lumi_town_map.png';
import { generateOpenAISpeech } from '../lib/openai_tts';
import confetti from 'canvas-confetti';

// Avatar Assets
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

const AVATAR_MAP = {
    'barista': baristaAvatar,
    'abuela': abuelaAvatar,
    'learner': learnerAvatar,
    'tio': tioAvatar,
    'papi': papiAvatar,
    'mari': mariAvatar,
    'sibling': siblingAvatar,
    'mami': mamiAvatar,
    'tia': tiaAvatar,
    'juan': juanAvatar,
    'local': localAvatar,
    'icecream': icecreamAvatar
};


const AdventureMap = ({ scenarios, onSelectScenario, onBack, onSurpriseMe, onCreateOwn, mysteryState, onStartMystery, currentObjective, previewMystery, onResetMystery }) => {
    const [activeLocation, setActiveLocation] = useState(null);
    const [showIntroModal, setShowIntroModal] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showTownWelcome, setShowTownWelcome] = useState(false);

    // Disney Zoom States
    const [isZooming, setIsZooming] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' });

    const [isNarrating, setIsNarrating] = useState(false);
    const narrationAudioRef = useRef(null);




    useEffect(() => {
        if (mysteryState?.isActive && !mysteryState?.loading && mysteryState?.caseData) {
            // Only show if we haven't solved it yet (fresh start)
            if (!mysteryState.isSolved && mysteryState.currentStepIndex === 0) {
                setShowIntroModal(true);
            }
        } else if (!mysteryState?.isActive) {
            const seenWelcome = localStorage.getItem('LUMILIBRO_SEEN_WELCOME');
            if (!seenWelcome) {
                setShowTownWelcome(true);
            }
        }

        // Check for Completed Node Celebration
        const completedNodeStr = localStorage.getItem('LUMILIBRO_COMPLETED_NODE');
        if (completedNodeStr) {
            try {
                const completedNode = JSON.parse(completedNodeStr);
                const loc = LOCATIONS.find(l => {
                    const scenarios = getScenariosForLocation(l.id);
                    return scenarios.some(s => s.id === completedNode.id);
                });

                if (loc) {
                    // Trigger Confetti at the node's location
                    setTimeout(() => {
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { x: loc.x / 100, y: loc.y / 100 },
                            colors: [completedNode.color, '#FFFFFF', '#FDE047'],
                            zIndex: 1000
                        });
                    }, 500);
                }
                localStorage.removeItem('LUMILIBRO_COMPLETED_NODE');
            } catch (e) {
                console.error("Failed to parse completed node", e);
            }
        }

        return () => {
            if (narrationAudioRef.current) {
                narrationAudioRef.current.pause();
                narrationAudioRef.current = null;
            }
        };
    }, [mysteryState?.isActive, mysteryState?.loading, mysteryState?.caseData?.id]);

    const LOCATIONS = [
        { id: 'cafe', name: 'Magic Café', x: 28, y: 38, icon: <Coffee />, color: '#F97316' },
        { id: 'plaza', name: 'Town Plaza', x: 52, y: 55, icon: <MapPin />, color: '#8B5CF6' },
        { id: 'beach', name: 'Sunny Beach', x: 38, y: 76, icon: <Palmtree />, color: '#0EA5E9' },
        { id: 'home', name: 'Abuela’s House', x: 73, y: 65, icon: <Home />, color: '#EC4899' },
        { id: 'school', name: 'Library', x: 75, y: 28, icon: <GraduationCap />, color: '#10B981' },
    ];

    const handleNarrate = async (text) => {
        if (isNarrating) {
            if (narrationAudioRef.current) {
                narrationAudioRef.current.pause();
                narrationAudioRef.current = null;
            }
            setIsNarrating(false);
            return;
        }

        try {
            setIsNarrating(true);
            const url = await generateOpenAISpeech(text, 'nova', 1.0);
            const audio = new Audio(url);
            narrationAudioRef.current = audio;
            audio.play();
            audio.onended = () => {
                setIsNarrating(false);
                narrationAudioRef.current = null;
            };
        } catch (err) {
            console.error("Narration failed", err);
            setIsNarrating(false);
        }
    };

    const handleSelectWithZoom = (scenario) => {
        if (!activeLocation) return;

        // Prepare Zoom
        setZoomOrigin({ x: `${activeLocation.x}%`, y: `${activeLocation.y}%` });
        setIsZooming(true);
        setActiveLocation(null);

        // Wait for animation, then navigate
        setTimeout(() => {
            onSelectScenario(scenario);
        }, 800);
    };

    const getScenariosForLocation = (locId) => {
        if (!locId) return [];
        return scenarios.filter(s => {
            const t = s.title.toLowerCase();
            if (locId === 'cafe') return t.includes('cafe') || t.includes('coffee') || t.includes('food') || t.includes('ice cream');
            if (locId === 'beach') return t.includes('beach') || t.includes('sea') || t.includes('sand');
            if (locId === 'home') return t.includes('house') || t.includes('home') || t.includes('abuela') || t.includes('kitchen');
            if (locId === 'plaza') return t.includes('plaza') || t.includes('city') || t.includes('market') || t.includes('police');
            if (locId === 'school') return !t.includes('cafe') && !t.includes('beach') && !t.includes('house');
            return false;
        });
    };

    const activeScenarios = getScenariosForLocation(activeLocation?.id);

    // Determine which data to show (Active Case or Preview)
    const displayMystery = mysteryState?.caseData || previewMystery;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#87CEEB', // Sky fallback
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>

            {/* Loading Overlay */}
            {/* Hidden to focus on core features */}
            {/* 
            <AnimatePresence>
                {mysteryState?.loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Loader size={60} />
                        </motion.div>
                        <h2 style={{ marginTop: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>Generating Mystery...</h2>
                        <p>Consulting the Detective Agency</p>
                    </motion.div>
                )}
            </AnimatePresence>
            */}

            {/* Map Container - Strictly Square & Centered */}
            <motion.div
                animate={isZooming ? {
                    scale: 6,
                    transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
                    filter: 'blur(4px)'
                } : {
                    scale: 1,
                    transformOrigin: "50% 50%",
                    filter: 'blur(0px)'
                }}
                transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
                style={{
                    position: 'relative',
                    height: '100dvh',
                    width: '100dvw',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 2
                }}
            >
                {/* Content Box - maintains coordinates and allows floating */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    style={{
                        position: 'relative',
                        width: 'max(100vw, 100vh)',
                        height: 'max(100vw, 100vh)',
                        flexShrink: 0,
                        marginTop: '-5dvh' // Nudge up to keep bottom markers visible on wide screens
                    }}
                >
                    <img src={lumiTownMap} alt="Adventure Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {/* --- MICRO-ANIMATIONS LAYER --- */}
                    {/* Cafe Steam */}
                    <motion.div
                        animate={{ y: [0, -10, -20], opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1.5] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            left: '26%', top: '24%',
                            width: '20px', height: '20px',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                            filter: 'blur(4px)',
                            zIndex: 5
                        }}
                    />

                    {/* Fountain Pulse */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            left: '52%', top: '55%',
                            width: '60px', height: '60px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(14,165,233,0.4) 0%, rgba(14,165,233,0) 70%)',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 5
                        }}
                    />

                    {/* Beach Sparkles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={`sparkle-${i}`}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 + i, delay: i * 0.5 }}
                            style={{
                                position: 'absolute',
                                left: `${25 + i * 5}%`, top: `${75 + (i % 2) * 5}%`,
                                color: 'white',
                                zIndex: 5,
                                pointerEvents: 'none'
                            }}
                        >
                            <Sparkles size={12 + i * 2} />
                        </motion.div>
                    ))}

                    {/* --- NODES OVERLAY (Inside floating container for alignment) --- */}
                    {
                        LOCATIONS.map(loc => {
                            const isTarget = mysteryState?.isActive && !mysteryState?.isSolved &&
                                mysteryState.caseData?.steps[mysteryState.currentStepIndex]?.targetLocation === loc.id;

                            return (
                                <motion.button
                                    key={loc.id}
                                    initial={{ x: '-50%', y: '-50%', scale: 1 }}
                                    animate={isTarget ? {
                                        y: ['-50%', '-60%', '-50%'],
                                    } : {}}
                                    transition={isTarget ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : {}}
                                    whileHover={{ scale: 1.1, y: '-55%' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveLocation(loc)}
                                    style={{
                                        position: 'absolute',
                                        left: `${loc.x}%`,
                                        top: `${loc.y}%`,
                                        width: 'clamp(40px, 6vw, 60px)',
                                        height: 'clamp(40px, 6vw, 60px)',
                                        borderRadius: '50%',
                                        background: 'white',
                                        border: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                        zIndex: 10,
                                        padding: 0,
                                        outline: 'none',
                                        transform: 'translate3d(0,0,0)'
                                    }}
                                >
                                    <div style={{ color: loc.color, transform: 'scale(0.9)' }}>{loc.icon}</div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '50%',
                                        marginLeft: '-6px',
                                        width: '12px',
                                        height: '12px',
                                        background: 'white',
                                        transform: 'rotate(45deg)',
                                        zIndex: -1,
                                        borderRadius: '2px'
                                    }} />

                                    {/* Hidden to focus on core features */}
                                    {/* 
                                    {isTarget && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -10,
                                            right: -10,
                                            background: '#E11D48',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            fontWeight: 'bold',
                                            fontSize: '0.8rem'
                                        }}>!</div>
                                    )}
                                    */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-32px',
                                        background: 'white',
                                        padding: '0.4rem 1rem',
                                        borderRadius: '15px',
                                        fontWeight: '900',
                                        fontSize: 'clamp(0.75rem, 1.8vw, 1rem)',
                                        whiteSpace: 'nowrap',
                                        border: '3px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                                        color: '#1E293B',
                                        pointerEvents: 'none'
                                    }}>
                                        {loc.name}
                                    </div>
                                </motion.button>
                            );
                        })
                    }
                </motion.div>
            </motion.div>

            {/* Cinematic Glow Bloom Transition */}
            <AnimatePresence>
                {isZooming && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(254,243,199,1) 50%, rgba(251,191,36,0) 100%)',
                            pointerEvents: 'auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5], opacity: [0, 1] }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ color: '#F59E0B' }}
                        >
                            <Sparkles size={100} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* --- LIVING MAP EXPLORATION LAYER REMOVED --- */}

            {/* Header Container */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: 'calc(1rem + env(safe-area-inset-top)) 2rem 1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 50,
                pointerEvents: 'none'
            }}>
                {/* Back Button */}
                <button
                    onClick={onBack}
                    style={{
                        background: 'white',
                        border: '4px solid #F6C66A',
                        borderRadius: '50%',
                        padding: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 0 rgba(246, 198, 106, 0.4)',
                        pointerEvents: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ArrowLeft size={32} color="#B45309" strokeWidth={4} />
                </button>

                {/* Title Container */}
                <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                        fontWeight: '900',
                        color: 'white',
                        textShadow: '0 4px 0 #B45309, 0 8px 15px rgba(0,0,0,0.2)',
                        margin: 0,
                        padding: '0.4rem 2rem',
                        background: 'linear-gradient(to bottom, #F97316, #EA580C)',
                        borderRadius: '30px',
                        border: '4px solid white',
                        textAlign: 'center',
                        fontFamily: 'var(--font-family-body)',
                        letterSpacing: '0.05em'
                    }}>
                        LUMI TOWN
                    </h1>

                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            background: 'white',
                            color: '#B45309',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            fontWeight: '900',
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                            border: '2px solid #F6C66A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Sparkles size={18} color="#F6C66A" />
                        TAP TO EXPLORE!
                    </motion.div>
                </div>

                {/* Right Actions - Moved inside header for better alignment */}
                <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {/* Exit Mystery Button */}
                    {/* Hidden to focus on core features */}
                    {/* 
                    {mysteryState?.isActive && (
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            style={{
                                background: '#EF4444',
                                border: '3px solid white',
                                borderRadius: '20px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            <X size={20} />
                            EXIT
                        </button>
                    )}
                    */}
                </div>
            </header>

            <style>
                {`
              @media (max-width: 400px) {
                .hide-on-very-small { display: none; }
              }
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

            {/* Town Welcome Modal */}
            <AnimatePresence>
                {showTownWelcome && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 200,
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: '#ECFCCB', // Light green for nature/town feel
                                width: '100%',
                                maxWidth: '400px',
                                borderRadius: '30px',
                                padding: '2rem',
                                textAlign: 'center',
                                border: '4px solid #84CC16',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                background: '#84CC16',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                border: '4px solid white',
                                boxShadow: '0 10px 20px rgba(132, 204, 22, 0.3)'
                            }}
                            >
                                <Home size={40} color="white" />
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#3F6212', marginBottom: '1rem', lineHeight: 1.1 }}>
                                Welcome to Lumi Town! 🏡
                            </h2>

                            <p style={{ fontSize: '1.1rem', color: '#4D7C0F', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                This is your safe place to practice Spanish.
                            </p>

                            <div style={{ textAlign: 'left', background: 'white', padding: '1rem', borderRadius: '15px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#365314', fontWeight: 'bold' }}>
                                    <span style={{ fontSize: '1.2rem' }}>✨</span> Visit friends at their homes
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#365314', fontWeight: 'bold' }}>
                                    <span style={{ fontSize: '1.2rem' }}>✨</span> Chat about anything
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#365314', fontWeight: 'bold' }}>
                                    <span style={{ fontSize: '1.2rem' }}>✨</span> Explore freely!
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowTownWelcome(false);
                                    localStorage.setItem('LUMILIBRO_SEEN_WELCOME', 'true');
                                }}
                                style={{
                                    background: '#84CC16',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    fontSize: '1.2rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    width: '100%',
                                    boxShadow: '0 4px 0 #3F6212, 0 10px 20px rgba(132, 204, 22, 0.4)',
                                    transform: 'translateY(-2px)'
                                }}
                            >
                                Let's Explore!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Intro Modal */}
            {/* Hidden to focus on core features */}
            {/* 
            <AnimatePresence>
                {showIntroModal && displayMystery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 200,
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: '#FFFBEB',
                                width: '100%',
                                maxWidth: '500px',
                                borderRadius: '30px',
                                padding: '2rem',
                                textAlign: 'center',
                                border: '4px solid #F59E0B',
                                boxShadow: '0 0 50px rgba(245, 158, 11, 0.4)',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setShowIntroModal(false)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: '#eee',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{
                                background: '#F59E0B',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                border: '4px solid white',
                                boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)'
                            }}>
                                <Sparkles size={40} color="white" />
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#B45309', marginBottom: '0.5rem', lineHeight: 1.1 }}>
                                {displayMystery.title}
                            </h2>

                            <div style={{ background: 'white', padding: '1rem', borderRadius: '15px', margin: '1.5rem 0', textAlign: 'left', border: '2px dashed #FCD34D', position: 'relative' }}>
                                <button
                                    onClick={() => handleNarrate(`${displayMystery.title}. ${displayMystery.intro}. Clue number one: ${displayMystery.steps[0].clue}`)}
                                    style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        background: isNarrating ? '#FCD34D' : '#FEF3C7',
                                        border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#B45309',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <Volume2 size={20} className={isNarrating ? 'pulse-audio' : ''} />
                                </button>
                                <p style={{ margin: '0 0 1rem 0', color: '#92400E', fontSize: '1.1rem', lineHeight: 1.5, paddingRight: '40px' }}>
                                    {displayMystery.intro}
                                </p>
                                <p style={{ margin: 0, fontWeight: 'bold', color: '#B45309', background: '#FEF3C7', padding: '0.8rem', borderRadius: '10px' }}>
                                    🔎 Clue #1: {displayMystery.steps[0].clue}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    // If already active (dynamic flow), just close
                                    // If not active (legacy/testing), start it
                                    if (!mysteryState.isActive) {
                                        onStartMystery(false);
                                    }
                                    setShowIntroModal(false);
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
                                    boxShadow: '0 4px 0 #92400E, 0 10px 20px rgba(245, 158, 11, 0.4)',
                                    transform: 'translateY(-2px)'
                                }}
                            >
                                START INVESTIGATION
                            </button>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            */}

            {/* Mystery Objective Banner */}
            {/* Hidden to focus on core features */}
            {/* 
            {
                mysteryState?.isActive && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90%',
                            maxWidth: '400px',
                            background: '#FFFBEB',
                            border: '3px solid #F59E0B',
                            borderRadius: '20px',
                            padding: '1rem',
                            zIndex: 60,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ background: '#F59E0B', padding: '0.5rem', borderRadius: '12px', color: 'white', cursor: 'pointer' }} onClick={() => handleNarrate(`Current Mission: ${currentObjective}`)}>
                            {isNarrating ? <Volume2 size={24} className="pulse-audio" /> : <Sparkles size={24} />}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, color: '#B45309', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Mission</h4>
                            <p style={{ margin: 0, color: '#78350F', fontWeight: 'bold', fontSize: '1rem' }}>{currentObjective}</p>
                            {mysteryState.scenario?.steps.find(s => s.id === mysteryState.activeStepId)?.suggestedPhrase && (
                                <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.5)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    <strong style={{ color: '#B45309', display: 'block', fontSize: '0.75rem' }}>💡 Try saying:</strong>
                                    <em style={{ color: '#92400E' }}>"{mysteryState.scenario.steps.find(s => s.id === mysteryState.activeStepId).suggestedPhrase}"</em>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            }
            */}

            {/* Location Modal */}
            <AnimatePresence>
                {activeLocation && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveLocation(null)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                background: 'white',
                                width: '100%',
                                maxWidth: '600px',
                                borderTopLeftRadius: '40px',
                                borderTopRightRadius: '40px',
                                padding: '2.5rem',
                                paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))',
                                position: 'relative',
                                pointerEvents: 'auto',
                                boxShadow: '0 -15px 50px rgba(0,0,0,0.15)'
                            }}
                        >
                            <button
                                onClick={() => setActiveLocation(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    background: 'rgba(0,0,0,0.05)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    color: '#64748B'
                                }}
                            >
                                <X size={24} strokeWidth={3} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '20px',
                                    background: `${activeLocation.color}20`,
                                    color: activeLocation.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {activeLocation.icon}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: 'var(--color-text-primary)' }}>{activeLocation.name}</h2>
                                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Choose an adventure here!</p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.2rem',
                                maxHeight: '55vh',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                padding: '0.5rem 1.2rem 2rem 1.2rem',
                                margin: '0 -1.2rem'
                            }}>

                                {/* MYSTERY SCENARIO INJECTION */}
                                {mysteryState?.isActive && !mysteryState?.isSolved && (() => {
                                    const currentStep = mysteryState.caseData.steps[mysteryState.currentStepIndex];
                                    if (currentStep && currentStep.targetLocation === activeLocation.id) {
                                        return (
                                            <button
                                                onClick={() => onSelectScenario({
                                                    id: `mystery-${currentStep.id}`,
                                                    title: `🕵️‍♀️ Mystery: Contact ${currentStep.npc}`,
                                                    description: currentStep.initialPrompt,
                                                    prompt: `YOU ARE ${currentStep.npc.toUpperCase()}. ${currentStep.npc === 'Barista' ? 'You are working at the cafe.' : ''} The user is looking for the Key. Key info: ${currentStep.clue} ONLY reveal this clue if the user asks about the key (llave). Otherwise, just chat normally.`,
                                                    avatar_type: 'auto',
                                                    color: '#F59E0B', // Gold
                                                    isMystery: true,
                                                    npc: currentStep.npc,
                                                    clue: currentStep.clue,
                                                    locationName: activeLocation.name,
                                                    requiredKeyword: currentStep.requiredKeyword,
                                                    requiredKeywordEnglish: currentStep.requiredKeywordEnglish
                                                })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    padding: '1rem',
                                                    background: '#FFFBEB',
                                                    border: '3px solid #F59E0B',
                                                    borderRadius: '24px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                    boxShadow: '0 6px 0 #F59E0B'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                                    e.currentTarget.style.boxShadow = '0 8px 0 #D97706';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 6px 0 #F59E0B';
                                                }}
                                            >
                                                <div style={{
                                                    background: '#F59E0B',
                                                    padding: '0.8rem',
                                                    borderRadius: '15px',
                                                    color: 'white'
                                                }}>
                                                    <Sparkles size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: '#B45309' }}>
                                                        Case: {mysteryState.caseData.title}
                                                    </h4>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E', fontWeight: 'bold' }}>
                                                        🎯 Objective: Ask {currentStep.npc}
                                                    </p>
                                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#B45309', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                                        🗝️ Secret Word: <b>{currentStep.requiredKeyword}</b> ({currentStep.requiredKeywordEnglish || '...'})
                                                    </p>
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: '#F59E0B', fontSize: '0.9rem' }}>
                                                    INVESTIGATE &rarr;
                                                </div>
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}

                                {activeScenarios.map(scenario => (
                                    <button
                                        key={scenario.id}
                                        onClick={() => onSelectScenario(scenario)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1.2rem',
                                            background: 'white',
                                            border: '4px solid #e2e8f0',
                                            borderRadius: '24px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: '0 6px 0 #e2e8f0'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                            e.currentTarget.style.borderColor = activeLocation.color;
                                            e.currentTarget.style.boxShadow = `0 8px 0 ${activeLocation.color}`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = '0 6px 0 #e2e8f0';
                                        }}
                                    >
                                        <div style={{
                                            background: `${activeLocation.color}15`,
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '15px',
                                            color: activeLocation.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `2px solid ${activeLocation.color}30`,
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            {scenario.avatar_url ? (
                                                <img src={scenario.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            ) : scenario.avatar_type && AVATAR_MAP[scenario.avatar_type] ? (
                                                <img src={AVATAR_MAP[scenario.avatar_type]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            ) : (
                                                <Sparkles size={24} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '900', fontSize: '1.2rem', color: '#1E293B' }}>{scenario.title}</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', lineHeight: 1.4, fontWeight: '500' }}>{scenario.description}</p>
                                        </div>
                                        <div style={{
                                            background: activeLocation.color,
                                            color: 'white',
                                            padding: '0.6rem 1rem',
                                            borderRadius: '15px',
                                            fontSize: '0.9rem',
                                            fontWeight: '900',
                                            boxShadow: `0 4px 0 rgba(0,0,0,0.1)`
                                        }}>
                                            GO!
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => onSurpriseMe(activeLocation.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1.2rem',
                                        background: '#F5F3FF',
                                        border: '4px solid #DDD6FE',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        boxShadow: '0 6px 0 #DDD6FE'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                        e.currentTarget.style.borderColor = '#A78BFA';
                                        e.currentTarget.style.boxShadow = '0 8px 0 #A78BFA';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.borderColor = '#DDD6FE';
                                        e.currentTarget.style.boxShadow = '0 6px 0 #DDD6FE';
                                    }}
                                >
                                    <div style={{
                                        background: 'white',
                                        padding: '0.8rem',
                                        borderRadius: '18px',
                                        color: '#8B5CF6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid #EDE9FE'
                                    }}>
                                        <Sparkles size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '900', fontSize: '1.2rem', color: '#5B21B6' }}>Surprise Me!</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#7C3AED', lineHeight: 1.4, fontWeight: '500' }}>Random adventure.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={onCreateOwn}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1.2rem',
                                        background: 'white',
                                        border: '4px dashed #FECACA',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        boxShadow: '0 6px 0 #FECACA'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                        e.currentTarget.style.borderColor = '#F87171';
                                        e.currentTarget.style.boxShadow = '0 8px 0 #F87171';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.borderColor = '#FECACA';
                                        e.currentTarget.style.boxShadow = '0 6px 0 #FECACA';
                                    }}
                                >
                                    <div style={{
                                        background: '#FFF1F2',
                                        padding: '0.8rem',
                                        borderRadius: '18px',
                                        color: '#E11D48',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid #FFE4E6'
                                    }}>
                                        <Plus size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '900', fontSize: '1.2rem', color: '#9F1239' }}>Create Your Own</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#BE123C', lineHeight: 1.4, fontWeight: '500' }}>Type any topic.</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowExitConfirm(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'auto', backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                background: 'white',
                                width: '90%',
                                maxWidth: '350px',
                                borderRadius: '24px',
                                padding: '2rem',
                                position: 'relative',
                                pointerEvents: 'auto',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                textAlign: 'center',
                                border: '4px solid #EF4444'
                            }}
                        >
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto'
                            }}>
                                <X size={32} />
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B91C1C', marginBottom: '0.5rem' }}>Are you sure?</h2>
                            <p style={{ color: '#7f1d1d', marginBottom: '2rem' }}>You will lose your current mystery progress if you exit now.</p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#F3F4F6',
                                        color: '#374151',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onResetMystery();
                                        setShowExitConfirm(false);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#EF4444',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Quit Mystery
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ATMOSPHERIC LAYERS (Now on top of everything) --- */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 3 }}>
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`cloud-${i}`}
                        initial={{ x: `${-20 - i * 30}%`, y: `${10 + (i * 15) % 60}%`, opacity: 0 }}
                        animate={{
                            x: ['-20%', '120%'],
                            opacity: [0, 0.4, 0.4, 0]
                        }}
                        transition={{
                            duration: 40 + i * 10,
                            repeat: Infinity,
                            delay: i * -15,
                            ease: "linear"
                        }}
                        style={{
                            position: 'absolute',
                            width: `${150 + i * 50}px`,
                            height: `${60 + i * 20}px`,
                            background: 'white',
                            borderRadius: '100px',
                            filter: 'blur(30px)',
                        }}
                    />
                ))}
            </div>

            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '20%',
                width: '60%',
                height: '140%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)',
                transform: 'rotate(-15deg)',
                pointerEvents: 'none',
                zIndex: 4
            }} />
        </div >
    );
};

export default AdventureMap;
