
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, X } from 'lucide-react';

export default function DailyChest({ style }) {
    const [claimed, setClaimed] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Check claim status on mount
    useEffect(() => {
        const lastClaimDate = localStorage.getItem('daily_chest_claim_date');
        const today = new Date().toDateString();

        if (lastClaimDate === today) {
            setClaimed(true);
        }
    }, []);

    const handleClaim = (e) => {
        e.stopPropagation();

        // Mark as claimed
        const today = new Date().toDateString();
        localStorage.setItem('daily_chest_claim_date', today);
        setClaimed(true);
        setIsOpen(false);

        // Confetti!
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#FCD34D', '#F59E0B', '#FFFFFF']
        });

        // TODO: Increment Sparkles in DB
    };

    if (claimed && !isOpen) return null; // Hide if already claimed today

    return (
        <>
            {/* The Chest Icon */}
            {!claimed && (
                <motion.button
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: [-2, 2, -2, 0] }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'absolute',
                        bottom: '25%', // Default (can be overridden)
                        left: '5%',   // Default (can be overridden)
                        width: '80px',
                        height: '70px',
                        background: 'linear-gradient(to bottom, #8B4513, #4A2706)',
                        border: '3px solid #FCD34D',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        zIndex: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                        ...style // Allow overrides
                    }}
                >
                    {/* Lid */}
                    <div style={{
                        position: 'absolute', top: '-10px', left: '-5px', width: '84px', height: '20px',
                        background: '#A0522D', borderRadius: '10px', border: '3px solid #FCD34D'
                    }} />
                    {/* Keyhole */}
                    <div style={{ width: '12px', height: '16px', background: '#FCD34D', borderRadius: '6px' }} />

                    {/* Sparkle hint */}
                    <motion.div
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ position: 'absolute', top: -20, right: -10 }}
                    >
                        <Sparkles color="#FCD34D" fill="#FCD34D" />
                    </motion.div>
                </motion.button>
            )}

            {/* Modal for Reward */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '32px',
                                textAlign: 'center',
                                maxWidth: '300px',
                                position: 'relative',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                border: '6px solid #FCD34D'
                            }}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ position: 'absolute', top: 10, right: 10, background: '#eee', borderRadius: '50%', width: 32, height: 32, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎁</div>
                            <h2 style={{ color: '#D97706', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Daily Reward!</h2>
                            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                                You found <b>5 Sparkles</b> just for visiting!
                            </p>

                            <button
                                onClick={handleClaim}
                                style={{
                                    background: '#F59E0B',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    borderRadius: '50px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    boxShadow: '0 4px 0 #B45309'
                                }}
                            >
                                Claim & Celebrate! 🎊
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
