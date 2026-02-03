
import { Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import logoAsset from '../assets/luna_and_friends_logo.png';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (resetError) throw resetError;
                setMessage('Check your email for the password reset link!');
            } else if (isLogin) {
                const { data, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (loginError) throw loginError;

                // Track login in profiles table
                if (data?.user) {
                    try {
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', data.user.id)
                            .maybeSingle();

                        if (!existingProfile) {
                            await supabase.from('profiles').insert({
                                id: data.user.id,
                                email: data.user.email,
                                last_login: new Date().toISOString(),
                                total_minutes: 0
                            });
                        } else {
                            await supabase.from('profiles').update({
                                last_login: new Date().toISOString()
                            }).eq('id', data.user.id);
                        }
                    } catch (err) {
                        console.warn('Silent failure tracking profile:', err);
                    }
                }

                navigate('/dashboard');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Check your email for the login link!');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F0FDFA' // Ocean reef background
        }}>
            <div className="card magic-paper" style={{
                width: '100%',
                maxWidth: '440px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                borderRadius: '48px',
                padding: '3rem 2rem',
                border: '3px solid #CCFBF1',
                backgroundColor: 'white',
                boxShadow: '0 20px 60px rgba(13, 148, 136, 0.15), 0 8px 16px rgba(0, 0, 0, 0.05)'
            }}>

                <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div style={{
                            width: '140px',
                            height: '140px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem',
                            position: 'relative'
                        }}>
                            {/* Glow effect behind logo */}
                            <div style={{
                                position: 'absolute',
                                width: '120%',
                                height: '120%',
                                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(244, 63, 94, 0.15) 70%)',
                                borderRadius: '50%',
                                filter: 'blur(15px)'
                            }} />
                            <img
                                src={logoAsset}
                                alt="Luna and Friends Logo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                                    position: 'relative'
                                }}
                            />
                        </div>
                        <h1 className="serif" style={{
                            fontSize: '2.5rem',
                            fontWeight: '900',
                            color: '#0D9488', // Teal
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            letterSpacing: '-0.02em',
                            margin: 0
                        }}>
                            Luna <span style={{ color: '#F97316' }}>& Friends</span>
                        </h1>
                    </motion.div>
                </header>
                <p style={{ textAlign: 'center', color: '#115E59', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    {isForgotPassword ? '🔑 Reset your password' : isLogin ? '🌊 Welcome back to the reef!' : '✨ Join the adventure!'}
                </p>


                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(244, 63, 94, 0.1)',
                            color: 'var(--color-danger)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            {error}
                        </div>
                    )}
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--color-success)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            {message}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {!isForgotPassword && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                    Password
                                </label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        style={{
                                            fontSize: '0.875rem',
                                            color: '#0D9488',
                                            textDecoration: 'underline',
                                            fontWeight: '700',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0.75rem 0.5rem',
                                            minHeight: '48px',
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        Forgot?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
                            backgroundColor: '#F97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            boxShadow: '0 6px 0 #C2410C, 0 10px 20px rgba(249, 115, 22, 0.2)',
                            transition: 'all 0.1s',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%'
                        }}
                        onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'translateY(6px)', e.currentTarget.style.boxShadow = 'none')}
                        onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = '0 6px 0 #C2410C, 0 10px 20px rgba(249, 115, 22, 0.2)')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = '0 6px 0 #C2410C, 0 10px 20px rgba(249, 115, 22, 0.2)')}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {isForgotPassword && (
                        <button
                            type="button"
                            onClick={() => setIsForgotPassword(false)}
                            style={{
                                textAlign: 'center',
                                fontSize: 'var(--font-size-sm)',
                                color: '#0D9488',
                                background: 'none',
                                border: 'none',
                                textDecoration: 'underline',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: '0.75rem 1rem',
                                minHeight: '48px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            Back to Login
                        </button>
                    )}
                </form>

                <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setIsForgotPassword(false);
                            setError(null);
                            setMessage(null);
                        }}
                        style={{
                            color: '#0D9488',
                            background: 'none',
                            padding: '0.75rem 1rem',
                            textDecoration: 'underline',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: 'none',
                            minHeight: '48px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
