import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, Star, Volume2, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
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

const ALL_BADGES = [
    { threshold: 25, emoji: '🐻', image: bearImg, name: 'Bear' },
    { threshold: 50, emoji: '🐰', image: bunnyImg, name: 'Bunny' },
    { threshold: 75, emoji: '🐶', image: puppyImg, name: 'Puppy' },
    { threshold: 100, emoji: '🐱', image: kittyImg, name: 'Kitty' },
    { threshold: 150, emoji: '🐘', image: elephantImg, name: 'Elephant' },
    { threshold: 200, emoji: '🦁', image: lionImg, name: 'Lion' },
    { threshold: 250, emoji: '🐼', image: pandaImg, name: 'Panda' },
    { threshold: 300, emoji: '🐨', image: koalaImg, name: 'Koala' },
    { threshold: 350, emoji: '🦊', image: foxImg, name: 'Fox' },
    { threshold: 400, emoji: '🐯', image: tigerImg, name: 'Tiger' },
    { threshold: 450, emoji: '🐮', image: cowImg, name: 'Cow' },
    { threshold: 500, emoji: '🐷', image: pigImg, name: 'Pig' },
    { threshold: 600, emoji: '🐸', image: frogImg, name: 'Frog' },
    { threshold: 700, emoji: '🐵', image: monkeyImg, name: 'Monkey' },
    { threshold: 800, emoji: '🦒', image: giraffeImg, name: 'Giraffe' },
    { threshold: 900, emoji: '🦓', name: 'Zebra' },
    { threshold: 1000, emoji: '🦘', name: 'Kangaroo' },
    { threshold: 1200, emoji: '🦙', name: 'Llama' },
    { threshold: 1400, emoji: '🦔', name: 'Hedgehog' },
    { threshold: 1600, emoji: '🦦', name: 'Otter' },
    { threshold: 1800, emoji: '🦥', name: 'Sloth' },
    { threshold: 2000, emoji: '🦩', name: 'Flamingo' }
];

