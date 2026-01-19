import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export default function CustomModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = "Yes, Do It",
    cancelText = "Nevermind"
}) {
    if (!isOpen) return null;

    const colors = {
        info: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', icon: '#0EA5E9' },
        success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: '#22C55E' },
        warning: { bg: '#FFFBEB', border: '#FEF3C7', text: '#92400E', icon: '#F59E0B' },
        error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: '#EF4444' }
    };

    const theme = colors[type] || colors.info;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{
                        maxWidth: '400px', width: '100%',
                        background: 'white', borderRadius: '30px',
                        padding: '2rem', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: `4px solid ${theme.border}`,
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                        background: theme.icon
                    }} />

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            color: '#94A3B8', border: 'none', background: 'transparent',
                            padding: '0.5rem', cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: theme.bg, color: theme.icon,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: `0 10px 20px ${theme.border}`
                    }}>
                        <Sparkles size={30} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1F2937', marginBottom: '0.75rem' }}>{title}</h2>
                    <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: '2rem' }}>{message}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {onConfirm ? (
                            <>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%', background: theme.icon,
                                        border: 'none', borderRadius: '15px', padding: '1rem',
                                        color: 'white', fontWeight: 'bold'
                                    }}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: '100%', background: 'transparent',
                                        border: 'none', color: '#64748B', fontWeight: 'bold',
                                        cursor: 'pointer', padding: '0.5rem'
                                    }}
                                >
                                    {cancelText}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="btn btn-primary"
                                style={{
                                    width: '100%', background: theme.icon,
                                    border: 'none', borderRadius: '15px', padding: '1rem',
                                    color: 'white', fontWeight: 'bold'
                                }}
                            >
                                Got it!
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
