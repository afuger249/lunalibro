
import { motion } from 'framer-motion';

export default function BadgeProgressBar({ current, next, nextBadge, ageLevel }) {
    const isKid = ageLevel === 'kid';
    const progress = (current / next) * 100;
    const remaining = next - current;

    return (
        <div style={{
            background: isKid ? '#FFF7ED' : '#F9FAFB',
            borderRadius: '20px',
            padding: '1.5rem',
            border: isKid ? '3px solid #FCD34D' : '2px solid #E5E7EB'
        }}>
            {/* Badge Info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {nextBadge.image ? (
                        <motion.img
                            src={nextBadge.image}
                            alt={nextBadge.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                    ) : (
                        nextBadge.emoji
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '900',
                        color: '#1F2937',
                        marginBottom: '0.25rem'
                    }}>
                        {remaining} more words until {nextBadge.name}!
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#6B7280'
                    }}>
                        {current} / {next} words mastered
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{
                background: '#E5E7EB',
                height: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                        background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                        height: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                    }}
                />
            </div>

            {/* Milestone Markers (optional, shows upcoming badges) */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                fontSize: '0.75rem',
                color: '#9CA3AF',
                fontWeight: '600'
            }}>
                <div>0</div>
                <div>{next}</div>
            </div>
        </div>
    );
}
