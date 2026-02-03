
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import lunaChar from '../../assets/luna_and_friends_logo.png'; // Using the logo as guide for now

export default function LunaGuide() {
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Show greeting after a delay
        const timer = setTimeout(() => setShowTooltip(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            zIndex: 50,
            pointerEvents: 'none'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
                transition={{
                    y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                    opacity: { duration: 0.5 },
                    scale: { duration: 0.5 }
                }}
                style={{
                    width: '140px',
                    height: '140px',
                    position: 'relative'
                }}
            >
                <img
                    src={lunaChar}
                    alt="Luna Guide"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))'
                    }}
                />
            </motion.div>
        </div>
    );
}