export default function Collection({ ageLevel = 'adult' }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('badges'); // 'treasures' or 'badges'
    const [treasures, setTreasures] = useState([]);
    const [badges, setBadges] = useState([]);
    const [masteredCount, setMasteredCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [wordCount, setWordCount] = useState(0);

    // Calculate current badge index based on word count
    const currentBadgeIndex = ALL_BADGES.findIndex(b => wordCount < b.threshold);
    // If -1, it means they passed all thresholds (or 0 if they haven't started, logic depends on findIndex)
    // Actually simpler: reverse find the first badge where wordCount >= threshold
    const unlockedBadgeIndex = [...ALL_BADGES].reverse().findIndex(b => wordCount >= b.threshold);
    // If unlockedBadgeIndex is -1 (found nothing), it means 0 badges. 
    // If it found something at index 0 (which is the last badge effectively), the real index is length - 1 - foundIndex
    const realUnlockedIndex = unlockedBadgeIndex === -1 ? -1 : (ALL_BADGES.length - 1 - unlockedBadgeIndex);

    const triggerCelebration = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    useEffect(() => {
        const checkNewBadge = () => {
            // Only auto-celebrate if we have at least one badge
            if (realUnlockedIndex >= 0) {
                const lastSeen = parseInt(localStorage.getItem('last_seen_badge_index') || '-1');
                if (realUnlockedIndex > lastSeen) {
                    triggerCelebration();
                    localStorage.setItem('last_seen_badge_index', realUnlockedIndex.toString());
                }
            }
        };

        // Slight delay to ensure render
        const timer = setTimeout(checkNewBadge, 1000);
        return () => clearTimeout(timer);
    }, [realUnlockedIndex]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const isKid = ageLevel === 'kid';

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch mystery treasures from localStorage (not in database!)
            // Fetch mystery treasures
            const { data: treasuresData, error: treasuresError } = await supabase
                .from('user_treasures')
                .select('*')
                .eq('user_id', user.id)
                .order('found_at', { ascending: false });

            console.log('Treasures fetch:', { treasuresData, treasuresError, userId: user.id });
            setTreasures(treasuresData || []);

            // Fetch earned badges
            const { data: badgesData } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id);

            setBadges(badgesData || []);

            // Fetch mastered word count for progress
            const { data: progressData } = await supabase
                .from('user_word_progress')
                .select('status')
                .eq('user_id', user.id)
                .eq('status', 'mastered');

            setMasteredCount(progressData?.length || 0);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching collections:', error);
            setLoading(false);
        }
    };

    const isBadgeUnlocked = (threshold) => {
        return masteredCount >= threshold;
    };

    const getNextBadge = () => {
        return ALL_BADGES.find(badge => masteredCount < badge.threshold) || ALL_BADGES[ALL_BADGES.length - 1];
    };

    const nextBadge = getNextBadge();

    return (
        <div style={{
            minHeight: '100vh',
            background: activeTab === 'treasures'
                ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
                : 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
            padding: '2rem 1rem',
            paddingTop: `calc(2rem + env(safe-area-inset-top))`,
            transition: 'background 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto 2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                >
                    <ArrowLeft size={24} color="#1F2937" />
                </button>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#1F2937',
                    margin: 0
                }}>
                    🎒 My Collection
                </h1>
            </div>

            {/* Tab Bar - Hidden to focus on core features (Word Rush Badges Only) */}
            {/* 
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto 2rem',
                display: 'flex',
                gap: '1rem',
                background: 'rgba(255, 255, 255, 0.4)',
                padding: '0.5rem',
                borderRadius: '20px'
            }}>
                <button
                    onClick={() => setActiveTab('treasures')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '16px',
                        border: 'none',
                        background: activeTab === 'treasures'
                            ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                            : 'transparent',
                        color: activeTab === 'treasures' ? 'white' : '#92400E',
                        fontWeight: '900',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: activeTab === 'treasures' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none'
                    }}
                >
                    <Sparkles size={20} />
                    Mystery Treasures
                </button>
                <button
                    onClick={() => setActiveTab('badges')}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '16px',
                        border: 'none',
                        background: activeTab === 'badges'
                            ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                            : 'transparent',
                        color: activeTab === 'badges' ? 'white' : '#6D28D9',
                        fontWeight: '900',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: activeTab === 'badges' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
                    }}
                >
                    <Trophy size={20} />
                    Word Rush Badges
                </button>
            </div>
            */}

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'treasures' ? (
                    /* Hidden to focus on core features */
                    null
                ) : (
                    <motion.div
                        key="badges"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}
                    >
                        {/* Badges Header */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '24px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧸</div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#6D28D9', margin: '0 0 0.5rem 0' }}>
                                Word Rush Badges
                            </h2>
                            <p style={{ color: '#7C3AED', margin: 0 }}>
                                Collect all 22 plush friends by mastering Spanish words!
                            </p>
                        </div>

                        {/* Next Badge Progress */}
                        {masteredCount < 2000 && (
                            <div style={{
                                background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                                borderRadius: '24px',
                                padding: '1.5rem',
                                marginBottom: '2rem',
                                border: '3px solid #C7D2FE',
                                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {nextBadge.image ? (
                                            <motion.img
                                                src={nextBadge.image}
                                                alt={nextBadge.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        ) : (
                                            nextBadge.emoji
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#6D28D9' }}>
                                            {nextBadge.threshold - masteredCount} more words until {nextBadge.name}!
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#7C3AED' }}>
                                            {masteredCount} / {nextBadge.threshold} words mastered
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: '#E0E7FF',
                                    height: '16px',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(masteredCount / nextBadge.threshold) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{
                                            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                                            height: '100%',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Badges Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            padding: '1rem 0'
                        }}>
                            {ALL_BADGES.map((badge, idx) => {
                                // TEMP: Unlock all for visual check
                                const unlocked = isBadgeUnlocked(badge.threshold);
                                const isNext = badge.threshold === nextBadge?.threshold;

                                return (
                                    <motion.div
                                        key={badge.threshold}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        style={{
                                            background: unlocked
                                                ? 'rgba(255, 255, 255, 0.95)'
                                                : 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '24px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            textAlign: 'center',
                                            border: isNext
                                                ? '3px solid #8B5CF6'
                                                : unlocked
                                                    ? '2px solid #C7D2FE'
                                                    : '2px dashed #D1D5DB',
                                            boxShadow: isNext
                                                ? '0 0 20px rgba(139, 92, 246, 0.4)'
                                                : unlocked
                                                    ? '0 10px 25px rgba(0,0,0,0.1)'
                                                    : 'none',
                                            position: 'relative', // For lock overlay
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '5rem',
                                            width: '200px',
                                            height: '200px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            filter: unlocked ? 'none' : 'grayscale(100%) opacity(0.6)', // Grayscale if locked
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {badge.image ? (
                                                <motion.img
                                                    src={badge.image}
                                                    alt={badge.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    animate={{
                                                        scale: unlocked ? [1, 1.05, 1] : 1, // Only breathe if unlocked
                                                    }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
                                                />
                                            ) : badge.emoji}
                                        </div>

                                        {/* Lock Overlay */}
                                        {!unlocked && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: 'rgba(255,255,255,0.8)',
                                                borderRadius: '50%',
                                                padding: '4px',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}>
                                                🔒
                                            </div>
                                        )}

                                        <div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: '900',
                                                color: unlocked ? '#6D28D9' : '#9CA3AF',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {badge.name}
                                            </div>
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: unlocked ? '#8B5CF6' : '#9CA3AF',
                                                background: unlocked ? '#F3E8FF' : '#E5E7EB',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                display: 'inline-block'
                                            }}>
                                                {badge.threshold} words
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: unlocked ? '#7C3AED' : '#9CA3AF',
                                                marginTop: '0.25rem'
                                            }}>
                                                {unlocked ? 'Earned!' : `${badge.threshold} words`}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => navigate('/word-rush')}
                            style={{
                                marginTop: '2rem',
                                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '50px',
                                fontWeight: '900',
                                width: '100%',
                                maxWidth: '400px',
                                display: 'block',
                                margin: '2rem auto 0',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 0 #5B21B6'
                            }}
                        >
                            PRACTICE MORE WORDS!
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
