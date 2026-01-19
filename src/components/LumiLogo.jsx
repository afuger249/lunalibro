
import React from 'react';
import logoAsset from '../assets/logo-star.png';

const LumiLogo = ({ size = 50, glow = true }) => {
    return (
        <div style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Background Glow - Subtle gold halo */}
            {glow && (
                <div style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    background: 'radial-gradient(circle, rgba(246, 198, 106, 0.3) 0%, rgba(246, 198, 106, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    filter: 'blur(8px)'
                }} />
            )}

            <img
                src={logoAsset}
                alt="LumiLibro Logo"
                style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 1
                }}
            />
        </div>
    );
};

export default LumiLogo;
