
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Shield, Users, ArrowRight } from 'lucide-react';
import LumiLogo from '../components/LumiLogo';
import lumilibroSplash from '../assets/lumilibro_splash.png';

export default function Landing({ session }) {
    const navigate = useNavigate();

    return (
        <div style={{ backgroundColor: 'var(--lumi-cream)', color: 'var(--lumi-text)', minHeight: '100vh', overflow: 'hidden', fontFamily: 'var(--font-family-body)' }}>
            {/* Navbar */}
            <nav style={{
                padding: 'calc(1.5rem + env(safe-area-inset-top)) 2rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1280px',
                margin: '0 auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'max(0.4rem, 0.75vw)' }}>
                    <LumiLogo size={window.innerWidth < 768 ? 40 : 55} />
                    <span style={{ fontWeight: '900', fontSize: 'min(1.8rem, 6vw)', letterSpacing: '-0.02em', color: 'var(--lumi-blue)', fontFamily: 'var(--font-family-serif)' }}>
                        Lumi<span style={{ color: 'var(--lumi-gold)' }}>Libro</span>
                    </span>
                </div>
                <button
                    onClick={() => navigate(session ? '/dashboard' : '/auth')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '30px',
                        fontWeight: '800',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        color: 'var(--lumi-blue)',
                        border: '2px solid rgba(74, 111, 165, 0.1)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 0 rgba(74, 111, 165, 0.1)',
                        transition: 'transform 0.2s'
                    }}
                >
                    {session ? 'Your Library' : 'Sign In'}
                </button>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: 'min(4rem, 10vh) 1.5rem 6rem 1.5rem',
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2.5rem',
                alignItems: 'center',
                position: 'relative'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        backgroundColor: 'var(--lumi-lavender)',
                        background: 'rgba(184, 167, 214, 0.2)',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '25px',
                        marginBottom: '2rem',
                        fontWeight: '800',
                        color: '#6B46C1',
                        border: '1px solid rgba(184, 167, 214, 0.4)'
                    }}>
                        <Sparkles size={20} fill="#B8A7D6" />
                        A magical new way to learn
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.2rem, 8vw, 4.5rem)',
                        fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.03em',
                        color: 'var(--lumi-blue)',
                        fontFamily: 'var(--font-family-serif)'
                    }}>
                        Stories that glow. <br />
                        <span style={{ color: 'var(--lumi-gold)' }}>Language that grows.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                        color: 'var(--lumi-text)',
                        marginBottom: '2.5rem',
                        lineHeight: '1.6',
                        maxWidth: '540px',
                        fontWeight: '500'
                    }}>
                        LumiLibro turns language learning into a shared family adventure. No quizzes, just connection.
                    </p>

                    <button
                        onClick={() => navigate(session ? '/dashboard' : '/auth')}
                        style={{
                            padding: '1.25rem 3rem',
                            fontSize: '1.25rem',
                            borderRadius: '50px',
                            fontWeight: '900',
                            backgroundColor: 'var(--lumi-gold)',
                            color: '#744210', // Darker gold/brown for contrast
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 15px rgba(246, 198, 106, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {session ? 'Enter the Library' : 'Start Your Story'}
                        <ArrowRight size={24} strokeWidth={3} />
                    </button>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--lumi-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={16} /> Safe, ad-free space for kids 6-9
                    </p>
                </div>

                <div style={{ position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        inset: '-10%',
                        background: 'radial-gradient(circle, rgba(246, 198, 106, 0.2) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 0,
                        borderRadius: '50%'
                    }} />
                    {/* Placeholder for the new image - User needs to ensure file exists or I will copy it next */}
                    <img
                        src="/lumilibro_splash.png"
                        alt="Cozy magical library illustration"
                        style={{
                            width: '100%',
                            borderRadius: '40px',
                            boxShadow: '0 30px 60px -15px rgba(74, 111, 165, 0.25)',
                            position: 'relative',
                            zIndex: 1,
                            border: '8px solid white',
                            transform: 'rotate(2deg)'
                        }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://PLACEHOLDER_IF_MISSING'; // Fallback logic if needed, but we'll try to ensure it exists
                            e.target.style.background = '#E2E8F0';
                        }}
                    />
                </div>
            </section>

            {/* Values Section */}
            <section style={{ backgroundColor: 'white', padding: '5rem 1.25rem 6rem 1.25rem', borderRadius: '40px 40px 0 0', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: '900', marginBottom: '1rem', color: 'var(--lumi-blue)', letterSpacing: '-0.02em', fontFamily: 'var(--font-family-serif)' }}>
                            Why families love the Great Library
                        </h2>
                        <p style={{ fontSize: '1rem', color: 'var(--lumi-text-light)' }}>Designed for peace of mind and pure imagination.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        {/* Card 1 */}
                        <div style={{ padding: '2.5rem', borderRadius: '40px', background: 'var(--lumi-cream)', textAlign: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px', margin: '0 auto 1.5rem auto',
                                background: 'white', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                            }}>
                                <Heart size={36} color="#F687B3" fill="#F687B3" />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lumi-blue)', marginBottom: '1rem' }}>Connection, not Correction</h3>
                            <p style={{ color: 'var(--lumi-text)', lineHeight: '1.6' }}>
                                We celebrate every attempt. Lumi gently guides conversations so kids build confidence, not fear of mistakes.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div style={{ padding: '2.5rem', borderRadius: '40px', background: '#EBF8FF', textAlign: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px', margin: '0 auto 1.5rem auto',
                                background: 'white', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                            }}>
                                <Users size={36} color="var(--lumi-blue)" fill="var(--lumi-blue)" />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lumi-blue)', marginBottom: '1rem' }}>A Friend, Not a Bot</h3>
                            <p style={{ color: 'var(--lumi-text)', lineHeight: '1.6' }}>
                                Lumi isn't a teacher or a robot. Lumi is a story guide who lights the path for your child.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div style={{ padding: '2.5rem', borderRadius: '40px', background: '#FAF5FF', textAlign: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px', margin: '0 auto 1.5rem auto',
                                background: 'white', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                            }}>
                                <Shield size={36} color="#B8A7D6" fill="#B8A7D6" />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lumi-blue)', marginBottom: '1rem' }}>Safe & Calm</h3>
                            <p style={{ color: 'var(--lumi-text)', lineHeight: '1.6' }}>
                                No ads, no loud noises, no addictive loops. Just a calm, safe digital space that feels like a warm hug.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer style={{
                background: 'white',
                padding: '4rem 2rem calc(4rem + env(safe-area-inset-bottom))',
                textAlign: 'center',
                color: 'var(--lumi-text-light)',
                fontSize: '0.9rem',
                fontWeight: '600',
                borderTop: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                    <Sparkles size={16} color="var(--lumi-gold)" />
                    <span>Made with magic for families everywhere</span>
                    <Sparkles size={16} color="var(--lumi-gold)" />
                </div>
                &copy; {new Date().getFullYear()} LumiLibro.
            </footer>
        </div>
    );
}
