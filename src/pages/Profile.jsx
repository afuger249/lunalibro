
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Mail, Save, Loader2, CheckCircle, Shield, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile({ ageLevel }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({
        full_name: '',
        email: ''
    });
    const [success, setSuccess] = useState(false);

    const isKid = ageLevel === 'kid';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }
            setUser(user);

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfile({
                full_name: profileData.full_name || '',
                email: user.email
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: profile.full_name })
                .eq('id', user.id);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Try again!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
                <Loader2 size={48} className="animate-spin" color="var(--color-primary)" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: isKid ? '#F0F9FF' : 'var(--color-bg-primary)',
            padding: '2rem 1rem max(2rem, env(safe-area-inset-bottom))'
        }}>
            <header style={{
                maxWidth: '600px',
                margin: '0 auto 2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                paddingTop: 'env(safe-area-inset-top)'
            }}>
                <button
                    onClick={() => navigate('/dashboard')}
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
                    {isKid ? 'Mi Perfil' : 'My Profile'}
                </h1>
            </header>

            <main style={{ maxWidth: '600px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card magic-paper"
                    style={{
                        padding: '2.5rem',
                        borderRadius: isKid ? '40px' : '24px',
                        border: isKid ? '3px solid #E2E8F0' : '1px solid var(--border-color)',
                        boxShadow: isKid ? '0 15px 30px rgba(0,0,0,0.03)' : 'var(--shadow-lg)'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '100px', height: '100px',
                            borderRadius: '35px',
                            background: isKid ? 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)' : 'var(--color-primary)',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem',
                            boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)',
                            fontSize: '3rem',
                            filter: 'drop-shadow(0 0 10px rgba(246, 198, 106, 0.4))'
                        }}>
                            {isKid ? '👤' : <User size={48} />}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text-primary)' }}>
                            {profile.full_name || (isKid ? 'Agente Misterioso' : 'Detective')}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                            {isKid ? 'Agente en activo' : 'Verified Learner'}
                        </p>
                    </div>

                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>
                                {isKid ? 'Mi Nombre' : 'Full Name'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    placeholder={isKid ? "Escribe tu nombre aquí..." : "Enter your name"}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        borderRadius: '20px',
                                        border: '2px solid #F1F5F9',
                                        background: '#F8FAFC',
                                        fontSize: '1.1rem',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={20} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        borderRadius: '20px',
                                        border: '2px solid #F1F5F9',
                                        background: '#F1F5F9',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: '#94A3B8',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    fontSize: '1.1rem',
                                    fontWeight: '900',
                                    borderRadius: '25px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    boxShadow: isKid ? '0 10px 20px rgba(14, 165, 233, 0.3)' : 'var(--shadow-lg)'
                                }}
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : success ? (
                                    <>
                                        <CheckCircle size={24} /> {isKid ? '¡GUARDADO!' : 'SAVED!'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={24} /> {isKid ? 'GUARDAR PERFIL' : 'SAVE PROFILE'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* KID BADGE SECTION */}
                {isKid && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: 'white',
                            borderRadius: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.02)',
                            border: '2px dashed #E2E8F0'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: '#FEF3C7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Shield color="#F59E0B" size={32} />
                        </div>
                        <div>
                            <h4 style={{ fontWeight: '900', color: '#B45309' }}>Privacidad Segura</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Tu nombre solo se usa aquí dentro de la aplicación.</p>
                        </div>
                    </motion.div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', opacity: 0.6 }}>
                    <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={14} /> {isKid ? 'Privacidad' : 'Privacy Policy'}
                    </button>
                    <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} /> {isKid ? 'Términos' : 'Terms of Service'}
                    </button>
                </div>
            </main>
        </div>
    );
}
