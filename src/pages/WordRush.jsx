import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FlashCard from '../components/FlashCard';
import SessionSummary from '../components/SessionSummary';

export default function WordRush({ ageLevel, spanishLevel }) {
    const navigate = useNavigate();
    const isKid = ageLevel === 'kid';

    // Session configuration  
    const [sessionConfig, setSessionConfig] = useState({ length: 20, started: false });
    const [sessionWords, setSessionWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [score, setScore] = useState({ correct: 0, incorrect: 0 });
    const [loading, setLoading] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [showMilestone, setShowMilestone] = useState(false);

    // Fetch vocabulary when session starts
    const startSession = async (length) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }

            const words = await fetchVocabularyForSession(user.id, spanishLevel, length);

            if (words.length === 0) {
                alert('No vocabulary available! Please try again later.');
                setLoading(false);
                return;
            }

            setSessionWords(words);
            setSessionConfig({ length, started: true });
            setCurrentWordIndex(0);
            setScore({ correct: 0, incorrect: 0 });
            setCurrentStreak(0);
        } catch (error) {
            console.error('Error starting session:', error);
            alert('Failed to start session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle correct answer
    const handleCorrect = async () => {
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        setCurrentStreak(prev => prev + 1);
        await updateWordProgress(sessionWords[currentWordIndex].id, true);

        // Check for milestone (every 5 correct)
        if ((score.correct + 1) % 5 === 0 && score.correct + 1 > 0) {
            setShowMilestone(true);
            setTimeout(() => setShowMilestone(false), 2000);
        }

        if (currentWordIndex < sessionWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            await saveSession(sessionConfig.length, spanishLevel, score.correct + 1, score.incorrect);
            setSessionComplete(true);
        }
    };

    // Handle incorrect answer
    const handleIncorrect = async (spokenText) => {
        setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        setCurrentStreak(0); // Reset streak on incorrect
        await updateWordProgress(sessionWords[currentWordIndex].id, false);

        if (currentWordIndex < sessionWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            await saveSession(sessionConfig.length, spanishLevel, score.correct, score.incorrect + 1);
            setSessionComplete(true);
        }
    };

    // Handle skip
    const handleSkip = () => {
        setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        setCurrentStreak(0); // Reset streak on skip

        if (currentWordIndex < sessionWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            saveSession(sessionConfig.length, spanishLevel, score.correct, score.incorrect + 1);
            setSessionComplete(true);
        }
    };

    // Play again
    const handlePlayAgain = () => {
        setSessionComplete(false);
        setSessionConfig({ length: sessionConfig.length, started: false });
        setCurrentWordIndex(0);
        setScore({ correct: 0, incorrect: 0 });
        setSessionWords([]);
        setCurrentStreak(0);
    };

    // Render session setup screen
    if (!sessionConfig.started) {
        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', position: 'relative' }}>
                <header style={{
                    paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '2rem',
                    width: '100%'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: isKid ? '3px solid var(--border-color)' : '1px solid var(--border-color)',
                            borderRadius: isKid ? '20px' : '10px',
                            color: 'var(--color-primary)',
                            padding: '0.8rem',
                            boxShadow: isKid ? '0 4px 0 var(--border-color)' : 'var(--shadow-sm)',
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
                            ⚡ Word Rush
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                            Quick Spanish vocabulary practice!
                        </p>
                    </div>
                </header>

                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: { staggerChildren: 0.1 }
                        }
                    }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '2rem',
                    }}
                >
                    {[10, 20, 30].map(length => (
                        <motion.button
                            key={length}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startSession(length)}
                            disabled={loading}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isKid ? 'center' : 'flex-start',
                                textAlign: isKid ? 'center' : 'left',
                                gap: '1.5rem',
                                padding: '2rem',
                                cursor: loading ? 'wait' : 'pointer',
                                borderRadius: isKid ? '40px' : 'var(--radius-lg)',
                                background: 'var(--color-bg-secondary)',
                                borderColor: isKid ? '#F59E0B' : 'var(--border-color)',
                                borderWidth: isKid ? '6px' : '1px',
                                boxShadow: isKid ? `0 10px 0 #F59E0B40` : 'var(--shadow-sm)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                padding: isKid ? '1.5rem' : '1rem',
                                borderRadius: isKid ? '30px' : 'var(--radius-md)',
                                backgroundColor: isKid ? '#FEF3C715' : 'var(--color-bg-surface)',
                                color: '#F59E0B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '80px',
                                height: '80px'
                            }}>
                                <Zap size={isKid ? 48 : 40} fill="#F59E0B" />
                            </div>

                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontSize: isKid ? '3rem' : '2.5rem',
                                    fontWeight: '900',
                                    color: '#F59E0B',
                                    margin: 0,
                                    marginBottom: '0.5rem'
                                }}>
                                    {length}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: isKid ? '1.1rem' : '1rem',
                                    fontWeight: '600',
                                    margin: 0
                                }}>
                                    {length === 10 ? 'Quick Sprint' : length === 20 ? 'Medium Practice' : 'Full Challenge'}
                                </p>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                    marginTop: '0.5rem'
                                }}>
                                    ~{Math.ceil(length / 4)} minutes
                                </p>
                            </div>

                            <div style={{
                                marginTop: 'auto',
                                backgroundColor: '#F59E0B',
                                color: 'white',
                                padding: '0.6rem 1.5rem',
                                borderRadius: '20px',
                                fontWeight: '900',
                                fontSize: '0.9rem',
                                width: '100%',
                                textAlign: 'center',
                                boxShadow: isKid ? '0 4px 0 rgba(0,0,0,0.2)' : 'none'
                            }}>
                                {loading ? 'LOADING...' : isKid ? 'GO!' : 'START'}
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem', fontWeight: '600' }}>
                            Preparing your words...
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Render session complete summary
    if (sessionComplete) {
        return (
            <SessionSummary
                score={score}
                sessionLength={sessionConfig.length}
                ageLevel={ageLevel}
                onPlayAgain={handlePlayAgain}
                onBackToDashboard={() => navigate('/dashboard')}
            />
        );
    }

    // Render active flashcard session
    const currentWord = sessionWords[currentWordIndex];
    const progress = ((currentWordIndex + 1) / sessionWords.length) * 100;
    const accuracy = score.correct + score.incorrect > 0
        ? Math.round((score.correct / (score.correct + score.incorrect)) * 100)
        : 100;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem 1rem',
            paddingTop: `calc(2rem + env(safe-area-inset-top))`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Exit Button */}
            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    position: 'absolute',
                    top: `calc(1.5rem + env(safe-area-inset-top))`,
                    left: '1rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    color: '#667eea',
                    fontSize: '1.5rem',
                    fontWeight: '900'
                }}
                title="Exit to Dashboard"
            >
                ✕
            </button>

            {/* Progress Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                zIndex: 10
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: accuracy >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' :
                        accuracy >= 60 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' :
                            'linear-gradient(90deg, #F87171, #EF4444)',
                    transition: 'width 0.5s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }} />
            </div>

            {/* Progress Stats - Repositioned to avoid overlap */}
            <div style={{
                position: 'absolute',
                top: `calc(1.5rem + env(safe-area-inset-top))`,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                zIndex: 10,
                padding: '0 1rem'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '30px',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    color: '#667eea',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    {currentWordIndex + 1}/{sessionWords.length}
                </div>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '30px',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    color: accuracy >= 80 ? '#10B981' : accuracy >= 60 ? '#F59E0B' : '#EF4444',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    {accuracy}% ✓
                </div>
            </div>

            {/* Milestone Celebration */}
            <AnimatePresence>
                {showMilestone && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                            color: 'white',
                            padding: '2rem 3rem',
                            borderRadius: '30px',
                            fontWeight: '900',
                            fontSize: '2rem',
                            boxShadow: '0 20px 60px rgba(251, 191, 36, 0.5)',
                            zIndex: 100,
                            textAlign: 'center'
                        }}
                    >
                        🔥 {score.correct} down! 🔥
                        <div style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>You're on fire!</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FlashCard */}
            <AnimatePresence mode="wait">
                <FlashCard
                    key={currentWord.id}
                    word={currentWord}
                    onCorrect={handleCorrect}
                    onIncorrect={handleIncorrect}
                    onSkip={handleSkip}
                    ageLevel={ageLevel}
                    currentStreak={currentStreak}
                />
            </AnimatePresence>
        </div>
    );
}

