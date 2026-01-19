import React from 'react';

const MapSVG = () => {
    return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', borderRadius: '20px', background: '#84cc16' }} preserveAspectRatio="none">
            {/* --- TERRAIN & WATER --- */}
            <defs>
                <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a3e635" />
                    <stop offset="100%" stopColor="#65a30d" />
                </linearGradient>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
            </defs>

            {/* Base Grass */}
            <rect width="100" height="100" fill="url(#grassGrad)" />

            {/* Water (Ocean curve bottom left) */}
            <path d="M0,60 Q20,70 40,100 L0,100 Z" fill="url(#waterGrad)" />

            {/* Sand (Beach area) */}
            <path d="M0,55 Q25,65 45,100 L0,100 Z" fill="url(#sandGrad)" opacity="0.8" />
            <path d="M0,58 Q22,68 42,100 L0,100 Z" fill="none" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2 2" />

            {/* --- ROADS --- */}
            {/* Winding paths connecting the zones */}
            <path
                d="M26,45 Q35,50 52,58 T86,45 M52,58 Q65,65 74,72 Q50,90 35,85"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M26,45 Q35,50 52,58 T86,45 M52,58 Q65,65 74,72 Q50,90 35,85"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth="2"
                strokeDasharray="2 4"
                strokeLinecap="round"
            />

            {/* --- BUILDINGS & ZONES --- */}

            {/* CAFE (26, 38) - Cute detailed shop */}
            <g transform="translate(18, 30)">
                {/* Building Base */}
                <rect x="0" y="5" width="16" height="12" fill="#fdba74" rx="1" stroke="#ea580c" strokeWidth="0.5" />
                {/* Door & Window */}
                <rect x="6" y="10" width="4" height="7" fill="#7c2d12" rx="1" />
                <rect x="2" y="8" width="3" height="4" fill="#60a5fa" rx="0.5" stroke="white" strokeWidth="0.5" />
                <rect x="11" y="8" width="3" height="4" fill="#60a5fa" rx="0.5" stroke="white" strokeWidth="0.5" />
                {/* Awning (Striped) */}
                <path d="M-1,5 L17,5 L16,8 L0,8 Z" fill="#ef4444" />
                <path d="M1,5 L3,5 L2.8,8 L1.2,8 Z" fill="white" opacity="0.5" />
                <path d="M5,5 L7,5 L6.8,8 L5.2,8 Z" fill="white" opacity="0.5" />
                <path d="M9,5 L11,5 L10.8,8 L9.2,8 Z" fill="white" opacity="0.5" />
                <path d="M13,5 L15,5 L14.8,8 L13.2,8 Z" fill="white" opacity="0.5" />
                {/* Sign */}
                <circle cx="2" cy="4" r="2.5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
                <text x="2" y="5" fontSize="2.5" textAnchor="middle" fill="#78350f">☕</text>
            </g>

            {/* LIBRARY / SCHOOL (52, 53) - Grand Building */}
            <g transform="translate(44, 45)">
                {/* Stairs */}
                <path d="M2,15 L14,15 L15,18 L1,18 Z" fill="#9ca3af" />
                {/* Main Building */}
                <rect x="1" y="5" width="14" height="10" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="0.5" />
                {/* Pillars */}
                <rect x="2.5" y="5" width="1.5" height="10" fill="white" />
                <rect x="5.5" y="5" width="1.5" height="10" fill="white" />
                <rect x="8.5" y="5" width="1.5" height="10" fill="white" />
                <rect x="11.5" y="5" width="1.5" height="10" fill="white" />
                {/* Roof */}
                <path d="M0,5 L8,-2 L16,5 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" />
                {/* Clock/Symbol */}
                <circle cx="8" cy="2" r="1.5" fill="white" stroke="#1d4ed8" strokeWidth="0.2" />
            </g>

            {/* HOME / ABUELA'S (86, 35) - Cozy Cottage */}
            <g transform="translate(78, 26)">
                {/* House Body */}
                <rect x="2" y="6" width="12" height="10" fill="#fbcfe8" stroke="#db2777" strokeWidth="0.5" />
                {/* Roof */}
                <path d="M0,6 L8,-2 L16,6 Z" fill="#be185d" />
                {/* Chimney */}
                <rect x="10" y="0" width="2" height="4" fill="#9f1239" />
                <circle cx="11" cy="-1" r="1" fill="#e5e7eb" opacity="0.6" />
                <circle cx="12" cy="-3" r="1.5" fill="#e5e7eb" opacity="0.4" />
                {/* Door & Garden */}
                <rect x="6" y="10" width="4" height="6" fill="#881337" rx="2" />
                <circle cx="3" cy="13" r="1.5" fill="#f472b6" />
                <circle cx="13" cy="13" r="1.5" fill="#f472b6" />
            </g>

            {/* PLAZA (74, 72) - Fountain & Paving */}
            <g transform="translate(64, 62)">
                {/* Paved Area */}
                <ellipse cx="10" cy="10" rx="14" ry="10" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
                {/* Fountain Base */}
                <ellipse cx="10" cy="10" rx="6" ry="4" fill="#60a5fa" stroke="#2563eb" strokeWidth="0.5" />
                {/* Water Spout */}
                <path d="M10,10 L10,6" stroke="#bfdbfe" strokeWidth="2" />
                <circle cx="10" cy="6" r="1.5" fill="#bfdbfe" />
                <path d="M10,6 Q8,4 7,8 M10,6 Q12,4 13,8" fill="none" stroke="#bfdbfe" strokeWidth="0.5" />
            </g>

            {/* BEACH (28, 82) - Palm Tree & Umbrella */}
            <g transform="translate(20, 75)">
                {/* Palm Tree Trunk */}
                <path d="M5,15 Q7,10 5,5" fill="none" stroke="#78350f" strokeWidth="1.5" />
                {/* Leaves */}
                <path d="M5,5 Q0,0 2,8 M5,5 Q10,0 8,8 M5,5 Q5,-2 5,5" fill="none" stroke="#15803d" strokeWidth="1.5" />
                {/* Umbrella */}
                <path d="M10,15 L10,8" stroke="white" strokeWidth="1" />
                <path d="M6,8 Q10,2 14,8 Z" fill="#f43f5e" />
                <path d="M8,8 L10,4 L12,8" fill="white" opacity="0.5" />
            </g>

            {/* --- DECORATIONS --- */}

            {/* Simple Trees */}
            <circle cx="10" cy="20" r="4" fill="#166534" opacity="0.8" />
            <circle cx="15" cy="15" r="5" fill="#15803d" />
            <circle cx="90" cy="90" r="5" fill="#15803d" />
            <circle cx="85" cy="95" r="4" fill="#166534" opacity="0.8" />

            {/* Birds */}
            <path d="M60,10 Q63,12 66,10" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3" />
            <path d="M68,15 Q71,17 74,15" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3" />

            {/* Clouds */}
            <path d="M10,10 Q15,5 20,10 Q25,10 22,14 Q15,16 10,10" fill="white" opacity="0.6" />
            <path d="M80,8 Q85,4 90,8 Q95,8 92,12 Q85,14 80,8" fill="white" opacity="0.6" />

        </svg>
    );
};

export default MapSVG;
