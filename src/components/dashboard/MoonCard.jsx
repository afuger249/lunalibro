
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import moonChar from '../../assets/dashboard/moon_character.png';

export default function MoonCard({ onClick }) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="moon-card-container"
        >
            <style>
                {`
                    .moon-card-container {
                        /* Glassmorphism Card */
                        width: 100%;
                        height: 100%;
                        max-height: 200px;
                        /* Semi-transparent gradient + blur */
                        background: linear-gradient(135deg, rgba(67, 56, 202, 0.85) 0%, rgba(49, 46, 129, 0.9) 100%);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 24px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        padding: 1.5rem;
                        cursor: pointer;
                        box-shadow: 
                            0 10px 30px -10px rgba(30, 27, 75, 0.5),
                            inset 0 0 0 1px rgba(255,255,255,0.1);
                        overflow: visible;
                        margin-top: 1.5rem;
                    }

                    .moon-content {
                        margin-left: 45%;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        text-align: left;
                        width: 100%;
                        z-index: 2;
                    }

                    .moon-title {
                        font-family: 'Outfit', sans-serif;
                        font-weight: 800;
                        font-size: 1.6rem;
                        line-height: 1.1;
                        color: white;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    }

                    /* Glossy Button */
                    .moon-button {
                        background: linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%);
                        color: #312E81;
                        padding: 0.6rem 1.4rem;
                        border-radius: 50px;
                        font-weight: 800;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        /* Glossy Shadows */
                        box-shadow: 
                            0 4px 6px rgba(0,0,0,0.2),
                            0 1px 0 rgba(255,255,255,1) inset,
                            0 -1px 0 rgba(200,200,200,0.2) inset;
                        border: 1px solid rgba(255,255,255,0.6);
                        transform: translateZ(0);
                    }

                    .moon-image-wrapper {
                        position: absolute;
                        top: -85px; /* Moved up another 15px */
                        left: -45px;
                        width: 290px;
                        z-index: 1; /* Behind text */
                    }

                    /* Desktop Override (>900px) */
                    @media (min-width: 900px) {
                        .moon-card-container {
                            max-width: 320px !important;
                            max-height: none !important;
                            aspect-ratio: 0.8 !important;
                            flex-direction: column !important;
                            justify-content: flex-end !important;
                            align-items: center !important;
                            padding-bottom: 2rem !important;
                            margin-top: 0 !important;
                            border-radius: 40px !important;
                            box-shadow: 0 15px 0 #1E1B4B, 0 25px 20px rgba(0,0,0,0.2) !important;
                        }

                        .moon-content {
                            margin-left: 0 !important;
                            align-items: center !important;
                            text-align: center !important;
                        }

                        .moon-title {
                            font-size: 2.8rem !important;
                            margin-bottom: 1rem !important;
                        }

                         .moon-button {
                            display: none !important;
                        }

                        .moon-image-wrapper {
                            position: relative !important;
                            top: auto !important;
                            left: auto !important;
                            width: 130% !important;
                            margin-top: -3rem !important;
                            margin-bottom: 1rem !important;
                        }
                    }
                `}
            </style>

            {/* Background Stars / Dots */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 2px, transparent 2px)',
                backgroundSize: '30px 30px',
                zIndex: 0,
                borderRadius: 'inherit'
            }} />

            {/* Character (Sticker) */}
            <motion.div
                className="moon-image-wrapper"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
                <img
                    src={moonChar}
                    alt="Moon Character"
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))'
                    }}
                />
            </motion.div>

            {/* Label */}
            <div className="moon-content">
                <div className="moon-title">
                    <span style={{ display: 'block', fontSize: '0.9em', opacity: 0.9 }}>Nighttime</span>
                    Stories
                </div>
                <div className="moon-button">
                    READ <BookOpen size={14} />
                </div>
            </div>
        </motion.div>
    );
}