// Database functions (same as before)
async function fetchVocabularyForSession(userId, spanishLevel, sessionLength) {
    try {
        const { data: coreWords, error: coreError } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('difficulty_level', spanishLevel)
            .eq('is_core', true)
            .limit(sessionLength);

        if (coreError) throw coreError;

        const shuffled = shuffleArray([...coreWords]);

        if (shuffled.length >= sessionLength) {
            return shuffled.slice(0, sessionLength);
        }

        const needed = sessionLength - shuffled.length;
        const { data: aiWords, error: aiError } = await supabase.functions.invoke('generate-vocabulary', {
            body: { userId, spanishLevel, count: needed }
        });

        if (aiError) {
            console.error('AI generation failed, using only core words:', aiError);
            return shuffled;
        }

        return [...shuffled, ...(aiWords?.words || [])];
    } catch (error) {
        console.error('Error fetching vocabulary:', error);
        return [];
    }
}

async function updateWordProgress(vocabularyId, wasCorrect) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existing } = await supabase
            .from('user_word_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('vocabulary_id', vocabularyId)
            .single();

        if (existing) {
            const newCorrectCount = wasCorrect ? existing.correct_count + 1 : existing.correct_count;
            const newIncorrectCount = !wasCorrect ? existing.incorrect_count + 1 : existing.incorrect_count;
            const newStatus = newCorrectCount >= 3 ? 'mastered' : 'learning';

            await supabase
                .from('user_word_progress')
                .update({
                    correct_count: newCorrectCount,
                    incorrect_count: newIncorrectCount,
                    status: newStatus,
                    last_practiced: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('user_word_progress')
                .insert({
                    user_id: user.id,
                    vocabulary_id: vocabularyId,
                    status: 'learning',
                    correct_count: wasCorrect ? 1 : 0,
                    incorrect_count: !wasCorrect ? 1 : 0,
                    last_practiced: new Date().toISOString()
                });
        }
    } catch (error) {
        console.error('Error updating word progress:', error);
    }
}

async function saveSession(sessionLength, difficultyLevel, wordsCorrect, wordsIncorrect) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('word_rush_sessions')
            .insert({
                user_id: user.id,
                session_length: sessionLength,
                difficulty_level: difficultyLevel,
                words_correct: wordsCorrect,
                words_incorrect: wordsIncorrect
            });
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
