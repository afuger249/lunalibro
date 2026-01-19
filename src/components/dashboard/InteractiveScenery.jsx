
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function InteractiveScenery() {
    // We can add more complex elements like fireflies or rustling leaves here
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden'
        }}>
            {/* Background Image Layer */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/src/assets/dashboard/magical_forest_bg.png)', // Using new generated BG
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                filter: 'brightness(0.9) saturate(1.2)' // Slight vibrancy boost
            }} />

            {/* Interactive Zones (Invisible Click Areas that trigger animations) */}
            <SceneryZone top="10%" left="10%" width="200px" height="200px" emoji="🍂" />
            <SceneryZone top="15%" right="15%" width="150px" height="150px" emoji="🐦" />
            <SceneryZone bottom="10%" left="40%" width="20%" height="20%" emoji="🍄" />

            {/* Ambient Fireflies */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        x: [Math.random() * 100, Math.random() * -100],
                        y: [Math.random() * 100, Math.random() * -100],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        repeatType: 'reverse'
                    }}
                    style={{
                        position: 'absolute',
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#FCD34D',
                        boxShadow: '0 0 10px #FCD34D'
                    }}
                />
            ))}
        </div>
    );
}

function SceneryZone({ top, left, right, bottom, width, height, emoji }) {
    const [triggered, setTriggered] = useState(false);

    const handleClick = () => {
        setTriggered(true);
        setTimeout(() => setTriggered(false), 2000);
    };

    return (
        <div
            onClick={handleClick}
            style={{ position: 'absolute', top, left, right, bottom, width, height, cursor: 'pointer' }}
        >
            {triggered && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 0], opacity: [1, 1, 0], y: -50 }}
                    transition={{ duration: 1 }}
                    style={{
                        fontSize: '3rem',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                    }}
                >
                    {emoji}
                </motion.div>
            )}
        </div>
    );
}
