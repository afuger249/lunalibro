
import { motion } from 'framer-motion';
import loadingIllustration from '../assets/luna_and_friends_logo.png';

export default function LoadingPage() {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #06B6D4 0%, #22C55E 100%)', // Vibrant Cyan to Green
            gap: '2rem',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Animated bubbles in the background */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [-20, -1000],
                        opacity: [0, 0.5, 0],
                        x: [0, (i % 2 === 0 ? 50 : -50)]
                    }}
                    transition={{
                        duration: 5 + i,
                        repeat: Infinity,
                        delay: i * 1.5,
                        ease: "linear"
                    }}
                    style={{
                        position: 'absolute',
                        bottom: -50,
                        left: `${15 * i + 10}%`,
                        width: `${20 + i * 10}px`,
                        height: `${20 + i * 10}px`,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 1
                    }}
                />
            ))}

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: [0.8, 1.05, 1],
                    opacity: 1,
                }}
                transition={{
                    duration: 1.2,
                    ease: "easeOut"
                }}
                style={{
                    width: '220px',
                    height: '220px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    padding: '20px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1), 0 0 30px rgba(6, 182, 212, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid rgba(255, 255, 255, 0.4)',
                    zIndex: 2
                }}
            >
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, 0, -2, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <img
                        src={loadingIllustration}
                        alt="Luna and Friends Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
                        }}
                    />
                </motion.div>
            </motion.div>

            <div style={{ textAlign: 'center', zIndex: 10 }}>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em',
                        textShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    LUNA <span style={{ color: '#F43F5E' }}>& FRIENDS</span>
                </motion.h1>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'white'
                            }}
                        />
                    ))}
                </div>
            </div>

            <p style={{
                position: 'fixed',
                bottom: '3rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '800',
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                zIndex: 10
            }}>
                Luna is getting ready...
            </p>
        </div>
    );
}
