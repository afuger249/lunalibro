
import { Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import logoAsset from '../assets/lumilibro_logo.png';
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
                            .single();

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
        <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card magic-paper" style={{
                width: '100%',
                maxWidth: '440px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                borderRadius: '40px',
                padding: '3rem 2rem',
                border: '6px solid var(--color-bg-surface)',
                boxShadow: 'var(--shadow-xl)'
            }}>

                <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <img src={logoAsset} alt="LumiLibro Logo" style={{ width: '120px', height: '120px', marginBottom: '1rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }} />
                        <h1 className="serif" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em', margin: 0 }}>
                            LUMI<span style={{ color: 'var(--color-accent)' }}>LIBRO</span>
                        </h1>
                    </motion.div>
                </header>
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    {isForgotPassword ? 'Reset your password' : isLogin ? 'Welcome back! Ready to play?' : 'Start your adventure today!'}
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
                                        style={{ fontSize: 'xs', color: 'var(--color-accent)', textDecoration: 'underline' }}
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

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
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
                            style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', background: 'none', border: 'none', textDecoration: 'underline' }}
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
                        style={{ color: 'var(--color-accent)', background: 'none', padding: 0, textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
