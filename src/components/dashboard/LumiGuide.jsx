
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import lumiChar from '../../assets/dashboard/bee_character.png'; // Repling old guide with new Bee

export default function LumiGuide() {
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Show greeting after a delay
        const timer = setTimeout(() => setShowTooltip(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: '20%', // Adjusted position
            right: '15%',
            zIndex: 50,
            pointerEvents: 'none' // Let clicks pass through unless on tooltip
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
                    width: '120px',
                    height: '120px',
                    position: 'relative'
                }}
            >
                <img
                    src={lumiChar}
                    alt="Lumi Guide"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                    }}
                />
            </motion.div>

            {/* Greeting moved to SunMoonLayout Header */}
        </div>
    );
}
