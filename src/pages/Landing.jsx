
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Shield, Users, ArrowRight, Star, GraduationCap, Zap } from 'lucide-react';
import LunaLogo from '../components/LunaLogo';
import lunaIllustration from '../assets/luna_and_friends_hero.png';
import { motion } from 'framer-motion';

export default function Landing({ session }) {
    const navigate = useNavigate();

    return (
        <div style={{
            backgroundColor: '#F0FDFA', // Light teal reef water
            color: '#134E4A',
            minHeight: '100vh',
            overflowX: 'hidden',
            fontFamily: 'Outfit, sans-serif'
        }}>
            {/* Navbar */}
            <nav style={{
                padding: 'calc(1.5rem + env(safe-area-inset-top)) 2rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1280px',
                margin: '0 auto',
                zIndex: 100,
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'max(0.4rem, 0.75vw)' }}>
                    <LunaLogo size={window.innerWidth < 768 ? 40 : 65} />
                    <span style={{
                        fontWeight: '900',
                        fontSize: 'clamp(1.3rem, 5vw, 2.2rem)',
                        letterSpacing: '-0.02em',
                        color: '#0D9488',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
                        whiteSpace: 'nowrap'
                    }}>
                        Luna <span style={{ color: '#F97316' }}>& Friends</span>
                    </span>
                </div>
                <button
                    onClick={() => navigate(session ? '/dashboard' : '/auth')}
                    style={{
                        padding: '0.75rem 1.6rem',
                        borderRadius: '50px',
                        fontWeight: '900',
                        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                        backgroundColor: 'white',
                        color: '#0D9488',
                        border: '3px solid #0D9488',
                        cursor: 'pointer',
                        boxShadow: '0 4px 0 #0D9488',
                        transition: 'all 0.1s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseDown={(e) => { e.target.style.transform = 'translateY(4px)'; e.target.style.boxShadow = 'none'; }}
                    onMouseUp={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 0 #0D9488'; }}
                >
                    {session ? 'Your Reef' : 'Join the Fun'}
                </button>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: 'min(3rem, 8vh) 1.5rem 6rem 1.5rem',
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                alignItems: 'center',
                position: 'relative'
            }}>
                {/* Background Coral Elements */}
                <div style={{ position: 'absolute', top: '-10%', right: '5%', opacity: 0.1, zIndex: 0 }}>
                    <Sparkles size={400} color="#F43F5E" />
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ position: 'relative', zIndex: 10 }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        padding: '0.6rem 1.5rem',
                        borderRadius: '30px',
                        marginBottom: '2rem',
                        fontWeight: '900',
                        color: '#F97316',
                        border: '2px solid rgba(249, 115, 22, 0.2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <Star size={20} fill="#F97316" />
                        Vibrant Spanish Learning
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 9vw, 5rem)',
                        fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.03em',
                        color: '#134E4A'
                    }}>
                        Speak. Play. <br />
                        <span style={{ color: '#06B6D4' }}>Grow with Luna!</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                        color: '#115E59',
                        marginBottom: '3rem',
                        lineHeight: '1.5',
                        maxWidth: '560px',
                        fontWeight: '600'
                    }}>
                        Jump into a colorful ocean adventure where your child masters Spanish through stories, speaking, and fun-loving friends.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <button
                            onClick={() => navigate(session ? '/dashboard' : '/auth')}
                            style={{
                                padding: 'clamp(1rem, 3vw, 1.25rem) clamp(2rem, 6vw, 3.5rem)',
                                fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
                                borderRadius: '60px',
                                fontWeight: '900',
                                backgroundColor: '#F97316',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 8px 0 #C2410C, 0 15px 30px rgba(249, 115, 22, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.1s'
                            }}
                            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(8px)'; e.currentTarget.style.boxShadow = 'none'; }}
                            onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 0 #C2410C, 0 15px 30px rgba(249, 115, 22, 0.3)'; }}
                        >
                            Start Adventure
                            <ArrowRight size={28} strokeWidth={3} />
                        </button>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0D9488', fontWeight: '800' }}>
                            <Shield size={22} />
                            6-9 Year Olds
                        </div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0D9488', fontWeight: '800' }}>
                            <GraduationCap size={22} />
                            Native Fluency
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, type: "spring" }}
                    style={{ position: 'relative' }}
                >
                    <div style={{
                        position: 'absolute',
                        inset: '-15%',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 0,
                        borderRadius: '50%'
                    }} />
                    <img
                        src={lunaIllustration}
                        alt="Luna the loggerhead turtle"
                        style={{
                            width: '100%',
                            filter: 'drop-shadow(0 30px 60px rgba(13, 148, 136, 0.25))',
                            position: 'relative',
                            zIndex: 1,
                            transform: 'translateY(0)',
                        }}
                    />
                    {/* Floating Ocean Elements */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: 'absolute', top: '10%', right: '-10%', zIndex: 2 }}
                    >
                        <Star size={48} fill="#FBBF24" color="#FBBF24" />
                    </motion.div>
                </motion.div>
            </section>

            {/* Values Section */}
            <section style={{ backgroundColor: 'white', padding: '6rem 1.5rem', borderRadius: '60px 60px 0 0', boxShadow: '0 -20px 40px rgba(0,0,0,0.03)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '900', color: '#134E4A', letterSpacing: '-0.02em' }}>
                            Dive Into Deep Learning
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#0D9488', fontWeight: '600', marginTop: '1rem' }}>Learning a language is an adventure, not a test.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
                        {/* Card 1 */}
                        <motion.div whileHover={{ y: -10 }} style={{ padding: '3rem', borderRadius: '48px', background: '#F0FDFA', border: '2px solid #CCFBF1', textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', margin: '0 auto 2rem auto',
                                background: 'white', borderRadius: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 15px 30px rgba(13, 148, 136, 0.1)',
                                transform: 'rotate(-5deg)'
                            }}>
                                <Heart size={44} color="#F43F5E" fill="#F43F5E" />
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#134E4A', marginBottom: '1.5rem' }}>Full Immersion</h3>
                            <p style={{ color: '#0D9488', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}>
                                Luna speaks with you! Interactive conversations build real-world speaking skills from day one.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div whileHover={{ y: -10 }} style={{ padding: '3rem', borderRadius: '48px', background: '#FFF7ED', border: '2px solid #FFEDD5', textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', margin: '0 auto 2rem auto',
                                background: 'white', borderRadius: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 15px 30px rgba(246, 198, 106, 0.2)',
                                transform: 'rotate(5deg)'
                            }}>
                                <Users size={44} color="#F59E0B" fill="#F59E0B" />
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#134E4A', marginBottom: '1.5rem' }}>Luna's Friends</h3>
                            <p style={{ color: '#0D9488', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}>
                                Meet a cast of magical sea creatures. Every character has a story and a unique voice to learn from.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div whileHover={{ y: -10 }} style={{ padding: '3rem', borderRadius: '48px', background: '#F0F9FF', border: '2px solid #E0F2FE', textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', margin: '0 auto 2rem auto',
                                background: 'white', borderRadius: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 15px 30px rgba(6, 182, 212, 0.15)',
                                transform: 'rotate(-3deg)'
                            }}>
                                <Zap size={44} color="#06B6D4" fill="#06B6D4" />
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#134E4A', marginBottom: '1.5rem' }}>Word Rush!</h3>
                            <p style={{ color: '#0D9488', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}>
                                Fast-paced games and flashcards that feel like play. Build a massive vocabulary without the stress.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer style={{
                background: '#F8FAFC',
                padding: '6rem 2rem calc(4rem + env(safe-area-inset-bottom))',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '1rem',
                fontWeight: '600'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0D9488' }}>
                        <LunaLogo size={30} />
                        <span>Luna & Friends</span>
                    </div>
                    <span>•</span>
                    <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
                    <span>•</span>
                    <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
                </div>
                <p>&copy; {new Date().getFullYear()} Luna and Friends. Made with magic for the next generation.</p>
            </footer>
        </div>
    );
}
