
import { motion } from 'framer-motion';
import lunaTownIcon from '../../assets/luna_town_speech_icon.png';
import studyIcon from '../../assets/study_learning_icon.png';
import backpack3d from '../../assets/backpack_icon.png';

export default function BottomDock({ onMapClick, onBackpackClick, onWordRushClick, backpackCount = 0 }) {
    return (
        <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 0.5 }}
            className="bottom-dock-container"
            style={{
                position: 'fixed',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                display: 'flex',
                zIndex: 100,
                paddingBottom: 'env(safe-area-inset-bottom)',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                borderRadius: '32px',
                border: '1.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
                padding: '10px'
            }}
        >
            <style>
                {`
                    .bottom-dock-container {
                        height: 90px;
                    }
                    
                    .dock-panel {
                        flex: 1;
                        max-width: 100px;
                        height: 70px;
                        border-radius: 24px !important;
                        margin: 0 4px;
                        display: flex;
                        align-items: center;
                        justifyContent: center;
                        flex-direction: column;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.15) !important;
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    .dock-panel:first-child {
                        background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%) !important; /* Cyan -> Teal (Luna Town) */
                    }
                    .dock-panel:nth-child(2) {
                        background: linear-gradient(135deg, #F97316 0%, #EA580C 100%) !important; /* Orange (Study) */
                    }
                    .dock-panel:last-child {
                        background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%) !important; /* Green -> Forest (Backpack) */
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
                        width: 48px !important;
                        height: 48px !important;
                        object-fit: contain;
                    }

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
                            font-size: 1.8rem !important;
                        }

                        .dock-icon-wrapper {
                            transform: rotate(5deg) !important;
                        }

                        .dock-icon-img {
                            width: 70px !important;
                            height: 70px !important;
                        }
                    }
                `}
            </style>

            <DockPanel
                onClick={onMapClick}
                background="linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"
                icon={<img src={lunaTownIcon} alt="Luna Town" className="dock-icon-img" />}
                label="Luna Town"
                delay={0}
                borderRadius="30px 10px 0 0"
                textColor="#FFF"
            />

            <DockPanel
                onClick={onWordRushClick}
                background="linear-gradient(135deg, #F97316 0%, #EA580C 100%)"
                icon={<img src={studyIcon} alt="Study" className="dock-icon-img" />}
                label="Study"
                delay={0.05}
                borderRadius="10px 10px 0 0"
                textColor="#FFF"
            />

            <DockPanel
                onClick={onBackpackClick}
                background="linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                icon={<img src={backpack3d} alt="Backpack" className="dock-icon-img" />}
                label="Backpack"
                count={backpackCount}
                delay={0.1}
                borderRadius="10px 30px 0 0"
                textColor="#FFF"
            />
        </motion.div>
    );
}

function DockPanel({ onClick, background, icon, label, count, delay, borderRadius, textColor }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -8, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95, y: 5 }}
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
            <span className="dock-label" style={{
                fontWeight: '900',
                color: textColor,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontFamily: 'Outfit, sans-serif'
            }}>
                {label}
            </span>

            <div className="dock-icon-wrapper">
                {count > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: -8, right: -8,
                        background: '#FFF', color: '#16A34A',
                        borderRadius: '50%',
                        width: '28px', height: '28px',
                        fontSize: '0.9rem', fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '3px solid #16A34A',
                        zIndex: 10,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                        {count}
                    </div>
                )}
                {icon}
            </div>
        </motion.button>
    );
}
