import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PremiumSelect({ label, value, options, onChange, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block', fontSize: '0.8rem', fontWeight: 'bold',
                    color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', padding: '0.8rem 1.2rem',
                    background: 'white', borderRadius: '16px',
                    border: isOpen ? '2px solid #8B5CF6' : '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 4px rgba(139, 92, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {Icon && <Icon size={18} color="#8B5CF6" />}
                    <span style={{ fontWeight: '600', color: '#1F2937' }}>{value}</span>
                </div>
                <ChevronDown
                    size={20}
                    color="#94A3B8"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 8px)',
                            left: 0, right: 0, zIndex: 100,
                            background: 'white', borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                            border: '1px solid #E2E8F0', padding: '0.5rem',
                            maxHeight: '250px', overflowY: 'auto'
                        }}
                    >
                        {options.map((opt) => {
                            const optionValue = typeof opt === 'string' ? opt : (opt.label || opt.value);
                            const isSelected = value === optionValue;

                            return (
                                <button
                                    key={optionValue}
                                    onClick={() => {
                                        onChange(optionValue);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem',
                                        borderRadius: '10px', textAlign: 'left',
                                        background: isSelected ? '#F5F3FF' : 'transparent',
                                        color: isSelected ? '#8B5CF6' : '#475569',
                                        fontWeight: isSelected ? '700' : '500',
                                        cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '2px'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {optionValue}
                                    {isSelected && <Sparkles size={14} color="#8B5CF6" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
