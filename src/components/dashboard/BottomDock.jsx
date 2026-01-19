
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import backpack3d from '../../assets/backpack_v2.png';
import pixarMap from '../../assets/map_v2.png';

export default function BottomDock({ onMapClick, onBackpackClick, onWordRushClick, backpackCount = 0 }) {
    return (
        <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 0.5 }}
            className="bottom-dock-container"
            style={{
                position: 'fixed',
                bottom: '1rem', // Floating slightly above bottom
                left: '1rem',
                right: '1rem',
                display: 'flex',
                zIndex: 100,
                paddingBottom: 'env(safe-area-inset-bottom)',
                justifyContent: 'center',
                /* True Glassmorphism Dock matching user description */
                background: 'rgba(255, 255, 255, 0.25)', // Much more transparent
                backdropFilter: 'blur(25px)', // Heavier blur
                WebkitBackdropFilter: 'blur(25px)',
                borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.3)', // Subtle border
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', // Color-tinted shadow for depth
                padding: '10px'
            }}
        >
            <style>
                {`
                    .bottom-dock-container {
                        height: 90px; /* Slightly taller for new icons */
                    }
                    
                    /* Dock Panel (Mobile: Icon Only) */
                    .dock-panel {
                        flex: 1;
                        max-width: 100px;
                        height: 70px;
                        border-radius: 24px !important; /* Softer rounds */
                        margin: 0 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.15) !important;
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    .dock-panel:first-child {
                        background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%) !important; /* Cyan -> Blue (Map) */
                    }
                    .dock-panel:nth-child(2) {
                        background: linear-gradient(135deg, #F97316 0%, #EF4444 100%) !important; /* Orange -> Red (Games) */
                    }
                    .dock-panel:last-child {
                        background: linear-gradient(135deg, #84CC16 0%, #22C55E 100%) !important; /* Lime -> Green (Backpack) */
                    }
                    
                    .dock-label {
                        display: none;
                    }

                    .dock-icon-wrapper {
                        transform: none !important;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .dock-icon-img {
                        width: 52px !important; /* Slightly larger */
                        height: 52px !important;
                        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
                    }
                    .dock-game-svg {
                        width: 34px !important;
                        height: 34px !important;
                    }

                    /* Desktop Overrides (>768px) */
                    @media (min-width: 768px) {
                        .bottom-dock-container {
                            height: 110px;
                            bottom: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            background: rgba(255, 255, 255, 0.1) !important;
                        }

                        .dock-panel {
                            flex: 1 !important;
                            max-width: none !important;
                            height: 100% !important;
                            margin: 0 !important;
                            flex-direction: row !important;
                            gap: 1rem !important;
                            border-radius: 0 !important; 
                        }
                        .dock-panel:first-child { border-radius: 30px 10px 0 0 !important; }
                        .dock-panel:nth-child(2) { border-radius: 10px 10px 0 0 !important; }
                        .dock-panel:last-child { border-radius: 10px 30px 0 0 !important; }


                        .dock-label {
                            display: block !important;
                            font-size: 2rem !important;
                        }

                        .dock-icon-wrapper {
                            transform: rotate(5deg) !important;
                        }

                        .dock-icon-img {
                            width: 65px !important;
                            height: 65px !important;
                        }
                        .dock-game-svg {
                            width: 40px !important;
                            height: 40px !important;
                        }
                    }
                `}
            </style>

            {/* Left Panel: MAP (Blue/Cyan) */}
            <DockPanel
                onClick={onMapClick}
                background="linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)"
                icon={<img src={pixarMap} alt="Map" className="dock-icon-img" style={{ objectFit: 'contain' }} />}
                label="3D Map"
                delay={0}
                borderRadius="30px 10px 0 0"
                textColor="#FFF"
                shadowColor="#0EA5E9"
            />

            {/* Center Panel: GAMES (Orange/Red) */}
            <DockPanel
                onClick={onWordRushClick}
                background="linear-gradient(135deg, #F97316 0%, #EF4444 100%)"
                icon={
                    <div className="dock-game-icon" style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', padding: '8px', border: '2px solid rgba(255,255,255,0.5)' }}>
                        <Gamepad2 className="dock-game-svg" color="white" strokeWidth={3} />
                    </div>
                }
                label="Games"
                delay={0.05}
                borderRadius="10px 10px 0 0"
                textColor="#FFF"
                shadowColor="#EA580C"
            />

            {/* Right Panel: BACKPACK (Lime/Green) */}
            <DockPanel
                onClick={onBackpackClick}
                background="linear-gradient(135deg, #84CC16 0%, #22C55E 100%)"
                icon={<img src={backpack3d} alt="Backpack" className="dock-icon-img" style={{ objectFit: 'contain' }} />}
                label="Backpack"
                count={backpackCount}
                delay={0.1}
                borderRadius="10px 30px 0 0"
                textColor="#FFF"
                shadowColor="#65A30D"
            />
        </motion.div>
    );
}

function DockPanel({ onClick, background, icon, label, count, delay, borderRadius, textColor, shadowColor }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -5, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.98, y: 5 }}
            className="dock-panel"
            style={{
                flex: 1,
                border: 'none',
                background: background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                borderRadius: borderRadius,
                boxShadow: `inset 0 4px 10px rgba(255,255,255,0.3), 0 -4px 0 rgba(0,0,0,0.1)`
            }}
        >
            {/* Text Label */}
            <span className="dock-label" style={{
                fontWeight: '900',
                color: textColor,
                textShadow: '0 2px 0 rgba(0,0,0,0.15)',
                fontFamily: 'Outfit, sans-serif'
            }}>
                {label}
            </span>

            {/* Icon Container (Floating on right) */}
            <div className="dock-icon-wrapper" style={{
                filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.1))'
            }}>
                {count > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: -5, right: -5,
                        background: '#EF4444', color: 'white',
                        borderRadius: '50%',
                        width: '24px', height: '24px',
                        fontSize: '0.8rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {count}
                    </div>
                )}
                {icon}
            </div>
        </motion.button>
    );
}
