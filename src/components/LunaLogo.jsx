
import React from 'react';
import logoAsset from '../assets/luna_and_friends_logo.png';

const LunaLogo = ({ size = 50, glow = true }) => {
    return (
        <div style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Background Glow - Vibrant teal/coral halo */}
            {glow && (
                <div style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(244, 63, 94, 0.2) 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    filter: 'blur(12px)'
                }} />
            )}

            <img
                src={logoAsset}
                alt="Luna and Friends Logo"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 1,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                }}
            />
        </div>
    );
};

export default LunaLogo;
