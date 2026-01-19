
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RotateCcw, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BadgeProgressBar from './BadgeProgressBar';
import confetti from 'canvas-confetti';

// Import plushy assets
import bearImg from '../assets/badges/bear_25.png';
import bunnyImg from '../assets/badges/bunny_50.png';
import puppyImg from '../assets/badges/puppy_75.png';
import kittyImg from '../assets/badges/kitty_100.png';

import elephantImg from '../assets/badges/elephant_150.png';
import lionImg from '../assets/badges/lion_200.png';
import pandaImg from '../assets/badges/panda_250.png';
import koalaImg from '../assets/badges/koala_300.png';
import foxImg from '../assets/badges/fox_350.png';
import tigerImg from '../assets/badges/tiger_400.png';
import cowImg from '../assets/badges/cow_450.png';
import pigImg from '../assets/badges/pig_500.png';
import frogImg from '../assets/badges/frog_600.png';
import monkeyImg from '../assets/badges/monkey_700.png';
import giraffeImg from '../assets/badges/giraffe_800.png';

export default function SessionSummary({
    score,
    sessionLength,
    ageLevel,
    onPlayAgain,
    onBackToDashboard
}) {
    const [badgeProgress, setBadgeProgress] = useState(null);
    const [newBadgeEarned, setNewBadgeEarned] = useState(null);
    const [loading, setLoading] = useState(true);

    const isKid = ageLevel === 'kid';
    const percentage = Math.round((score.correct / sessionLength) * 100);

    useEffect(() => {
        fetchBadgeProgress();
    }, []);

    const fetchBadgeProgress = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Count total mastered words
            const { data: progress } = await supabase
                .from('user_word_progress')
                .select('status')
                .eq('user_id', user.id)
                .eq('status', 'mastered');

            const totalMastered = progress?.length || 0;

            // Determine next badge
            const badgeInfo = getNextBadge(totalMastered);
            setBadgeProgress(badgeInfo);

            // Check if user just earned a new badge
            const earnedBadge = await checkNewBadgeEarned(user.id, totalMastered);
            if (earnedBadge) {
                setNewBadgeEarned(earnedBadge);
                fireGrandConfetti();
            }
        } catch (error) {
            console.error('Error fetching badge progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const fireGrandConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#F59E0B', '#FBBF24', '#FCD34D']
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#8B5CF6', '#A78BFA', '#C4B5FD']
            });
        }, 250);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: isKid
                ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                : 'var(--color-bg-primary)',
            padding: '2rem 1rem',
            paddingTop: `calc(2rem + env(safe-area-inset-top))`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    background: 'white',
                    borderRadius: '32px',
                    padding: '3rem 2rem',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                }}
            >
                {/* Trophy Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    style={{
                        background: percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444',
                        borderRadius: '50%',
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                >
                    <Trophy size={64} color="white" fill="white" />
                </motion.div>

                {/* Score Display - Consolidated */}
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '900',
                    color: '#1F2937',
                    margin: '0 0 0.5rem 0'
                }}>
                    {score.correct}/{sessionLength} <span style={{ fontSize: '2rem', color: percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444' }}>({percentage}%)</span>
                </h1>

                {/* Encouragement Message */}
                <p style={{
                    fontSize: '1.3rem',
                    color: '#6B7280',
                    fontWeight: '700',
                    marginBottom: '2rem'
                }}>
                    {percentage >= 90 ? '¡Increíble! Amazing work! 🌟' :
                        percentage >= 70 ? '¡Muy bien! Great job! 🎉' :
                            percentage >= 50 ? '¡Bien! Good effort! 💪' :
                                '¡Sigue practicando! Keep practicing! 🚀'}
                </p>

                {/* Session Stats */}
                <div style={{ marginBottom: '2rem', background: '#F3F4F6', padding: '1.5rem', borderRadius: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10B981' }}>{score.correct}</div>
                            <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: '600' }}>Correct</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#EF4444' }}>{score.incorrect}</div>
                            <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: '600' }}>Incorrect</div>
                        </div>
                    </div>
                </div>

                {/* Badge Progress */}
                {!loading && badgeProgress && (
                    <div style={{ marginBottom: '2rem' }}>
                        <BadgeProgressBar
                            current={badgeProgress.current}
                            next={badgeProgress.next}
                            nextBadge={badgeProgress.badge}
                            ageLevel={ageLevel}
                        />
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                            borderRadius: '15px',
                            border: '2px solid #C7D2FE'
                        }}>
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#4F46E5',
                                margin: 0,
                                fontWeight: '600',
                                textAlign: 'center'
                            }}>
                                💡 Get a word correct <strong>3 times</strong> to master it!
                            </p>
                        </div>
                    </div>
                )}

                {/* New Badge Earned Modal */}
                {newBadgeEarned && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, #FDE68A, #FBBF24)',
                            padding: '2rem',
                            borderRadius: '24px',
                            marginBottom: '2rem',
                            border: '4px solid #F59E0B',
                            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)'
                        }}
                    >
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {newBadgeEarned.image ? (
                                <motion.img
                                    src={newBadgeEarned.image}
                                    alt={newBadgeEarned.name}
                                    style={{ height: '100%', objectFit: 'contain' }}
                                    animate={{ scale: [1, 1.1, 1] }} // Slightly larger breath for celebration
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                            ) : (
                                newBadgeEarned.emoji
                            )}
                        </div>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '900',
                            color: '#92400E',
                            margin: '0 0 0.5rem 0'
                        }}>
                            New Friend Unlocked!
                        </h3>
                        <p style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#B45309',
                            margin: 0
                        }}>
                            {newBadgeEarned.name} - {newBadgeEarned.label}
                        </p>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexDirection: isKid ? 'column' : 'row'
                }}>
                    <button
                        onClick={onPlayAgain}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        <RotateCcw size={24} />
                        Play Again
                    </button>

                    <button
                        onClick={onBackToDashboard}
                        style={{
                            flex: 1,
                            background: 'white',
                            color: '#6B7280',
                            border: '2px solid #E5E7EB',
                            borderRadius: '20px',
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#F3F4F6';
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        <ArrowLeft size={24} />
                        Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Determine next badge milestone
 */
function getNextBadge(totalMastered) {
    const BADGES = [
        { threshold: 25, emoji: '🐻', image: bearImg, name: 'Bear', label: '25 words!' },
        { threshold: 50, emoji: '🐰', image: bunnyImg, name: 'Bunny', label: '50 words!' },
        { threshold: 75, emoji: '🐶', image: puppyImg, name: 'Puppy', label: '75 words!' },
        { threshold: 100, emoji: '🐱', image: kittyImg, name: 'Kitty', label: '100 words!' },
        { threshold: 150, emoji: '🐘', image: elephantImg, name: 'Elephant', label: '150 words!' },
        { threshold: 200, emoji: '🦁', image: lionImg, name: 'Lion', label: '200 words!' },
        { threshold: 250, emoji: '🐼', image: pandaImg, name: 'Panda', label: '250 words!' },
        { threshold: 300, emoji: '🐨', image: koalaImg, name: 'Koala', label: '300 words!' },
        { threshold: 350, emoji: '🦊', image: foxImg, name: 'Fox', label: '350 words!' },
        { threshold: 400, emoji: '🐯', image: tigerImg, name: 'Tiger', label: '400 words!' },
        { threshold: 450, emoji: '🐮', image: cowImg, name: 'Cow', label: '450 words!' },
        { threshold: 500, emoji: '🐷', image: pigImg, name: 'Pig', label: '500 words!' },
        { threshold: 600, emoji: '🐸', image: frogImg, name: 'Frog', label: '600 words!' },
        { threshold: 700, emoji: '🐵', image: monkeyImg, name: 'Monkey', label: '700 words!' },
        { threshold: 800, emoji: '🦒', image: giraffeImg, name: 'Giraffe', label: '800 words!' },
        { threshold: 900, emoji: '🦓', name: 'Zebra', label: '900 words!' },
    ];

    for (const badge of BADGES) {
        if (totalMastered < badge.threshold) {
            return {
                current: totalMastered,
                next: badge.threshold,
                badge: badge
            };
        }
    }

    // Max level reached
    return {
        current: totalMastered,
        next: 1000,
        badge: { threshold: 1000, emoji: '🦅', name: 'Eagle', label: '1000 words!' }
    };
}

/**
 * Check if user just earned a new badge
 */
async function checkNewBadgeEarned(userId, totalMastered) {
    const BADGE_THRESHOLDS = [25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
    const BADGE_DATA = [
        { emoji: '🐻', image: bearImg, name: 'Bear Friend', threshold: 25, label: '25 words!' },
        { emoji: '🐰', image: bunnyImg, name: 'Bunny Friend', threshold: 50, label: '50 words!' },
        { emoji: '🐶', image: puppyImg, name: 'Puppy Friend', threshold: 75, label: '75 words!' },
        { emoji: '🐱', image: kittyImg, name: 'Kitty Friend', threshold: 100, label: '100 words!' },
        { emoji: '🐘', image: elephantImg, name: 'Elephant Friend', threshold: 150, label: '150 words!' },
        { emoji: '🦁', image: lionImg, name: 'Lion Friend', threshold: 200, label: '200 words!' },
        { emoji: '🐼', image: pandaImg, name: 'Panda Friend', threshold: 250, label: '250 words!' },
        { emoji: '🐨', image: koalaImg, name: 'Koala Friend', threshold: 300, label: '300 words!' },
        { emoji: '🦊', image: foxImg, name: 'Fox Friend', threshold: 350, label: '350 words!' },
        { emoji: '🐯', image: tigerImg, name: 'Tiger Friend', threshold: 400, label: '400 words!' },
        { emoji: '🐮', image: cowImg, name: 'Cow Friend', threshold: 450, label: '450 words!' },
        { emoji: '🐷', image: pigImg, name: 'Pig Friend', threshold: 500, label: '500 words!' },
        { emoji: '🐸', image: frogImg, name: 'Frog Friend', threshold: 600, label: '600 words!' },
        { emoji: '🐵', image: monkeyImg, name: 'Monkey Friend', threshold: 700, label: '700 words!' },
        { emoji: '🦒', image: giraffeImg, name: 'Giraffe Friend', threshold: 800, label: '800 words!' },
        // ... full list
    ];

    // Check if total mastered matches a threshold
    const matchingBadge = BADGE_DATA.find(b => b.threshold === totalMastered);
    if (!matchingBadge) return null;

    // Check if badge already exists
    const { data: existing } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_type', `word_rush_${matchingBadge.name.toLowerCase().replace(' ', '_')}`)
        .single();

    if (existing) return null;

    // Award the badge
    await supabase
        .from('user_badges')
        .insert({
            user_id: userId,
            badge_type: `word_rush_${matchingBadge.name.toLowerCase().replace(' ', '_')}`,
            badge_category: 'word_rush',
            metadata: { words_mastered: totalMastered, label: matchingBadge.label }
        });

    return matchingBadge;
}
