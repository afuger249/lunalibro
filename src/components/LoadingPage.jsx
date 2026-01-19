
import { motion } from 'framer-motion';
import loadingIllustration from '../assets/lumilibro_logo.png';
import splashBackground from '../assets/lumilibro_splash.png';

export default function LoadingPage() {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `url(${splashBackground}) center/cover no-repeat`,
            gap: '2rem',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Darkening Overlay for readability */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1 }} />

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
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    padding: '20px',
                    boxShadow: '0 0 50px rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid rgba(245, 158, 11, 0.5)',
                    zIndex: 2
                }}
            >
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        filter: [
                            'drop-shadow(0 0 20px rgba(246, 198, 106, 0.4))',
                            'drop-shadow(0 0 40px rgba(246, 198, 106, 0.8))',
                            'drop-shadow(0 0 20px rgba(246, 198, 106, 0.4))'
                        ]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        width: '180px',
                        height: '180px',
                        marginBottom: '3rem',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <img
                        src={loadingIllustration}
                        alt="LumiLibro Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </motion.div>
            </motion.div>

            <div style={{ textAlign: 'center' }}>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontSize: '2rem',
                        fontWeight: '900',
                        color: 'var(--color-primary)',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em'
                    }}
                >
                    LUMI<span style={{ color: 'var(--color-accent)' }}>LIBRO</span>
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
                                backgroundColor: 'var(--color-primary)'
                            }}
                        />
                    ))}
                </div>
            </div>

            <p style={{
                position: 'fixed',
                bottom: '3rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                Preparing your adventure...
            </p>
        </div>
    );
}
