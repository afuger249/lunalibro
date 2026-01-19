import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Eye, EyeOff, Maximize2, Minimize2, Sparkles, Wand2, Home, X, Loader, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { generateOpenAISpeechWithTimestamps } from '../lib/openai_tts';
import { getStorybookById } from '../lib/storybook_storage';
import { generateStoryPDF } from '../lib/pdf_generator';
import { getCachedAudio, setCachedAudio } from '../lib/audio_cache';
import { supabase } from '../lib/supabase';

export default function StoryReader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    }, []);

    // State
    const [page, setPage] = useState(0);
    const [isAutoRead, setIsAutoRead] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [showText, setShowText] = useState(true);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [alignment, setAlignment] = useState(null); // { characters, start_times, end_times }
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'good', 'bad', or null
    const [isSavingFeedback, setIsSavingFeedback] = useState(false);
    const [readerLanguage, setReaderLanguage] = useState('Spanish'); // 'Spanish' or 'English'

    // Refs
    const audioRef = useRef(null);
    const bgMusicRef = useRef(null);
    const activeRequestId = useRef(0); // To track active speech requests

    // Swipe handling refs
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const minSwipeDistance = 50; // threshold for swipe detection

    // Story data (from state or fallback)
    const [story, setStory] = useState(location.state?.story || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreparingPDF, setIsPreparingPDF] = useState(false);
    const [readyPDF, setReadyPDF] = useState(null); // { blobUrl, fileName }

    useEffect(() => {
        const fetchStory = async () => {
            if (!story && id && id !== 'new' && userId) {
                setIsLoading(true);
                const storedStory = await getStorybookById(userId, id);
                if (storedStory) {
                    setStory(storedStory);
                    // Default reader language to story's primary language if it's set
                    if (storedStory.language === 'English') setReaderLanguage('English');
                    else setReaderLanguage('Spanish');
                }
                setIsLoading(false);
            }
        }
        fetchStory();
    }, [id, story, userId]);

    // Fallback if still no story
    const displayStory = story || {
        title: "Mystery Adventure",
        pages: [
            {
                spanishText: "Cargando su historia mágica...",
                englishText: "Loading your magical story...",
                image: "/magic_book_loading.png",
            }
        ]
    };

    // Auto-read effect
    useEffect(() => {
        // Only auto-read if valid page and not "The End" page
        // AND checks if we have a real story loaded (not the fallback "Loading..." text)
        // AND checks if we are NOT blocked by start overlay
        if (isAutoRead && page < displayStory.pages.length && story && !showStartOverlay) {
            readPage(page);
        } else {
            stopReading();
        }

        // --- PRE-FETCHING LOGIC (AI OPTIMIZATION) ---
        const preFetchNextPage = async () => {
            const nextPageIdx = page + 1;
            if (nextPageIdx < displayStory.pages.length) {
                const nextText = displayStory.pages[nextPageIdx].text;
                if (nextText && !getCachedAudio(nextText)) {
                    console.log(`Pre-fetching audio for page ${nextPageIdx + 1}...`);

                    try {
                        const result = await generateOpenAISpeechWithTimestamps(nextText, 'nova', 0.9);

                        setCachedAudio(nextText, { audioUrl: result.audioUrl, alignment: result.alignment });
                        console.log(`Pre-fetch complete for page ${nextPageIdx + 1}`);
                    } catch (e) {
                        // Gracefully handle optimization failures (like quota exceeded)
                        console.warn("Pre-fetch failed (ignoring purely optimization error):", e);
                    }
                }
            }
        };
        // Small delay to prioritize the current page load first
        const preFetchTimer = setTimeout(preFetchNextPage, 1000); // 1s delay

        return () => {
            stopReading();
            clearTimeout(preFetchTimer);
        };
    }, [page, isAutoRead, displayStory.pages.length, story, showStartOverlay, readerLanguage]); // Added readerLanguage

    const stopReading = () => {
        // Increment request ID to invalidate any pending fetches
        activeRequestId.current += 1;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null; // Clean up listeners
            audioRef.current.src = ""; // Detach source
            audioRef.current = null;
        }
        setIsReading(false);
    };

    const readPage = async (pageIdx) => {
        if (pageIdx >= displayStory.pages.length) return;
        const pageObj = displayStory.pages[pageIdx];
        const text = readerLanguage === 'English' ? pageObj.englishText : (pageObj.spanishText || pageObj.text);
        if (!text) return;

        stopReading(); // Stops audio and invalidates pending requests
        const requestId = activeRequestId.current;

        // Debounce: Wait 500ms before fetching to handle rapid swipes
        await new Promise(resolve => setTimeout(resolve, 500));
        if (requestId !== activeRequestId.current) return;

        setIsReading(true);
        setAlignment(null);
        setCurrentWordIndex(-1);

        try {
            let audioUrl, alignData;

            // Check Cache First
            const cached = getCachedAudio(text);
            if (cached) {
                console.log("Using cached audio for:", text.substring(0, 20) + "...");
                audioUrl = cached.audioUrl;
                alignData = cached.alignment;
            } else {
                console.log("Generating audio with OpenAI TTS...");
                const result = await generateOpenAISpeechWithTimestamps(text, 'nova', 0.9);
                audioUrl = result.audioUrl;
                alignData = result.alignment;

                // Save to Cache
                setCachedAudio(text, { audioUrl, alignment: alignData });
            }

            // Check if this request is still active
            if (requestId !== activeRequestId.current) return;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            setAlignment(alignData);

            audio.onended = () => {
                setIsReading(false);
                setCurrentWordIndex(-1);
            };

            // Sync word highlighting
            const updateHighlight = () => {
                if (!audioRef.current || audioRef.current.paused) return;

                const currentTime = audioRef.current.currentTime;

                if (alignData) {
                    const { characters, character_end_times_seconds } = alignData;
                    // Find the index of the character currently being spoken
                    let activeCharIndex = character_end_times_seconds.findIndex(t => t > currentTime);

                    // If audio is playing but findIndex returns -1, we might be at the very end
                    if (activeCharIndex === -1 && currentTime < character_end_times_seconds[character_end_times_seconds.length - 1] + 1.0) {
                        activeCharIndex = character_end_times_seconds.length - 1;
                    }

                    if (activeCharIndex !== -1) {
                        // Construct text up to the current character
                        const textSoFar = characters.slice(0, activeCharIndex + 1).join('');

                        // We need to count non-whitespace tokens (words)
                        const wordsSoFar = textSoFar.trim().split(/\s+/);
                        // The index is length - 1 (0-indexed)
                        const wordIndex = wordsSoFar.length - 1;

                        if (textSoFar.trim().length > 0) {
                            setCurrentWordIndex(wordIndex);
                        }
                    }
                }

                // Recursion strictly based on audio state, not stale React state
                if (audioRef.current && !audioRef.current.paused) {
                    requestAnimationFrame(updateHighlight);
                }
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    requestAnimationFrame(updateHighlight);
                }).catch(e => {
                    console.log("Playback interrupted", e);
                    setIsReading(false);
                });
            }

        } catch (err) {
            if (requestId !== activeRequestId.current) return;
            console.error("Narration failed, falling back to simple:", err);

            // Prevent fallback loop if it's a 429 error
            if (err.message && err.message.includes("429")) {
                console.warn("Rate limit reached. Skipping fallback to prevent further 429s.");
                setIsReading(false);
                return;
            }

            try {
                // Safely fallback to OpenAI if the sophisticated method failed
                const url = await generateOpenAISpeech(text, 'nova', 0.9);
                if (requestId !== activeRequestId.current) return;

                const audio = new Audio(url);
                audioRef.current = audio;
                audio.onended = () => setIsReading(false);

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log("Fallback Playback interrupted", e);
                        setIsReading(false);
                    });
                }
            } catch (fallbackErr) {
                console.error("Fallback narration failed", fallbackErr);
                setIsReading(false);
            }
        }
    };

    // Responsive check
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth > 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Render Page Content Reusable Component
    const renderPageContent = (p, index) => (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <img
                src={p.image}
                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                alt={`Page ${index + 1} `}
            />
            {showText && (
                <div style={{
                    position: 'absolute', bottom: 120, left: 0, right: 0, // Moved up to make room for toggle
                    padding: isDesktop ? '3rem 4rem' : '1rem 2rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
                    color: 'white', textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    <h3 style={{
                        fontSize: isDesktop ? '2rem' : '1.4rem',
                        fontWeight: '900',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1.4,
                        fontFamily: 'var(--font-family-serif)',
                        maxWidth: isDesktop ? '800px' : '100%',
                        margin: '0 auto'
                    }}>
                        {(readerLanguage === 'English' ? p.englishText : (p.spanishText || p.text))?.trim().split(/\s+/).map((word, wIndex) => (
                            <span
                                key={wIndex}
                                style={{
                                    color: (page === index && isReading && wIndex === currentWordIndex) ? '#FCD34D' : 'white',
                                    transform: (page === index && isReading && wIndex === currentWordIndex) ? 'scale(1.1)' : 'scale(1)',
                                    textShadow: (page === index && isReading && wIndex === currentWordIndex) ? '0 0 10px #FCD34D' : '2px 2px 4px rgba(0,0,0,0.8)',
                                    transition: 'all 0.1s ease',
                                    display: 'inline-block',
                                    marginRight: '0.25rem'
                                }}
                            >
                                {word}
                            </span>
                        ))}
                    </h3>
                    {page === index && isReading && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <Volume2 size={24} style={{ opacity: 0.9 }} />
                        </div>
                    )}
                </div>
            )}
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', color: 'white', fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 1px 2px black' }}>
                {index + 1}
            </div>
        </div>
    );

    // Desktop Controls
    const handleNext = () => {
        if (page < displayStory.pages.length) setPage(p => p + 1);
    };

    const handlePrev = () => {
        if (page > 0) setPage(p => p - 1);
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page, displayStory.pages.length]); // Dependencies to ensure latest state

    // Swipe Navigation Handlers
    const onTouchStart = (e) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    const handleDownloadPDF = async () => {
        if (!story) return;

        // If it's ready, trigger the final trusted click
        if (readyPDF) {
            readyPDF.trigger();
            return;
        }

        setIsPreparingPDF(true);
        try {
            const result = await generateStoryPDF(story);
            if (result) {
                setReadyPDF(result);
            }
        } catch (e) {
            console.error("StoryReader PDF Generation Failed:", e);
        } finally {
            setIsPreparingPDF(false);
        }
    };

    const handleFeedback = async (type) => {
        if (!userId || !story || feedback) return;

        setFeedback(type);
        setIsSavingFeedback(true);

        try {
            await supabase.from('story_feedback').insert({
                story_id: story.id,
                user_id: userId,
                rating: type,
                title: story.title,
                created_at: new Date().toISOString()
            });
            console.log("Feedback saved successfully");
        } catch (err) {
            console.error("Failed to save feedback:", err);
        } finally {
            setIsSavingFeedback(false);
        }
    };

    return (
        <div
            style={{ height: '100vh', background: '#1e1b4b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >

            {/* Immersive Start Overlay */}
            {showStartOverlay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 100, background: '#1e1b4b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Magic Particles */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                        <Sparkles size={40} style={{ position: 'absolute', top: '10%', left: '20%', color: '#8B5CF6' }} />
                        <Sparkles size={30} style={{ position: 'absolute', bottom: '15%', right: '25%', color: '#EC4899' }} />
                        <Sparkles size={50} style={{ position: 'absolute', top: '40%', right: '10%', color: '#FCD34D' }} />
                    </div>

                    <div style={{ position: 'relative', perspective: '1000px', marginBottom: '3rem' }}>
                        <motion.div
                            animate={{
                                rotateY: [0, 5, -5, 0],
                                rotateX: [0, 2, -2, 0],
                                y: [0, -10, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            style={{
                                width: '200px', height: '280px',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                borderRadius: '5px 20px 20px 5px',
                                borderLeft: '15px solid #8B5CF6',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRight: '1px solid rgba(255,255,255,0.1)',
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <BookOpen size={80} color="#FCD34D" />
                        </motion.div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                            <Sparkles size={120} color="#FCD34D" style={{ opacity: 0.2, animation: 'pulse 2s infinite' }} />
                        </div>
                    </div>

                    <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', fontWeight: '900', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
                        Open the<br /><span style={{ color: '#FCD34D' }}>Magic Book</span>
                    </h1>

                    <button
                        onClick={handleStartAdventure}
                        style={{
                            padding: '1rem 2rem', borderRadius: '50px',
                            background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
                            color: 'white', border: 'none', fontSize: 'clamp(1.1rem, 5vw, 1.5rem)', fontWeight: 'bold',
                            cursor: 'pointer', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                            transition: 'all 0.3s ease',
                            position: 'relative', overflow: 'hidden'
                        }}
                        onMouseOver={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 40px rgba(139, 92, 246, 0.6)'; }}
                        onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.4)'; }}
                    >
                        Begin Your Adventure
                        {/* Shimmer Effect */}
                        <motion.div
                            animate={{ x: ['100%', '-100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
                                transform: 'skewX(-20deg)'
                            }}
                        />
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2.5rem', fontSize: '1rem', fontWeight: '500' }}>
                        The story is waiting for you...
                    </p>
                </motion.div>
            )}



            {/* DEBUG PROMPT INSPECTOR */}
            {showDebug && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto', color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🔍 Prompt Inspector</h2>
                        <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={32} /></button>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#FCD34D', marginBottom: '0.5rem' }}>Current Page Image Prompt</h3>
                        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', fontFamily: 'monospace', lineHeight: '1.5', userSelect: 'all' }}>
                            {story?.pages?.[page]?.imagePrompt || "No prompt found for this page."}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#FCD34D', marginBottom: '0.5rem' }}>Character Descriptions (Injected)</h3>
                        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', fontFamily: 'monospace', lineHeight: '1.5', userSelect: 'all' }}>
                            {story?.characters?.map(c =>
                                `${c.name} (a cute ${c.type} with ${c.hair} hair, ${c.eyes} eyes, ${c.skin} skin, wearing ${c.clothes})`
                            ).join(', ')}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#FCD34D', marginBottom: '0.5rem' }}>Cover Prompt</h3>
                        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', fontFamily: 'monospace', lineHeight: '1.5', userSelect: 'all' }}>
                            {story?.coverImagePrompt || "No cover prompt found."}
                        </div>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        Copy these into GetImg.ai to test quality.
                    </p>
                </div>
            )}

            {/* Header / Controls */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <button onClick={() => navigate('/bookshelf')} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '50px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                        <X size={20} /> Exit
                    </button>
                    <button onClick={() => setShowDebug(true)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', marginLeft: '1rem' }}>
                        <Info size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', pointerEvents: 'auto' }}>
                    {/* Music Button Commented Out
                    <button
                        onClick={() => {
                            if (isMusicPlaying) {
                                bgMusicRef.current.pause();
                            } else {
                                bgMusicRef.current.play().catch(e => console.log("Audio play failed:", e));
                            }
                            setIsMusicPlaying(!isMusicPlaying);
                        }}
                        style={{
                            color: 'white',
                            background: isMusicPlaying ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                            padding: '0.6rem 1.2rem', borderRadius: '50px', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', backdropFilter: 'blur(5px)'
                        }}
                    >
                        {isMusicPlaying ? <Sparkles size={20} /> : <div style={{ opacity: 0.5 }}><Sparkles size={20} /></div>}
                        {isMusicPlaying ? 'Music: On' : 'Music: Off'}
                    </button>
                    */}
                    <button
                        onClick={() => setIsAutoRead(!isAutoRead)}
                        style={{
                            color: 'white',
                            background: isAutoRead ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                            padding: '0.6rem 1.2rem', borderRadius: '50px', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', backdropFilter: 'blur(5px)'
                        }}
                    >
                        {isAutoRead ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        {isAutoRead ? 'Auto-Read: On' : 'Auto-Read: Off'}
                    </button>
                    <button
                        onClick={() => setShowText(!showText)}
                        style={{
                            color: 'white',
                            background: showText ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                            padding: '0.6rem 1.2rem', borderRadius: '50px', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', backdropFilter: 'blur(5px)'
                        }}
                    >
                        {showText ? <EyeOff size={20} /> : <Eye size={20} />}
                        {showText ? 'Hide Text' : 'Show Text'}
                    </button>

                    {/* Bilingual Language Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '50px', padding: '0.3rem', backdropFilter: 'blur(5px)' }}>
                        <button
                            onClick={() => setReaderLanguage('Spanish')}
                            style={{
                                color: readerLanguage === 'Spanish' ? '#1e1b4b' : 'white',
                                background: readerLanguage === 'Spanish' ? '#FCD34D' : 'transparent',
                                border: 'none', borderRadius: '50px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => setReaderLanguage('English')}
                            style={{
                                color: readerLanguage === 'English' ? '#1e1b4b' : 'white',
                                background: readerLanguage === 'English' ? '#FCD34D' : 'transparent',
                                border: 'none', borderRadius: '50px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>

            {/* 
            <audio ref={bgMusicRef} loop>
                <source src="https://assets.mixkit.co/active_storage/sfx/2521/2521-preview.mp3" type="audio/mpeg" />
            </audio> 
            */}

            {/* Main Content Area */}
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* Unified View: Framer Motion Slide */}
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            {page < displayStory.pages.length ? (
                                renderPageContent(displayStory.pages[page], page)
                            ) : (
                                // The End Page (Unified)
                                <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '90%', margin: '0 1rem' }}>
                                        <Sparkles size={isDesktop ? 100 : 60} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
                                        <h1 style={{ color: 'white', fontSize: isDesktop ? '4rem' : '2.5rem', fontWeight: '900', marginBottom: '1rem', background: 'linear-gradient(to right, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>The End</h1>
                                        <p style={{ color: '#94a3b8', fontSize: isDesktop ? '1.5rem' : '1.1rem', marginBottom: '2rem' }}>Hope you enjoyed the adventure!</p>

                                        {/* Feedback Loop */}
                                        <div style={{ marginBottom: '3rem', animation: 'fadeIn 1s ease' }}>
                                            <p style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Was this story good?</p>
                                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleFeedback('good')}
                                                    disabled={isSavingFeedback || feedback !== null}
                                                    style={{
                                                        background: feedback === 'good' ? '#10b981' : 'rgba(255,255,255,0.1)',
                                                        border: 'none', borderRadius: '50%', width: '60px', height: '60px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: feedback ? 'default' : 'pointer', transition: 'all 0.3s ease',
                                                        transform: feedback === 'good' ? 'scale(1.2)' : 'scale(1)',
                                                        opacity: feedback && feedback !== 'good' ? 0.3 : 1
                                                    }}
                                                >
                                                    <span style={{ fontSize: '2rem' }}>👍</span>
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback('bad')}
                                                    disabled={isSavingFeedback || feedback !== null}
                                                    style={{
                                                        background: feedback === 'bad' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                                        border: 'none', borderRadius: '50%', width: '60px', height: '60px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: feedback ? 'default' : 'pointer', transition: 'all 0.3s ease',
                                                        transform: feedback === 'bad' ? 'scale(1.2)' : 'scale(1)',
                                                        opacity: feedback && feedback !== 'bad' ? 0.3 : 1
                                                    }}
                                                >
                                                    <span style={{ fontSize: '2rem' }}>👎</span>
                                                </button>
                                            </div>
                                            {feedback && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{ color: '#FCD34D', marginTop: '1rem', fontWeight: 'bold' }}
                                                >
                                                    {feedback === 'good' ? "Glad you liked it! ✨" : "Thanks for the feedback! We'll try harder."}
                                                </motion.p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '1.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => navigate(`/storybook/create?continueFrom=${story?.id || id}`)}
                                                style={{ padding: '0.8rem 1.5rem', borderRadius: '15px', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: isDesktop ? '1.2rem' : '1rem', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)' }}
                                            >
                                                Continue Adventure <ArrowRight size={20} />
                                            </button>
                                            <button
                                                onClick={handleDownloadPDF}
                                                disabled={isPreparingPDF}
                                                style={{
                                                    padding: '1rem 2rem',
                                                    borderRadius: '15px',
                                                    background: readyPDF ? '#10b981' : '#3B82F6',
                                                    color: 'white',
                                                    border: 'none',
                                                    fontWeight: 'bold',
                                                    cursor: isPreparingPDF ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.8rem',
                                                    fontSize: '1.2rem',
                                                    boxShadow: readyPDF ? '0 10px 25px rgba(16, 185, 129, 0.4)' : '0 10px 25px rgba(59, 130, 246, 0.4)'
                                                }}
                                            >
                                                {isPreparingPDF ? (
                                                    <>Preparing Magic... <Loader size={24} className="animate-spin" /></>
                                                ) : readyPDF ? (
                                                    <>Download Ready! <Sparkles size={24} /></>
                                                ) : (
                                                    <>Print Story PDF <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg></>
                                                )}
                                            </button>
                                            <button onClick={() => navigate('/bookshelf')} style={{ padding: '1rem 2rem', borderRadius: '15px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1.1rem' }}>
                                                <Home size={20} /> Return to Library
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {page > 0 && (
                        <button
                            onClick={handlePrev}
                            style={{ position: 'absolute', top: '50%', left: isDesktop ? '2rem' : '1rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.2s', zIndex: 50 }}
                        >
                            <ArrowLeft size={32} />
                        </button>
                    )}
                    {page < displayStory.pages.length && (
                        <button
                            onClick={handleNext}
                            style={{ position: 'absolute', top: '50%', right: isDesktop ? '2rem' : '1rem', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.2s', zIndex: 50 }}
                        >
                            <ArrowRight size={32} />
                        </button>
                    )}
                </div>
            </div>

            {/* Nav Hints (Common) */}
            <div style={{ position: 'absolute', bottom: '2rem', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: '500', display: 'flex', gap: '2rem', pointerEvents: 'none', zIndex: 10 }}>
                <span>Use Arrow Buttons to Navigate</span>
            </div>

        </div>
    );
}

