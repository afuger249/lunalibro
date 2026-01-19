import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, SkipForward, CheckCircle, XCircle, RotateCcw, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { supabase } from '../lib/supabase';

export default function FlashCard({ word, onCorrect, onIncorrect, onSkip, ageLevel, currentStreak = 0 }) {
    const [showAnswer, setShowAnswer] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const [interimText, setInterimText] = useState('');
    const [isWrong, setIsWrong] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const { isListening, startListening } = useVoiceRecognition();

    const isKid = ageLevel === 'kid';

    // Auto-play pronunciation on wrong answer
    useEffect(() => {
        if (isWrong && !hasPlayed) {
            playPronunciation();
            setHasPlayed(true);
        }
    }, [isWrong]);

    // Reset hasPlayed when word changes
    useEffect(() => {
        setHasPlayed(false);
    }, [word.id]);

    const handleMicClick = () => {
        if (isListening) return;

        startListening(
            word.spanish_word,
            (transcript) => {
                setInterimText(transcript);
            },
            () => {
                // Correct answer
                setShowAnswer(true);
                setInterimText('');
                fireConfetti();

                // Ripple effect
                const mic = document.getElementById('mic-button');
                if (mic) {
                    mic.style.animation = 'ripple 0.6s ease-out';
                }

                setTimeout(() => {
                    onCorrect();
                    setShowAnswer(false);
                    setSpokenText('');
                }, 2500); // Increased from 2000ms
            },
            (transcript) => {
                // Incorrect answer
                setSpokenText(transcript || '');
                setInterimText('');
                setIsWrong(true);

                // Shake mic button
                const mic = document.getElementById('mic-button');
                if (mic) {
                    mic.style.animation = 'shake 0.5s ease-in-out';
                }
                // Don't auto-advance - wait for user to click Try Again or Next
            }
        );
    };

    const handleDontKnow = () => {
        // Trigger wrong answer flow to show correct answer
        setSpokenText('');
        setInterimText('');
        setIsWrong(true);
        // setCurrentStreak(0); // This line is commented out because `currentStreak` is a prop, not a state variable, and cannot be set directly here.

        // Don't auto-advance - user must click Next
    };

    const handleTryAgain = () => {
        setIsWrong(false);
        setSpokenText('');
        setHasPlayed(false);
    };

    const handleNext = () => {
        onIncorrect(spokenText || 'skipped');
        setSpokenText('');
        setIsWrong(false);
        setHasPlayed(false);
    };

    // Play Spanish pronunciation
    const playPronunciation = async () => {
        try {
            // Use the existing OpenAI TTS helper
            const { generateOpenAISpeech } = await import('../lib/openai_tts');
            const audioUrl = await generateOpenAISpeech(word.spanish_word, 'nova', 1.0);

            const audio = new Audio(audioUrl);
            audio.play();
        } catch (error) {
            console.error('Error playing pronunciation:', error);
        }
    };

    const fireConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
        });
    };

    // Helper to highlight differences
    const renderDifference = () => {
        const spoken = spokenText.toLowerCase();
        const correct = word.spanish_word.toLowerCase();

        // Simple character-by-character comparison
        const maxLen = Math.max(spoken.length, correct.length);
        let spokenHighlight = [];
        let correctHighlight = [];

        for (let i = 0; i < maxLen; i++) {
            const sChar = spoken[i] || '';
            const cChar = correct[i] || '';

            spokenHighlight.push(
                <span key={`s-${i}`} style={{ color: sChar !== cChar ? '#DC2626' : '#1F2937' }}>
                    {sChar}
                </span>
            );

            correctHighlight.push(
                <span key={`c-${i}`} style={{ color: sChar !== cChar ? '#10B981' : '#1F2937' }}>
                    {cChar}
                </span>
            );
        }

        return { spokenHighlight, correctHighlight };
    };

    // Get pronunciation tip
    const getPronunciationTip = () => {
        const spoken = spokenText.toLowerCase();
        const correct = word.spanish_word.toLowerCase();

        // Check for common gender mistakes
        if (spoken.endsWith('a') && correct.endsWith('o')) {
            return "💡 Tip: '-o' ending for masculine!";
        }
        if (spoken.endsWith('o') && correct.endsWith('a')) {
            return "💡 Tip: '-a' ending for feminine!";
        }

        return null;
    };

    const { spokenHighlight, correctHighlight } = spokenText ? renderDifference() : { spokenHighlight: [], correctHighlight: [] };
    const tip = getPronunciationTip();

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                width: '100%',
                maxWidth: '500px',
                perspective: '1000px'
            }}
        >
            {/* Streak indicator - moved inside card to top-right */}
            <AnimatePresence>
                {currentStreak > 0 && !showAnswer && !isWrong && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                            color: 'white',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '20px',
                            fontWeight: '900',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                            zIndex: 20,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Flame size={16} fill="white" />
                        {currentStreak}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '32px',
                padding: '3rem 2rem 4rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                position: 'relative'
            }}>
                {!showAnswer && !isWrong ? (
                    /* Front of card - English word + listening state */
                    <>
                        <div style={{ fontSize: '6rem', textAlign: 'center' }}>
                            {word.illustration_emoji}
                        </div>

                        <h2 style={{
                            fontSize: '3rem',
                            fontWeight: '900',
                            color: '#1F2937',
                            margin: 0,
                            textAlign: 'center'
                        }}>
                            {word.english_word}
                        </h2>

                        {/* Real-time speech display */}
                        <AnimatePresence>
                            {(interimText || spokenText) && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                                        color: '#4F46E5',
                                        padding: '1rem 1.5rem',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        fontSize: '1.2rem',
                                        minHeight: '50px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)'
                                    }}
                                >
                                    {interimText || spokenText}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div
                            id="mic-button"
                            style={{
                                background: isListening ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                                borderRadius: '50%',
                                width: '100px',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: isListening
                                    ? '0 0 30px rgba(16, 185, 129, 0.6), 0 10px 40px rgba(16, 185, 129, 0.3)'
                                    : '0 10px 40px rgba(245, 158, 11, 0.4)',
                                transition: 'all 0.3s ease',
                                animation: isListening ? 'breathe 2s ease-in-out infinite' : 'none'
                            }}
                            onClick={handleMicClick}
                        >
                            <Mic size={48} color="white" fill={isListening ? 'white' : 'none'} strokeWidth={3} />
                        </div>

                        <p style={{
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            color: isListening ? '#10B981' : '#F59E0B',
                            margin: 0
                        }}>
                            {isListening ? 'Listening...' : 'Say it in Spanish!'}
                        </p>

                        {/* I Don't Know button */}
                        <button
                            onClick={handleDontKnow}
                            style={{
                                position: 'absolute',
                                bottom: '1.5rem',
                                right: '1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#9CA3AF',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '12px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            I Don't Know
                        </button>
                    </>
                ) : isWrong ? (
                    /* Wrong answer - show difference + correct answer + Try Again */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        width: '100%'
                    }}>
                        <XCircle size={80} color="#EF4444" />

                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '900',
                            color: '#EF4444',
                            margin: 0
                        }}>
                            Not quite!
                        </h2>

                        {spokenText && (
                            <div style={{
                                background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                                color: '#DC2626',
                                padding: '1rem 1.5rem',
                                borderRadius: '20px',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)'
                            }}>
                                You said: <span style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>{spokenHighlight}</span>
                            </div>
                        )}

                        <div style={{
                            background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
                        }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: '600' }}>
                                Correct answer:
                            </p>
                            <h3 style={{
                                fontSize: '2.5rem',
                                fontWeight: '900',
                                color: '#1F2937',
                                margin: 0,
                                fontFamily: 'monospace',
                                letterSpacing: '0.05em'
                            }}>
                                {spokenText ? correctHighlight : word.spanish_word}
                            </h3>
                        </div>

                        {tip && (
                            <div style={{
                                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                                color: '#92400E',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '15px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                boxShadow: '0 4px 15px rgba(146, 64, 14, 0.2)'
                            }}>
                                {tip}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={playPronunciation}
                                style={{
                                    background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                                    border: '2px solid #8B5CF6',
                                    borderRadius: '50%',
                                    width: '64px',
                                    height: '64px',
                                    minWidth: '64px',
                                    minHeight: '64px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                                    flexShrink: 0
                                }}
                            >
                                <Volume2 size={28} color="#8B5CF6" />
                            </button>

                            <button
                                onClick={handleTryAgain}
                                style={{
                                    background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                                    border: '2px solid #F59E0B',
                                    borderRadius: '20px',
                                    padding: '0.75rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: '900',
                                    fontSize: '1rem',
                                    color: '#92400E',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                                }}
                            >
                                <RotateCcw size={20} />
                                Try Again
                            </button>

                            <button
                                onClick={handleNext}
                                style={{
                                    background: 'var(--color-bg-surface)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '20px',
                                    padding: '0.75rem 1.5rem',
                                    cursor: 'pointer',
                                    fontWeight: '900',
                                    fontSize: '1rem',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Correct answer celebration */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem'
                    }}>
                        <CheckCircle size={80} color="#10B981" />

                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: '900',
                            color: '#10B981',
                            margin: 0
                        }}>
                            ¡Correcto!
                        </h2>

                        <h3 style={{
                            fontSize: '3.5rem',
                            fontWeight: '900',
                            color: '#1F2937',
                            margin: 0,
                            background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'serif',
                            letterSpacing: '0.05em'
                        }}>
                            {word.spanish_word}
                        </h3>

                        <button
                            onClick={playPronunciation}
                            style={{
                                background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                                border: '2px solid #8B5CF6',
                                borderRadius: '50%',
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <Volume2 size={32} color="#8B5CF6" />
                        </button>
                    </div>
                )}
            </div>

            {/* Animations CSS */}
            <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.6), 0 10px 40px rgba(16, 185, 129, 0.3);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 50px rgba(16, 185, 129, 0.8), 0 15px 50px rgba(16, 185, 129, 0.4);
          }
        }
        
        @keyframes ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          100% {
            box-shadow: 0 0 0 30px rgba(16, 185, 129, 0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
        </motion.div>
    );
}
