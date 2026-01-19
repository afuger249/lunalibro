import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import sunChar from '../../assets/dashboard/sun_character.png';

export default function SunCard({ onClick, activeMission }) {
    const hasMission = activeMission?.isActive && !activeMission?.isSolved;
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="sun-card-container"
        >
            <style>
                {`
                    .sun-card-container {
                        /* Glassmorphism Card */
                        width: 100%;
                        height: 100%;
                        max-height: 200px;
                        /* Semi-transparent gradient + blur */
                        background: linear-gradient(135deg, rgba(96, 165, 250, 0.85) 0%, rgba(59, 130, 246, 0.9) 100%);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 24px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        padding: 1.5rem;
                        cursor: pointer;
                        box-shadow: 
                            0 10px 30px -10px rgba(37, 99, 235, 0.5),
                            inset 0 0 0 1px rgba(255,255,255,0.2);
                        overflow: visible;
                        margin-top: 1.5rem;
                    }

                    .sun-content {
                        margin-left: 45%; 
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        text-align: left;
                        width: 100%;
                        z-index: 2;
                    }

                    .sun-title {
                        font-family: 'Outfit', sans-serif;
                        font-weight: 800;
                        font-size: 1.6rem;
                        line-height: 1.1;
                        color: white;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                        text-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .sun-subtitle {
                        font-family: 'Outfit', sans-serif;
                        color: rgba(255,255,255,0.9);
                        font-size: 0.9rem;
                        font-weight: 600;
                        margin-bottom: 0.75rem;
                    }

                    /* Glossy Button */
                    .sun-button {
                        background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
                        color: #2563EB;
                        padding: 0.6rem 1.4rem;
                        border-radius: 50px;
                        font-weight: 800;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        /* Glossy Shadows */
                        box-shadow: 
                            0 4px 6px rgba(0,0,0,0.1),
                            0 1px 0 rgba(255,255,255,1) inset,
                            0 -1px 0 rgba(200,200,200,0.2) inset;
                        border: 1px solid rgba(255,255,255,0.6);
                        transform: translateZ(0); 
                    }

                    .sun-image-wrapper {
                        position: absolute;
                        top: -85px; /* Moved up another 15px */
                        left: -45px; 
                        width: 300px; 
                        z-index: 1; /* Behind text */
                    }

                    /* Desktop Override (>900px): Vertical Poster */
                    @media (min-width: 900px) {
                        .sun-card-container {
                            max-width: 320px !important;
                            max-height: none !important;
                            aspect-ratio: 0.8 !important;
                            flex-direction: column !important;
                            justify-content: flex-end !important;
                            align-items: center !important;
                            padding-bottom: 2rem !important;
                            margin-top: 0 !important;
                            border-radius: 40px !important;
                            box-shadow: 0 15px 0 #2563EB, 0 25px 20px rgba(0,0,0,0.2) !important;
                        }

                        .sun-content {
                            margin-left: 0 !important;
                            align-items: center !important;
                            text-align: center !important;
                        }

                        .sun-title {
                            font-size: 2.8rem !important;
                            margin-bottom: 1rem !important;
                        }
                        
                        .sun-subtitle {
                            display: none !important; /* Hide subtitle on poster for cleaner look? or keep */
                        }
                        
                        .sun-button {
                            display: none !important; /* Poster is clickable whole */
                        }

                        .sun-image-wrapper {
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

            {/* Sun Rays / Glow behind */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '20%', transform: 'translate(-50%, -50%)',
                width: '150px', height: '150px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0
            }} />

            {/* Character (Sticker) */}
            <motion.div
                className="sun-image-wrapper"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <img
                    src={sunChar}
                    alt="Sun Character"
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))'
                    }}
                />
            </motion.div>

            {/* Label Content */}
            <div className="sun-content">
                <div className="sun-title">
                    <span style={{ display: 'block', fontSize: '0.9em', opacity: 0.9 }}>
                        {hasMission ? 'Active Mission' : 'Daytime'}
                    </span>
                    {hasMission ? activeMission.caseData?.title : 'Discoveries'}
                </div>

                <div className="sun-button" style={hasMission ? { background: '#FEF3C7', color: '#B45309' } : {}}>
                    {hasMission ? 'RESUME' : 'EXPLORE'} <Play size={14} fill="currentColor" />
                </div>
            </div>

            {/* Desktop-only simple label override if needed, but flex handling above manages it */}
        </motion.div>
    );
}
