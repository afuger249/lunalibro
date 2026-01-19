import { motion } from 'framer-motion';
import SunCard from './SunCard';
import MoonCard from './MoonCard';
import logo from '../../assets/lumilibro_app_icon.png';

export default function SunMoonLayout({ onSunClick, onMoonClick, activeMission }) {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            overflow: 'hidden',
            paddingTop: 'calc(1rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(130px + env(safe-area-inset-bottom))',
        }}>

            {/* Header: Logo Only */}
            <div style={{
                width: '100%',
                maxWidth: '500px',
                padding: '0 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start', // Align left
                marginBottom: '1rem',
                zIndex: 20
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img
                        src={logo}
                        alt="LunaLibro"
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '1.2rem', color: '#1F2937', lineHeight: 1 }}>LunaLibro</span>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .sun-moon-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 1.5rem; /* Increased gap */
                        width: 100%;
                        height: 100%;
                        max-width: 500px; /* Mobile max width */
                        margin: 0 auto;
                        padding: 0 1rem;
                    }

                    /* Card Wrappers */
                    .card-wrapper {
                        flex: 1; 
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 0;
                        position: relative;
                    }

                    /* Desktop Breakpoint (>900px) */
                    @media (min-width: 900px) {
                        .sun-moon-container {
                            flex-direction: row !important;
                            max-width: 1200px;
                            gap: 4rem !important;
                        }

                        .card-wrapper {
                            height: 100%;
                            align-items: center;
                        }
                    }
                `}
            </style>

            <motion.div
                className="sun-moon-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Sun Card Hidden to focus on Bookshelf */}
                {/* 
                <div className="card-wrapper">
                    <SunCard onClick={onSunClick} compact={true} activeMission={activeMission} />
                </div>
                */}

                {/* Moon Card Container */}
                <div className="card-wrapper">
                    <MoonCard onClick={onMoonClick} compact={true} />
                </div>
            </motion.div>

        </div>
    );
}
