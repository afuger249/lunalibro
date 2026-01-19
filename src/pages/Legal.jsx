
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Legal({ type, ageLevel }) {
    const navigate = useNavigate();
    const isKid = ageLevel === 'kid';

    const content = type === 'privacy' ? {
        title: isKid ? 'Privacidad' : 'Privacy Policy',
        icon: <Shield size={32} />,
        sections: [
            {
                h: 'Information We Collect',
                p: 'We collect account info (email, name) and usage data to improve your experience.'
            },
            {
                h: "Children's Privacy",
                p: 'LumiLibro is designed for children. We do not sell data and audio is processed securely.'
            },
            {
                h: 'How We Use Info',
                p: 'To provide and personalize the application and its learning features.'
            }
        ]
    } : {
        title: isKid ? 'Términos' : 'Terms of Service',
        icon: <FileText size={32} />,
        sections: [
            {
                h: 'Acceptance of Terms',
                p: 'By using LumiLibro, you agree to these terms.'
            },
            {
                h: 'User Conduct',
                p: 'Users must use the app for learning and not for any harmful activities.'
            },
            {
                h: 'Intellectual Property',
                p: 'All content in LumiLibro is owned by us or our licensors.'
            }
        ]
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: isKid ? '#F0F9FF' : 'var(--color-bg-primary)',
            padding: '2rem 1rem max(2rem, env(safe-area-inset-bottom))'
        }}>
            <header style={{
                maxWidth: '800px',
                margin: '0 auto 2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                paddingTop: 'env(safe-area-inset-top)'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'white',
                        border: 'none',
                        width: '50px',
                        height: '50px',
                        borderRadius: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                        color: 'var(--color-text-secondary)'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-serif" style={{ fontSize: isKid ? '2rem' : '1.75rem', fontWeight: '900', color: 'var(--color-primary)' }}>
                    {content.title}
                </h1>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card magic-paper"
                    style={{
                        padding: '2.5rem',
                        borderRadius: isKid ? '40px' : '24px',
                        border: isKid ? '3px solid #E2E8F0' : '1px solid var(--border-color)',
                        boxShadow: isKid ? '0 15px 30px rgba(0,0,0,0.03)' : 'var(--shadow-lg)',
                        background: 'white'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: 'var(--color-primary)' }}>
                        {content.icon}
                        <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{content.title}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {content.sections.map((s, i) => (
                            <div key={i}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>{s.h}</h2>
                                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '1.05rem' }}>{s.p}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '20px', fontSize: '0.9rem', color: '#64748B', textAlign: 'center' }}>
                        For the full legal document, please visit our website or contact support.
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
