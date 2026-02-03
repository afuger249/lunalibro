import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
    title,
    subtitle,
    showBack = true,
    backRoute = '/dashboard',
    actions,
    className = ''
}) {
    const navigate = useNavigate();

    return (
        <header
            className={`page-header ${className}`}
            style={{
                paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                width: '100%',
                position: 'relative'
            }}
        >
            {showBack && (
                <button
                    onClick={() => navigate(backRoute)}
                    className="page-header-back"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '3px solid var(--border-color)',
                        borderRadius: '20px',
                        color: 'var(--color-primary)',
                        padding: '0.8rem',
                        boxShadow: '0 4px 0 var(--border-color)',
                        cursor: 'pointer',
                        minWidth: '48px',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} strokeWidth={3} />
                </button>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{
                    fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                    fontWeight: '900',
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.02em',
                    display: 'block',
                    lineHeight: 1.1,
                    margin: 0
                }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        fontWeight: 'bold',
                        marginTop: '0.2rem',
                        margin: 0
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="page-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    {actions}
                </div>
            )}
        </header>
    );
}
