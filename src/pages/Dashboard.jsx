
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Clock, TrendingUp, LogOut, Star, Trophy, Target, Gamepad2, Settings, X, Zap, Map as MapIcon, MessageCircle, ChevronRight, Loader, Baby, GraduationCap, Sparkles, Shield, User, BookOpen, Backpack, Sun, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSurpriseScenario } from '../lib/MysteryGenerator';
import { useMystery } from '../hooks/useMystery';

// Assets
import learnerAvatar from '../assets/avatars/learner.png';
import backpack3d from '../assets/backpack_3d.png';
import mysteryHq3d from '../assets/mystery_hq_3d.png';
import pixarMap from '../assets/pixar_map.png';
import LumiLogo from '../components/LumiLogo';

// Redesign Components
import SunMoonLayout from '../components/dashboard/SunMoonLayout';
import BottomDock from '../components/dashboard/BottomDock';
import DailyChest from '../components/dashboard/DailyChest';
import InteractiveScenery from '../components/dashboard/InteractiveScenery';
import LumiGuide from '../components/dashboard/LumiGuide';

export default function Dashboard({ ageLevel, setAgeLevel, spanishLevel, setSpanishLevel }) {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        todayMinutes: 0,
        totalMinutes: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false); // New Language Settings Modal
    const [showWelcome, setShowWelcome] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showBackpack, setShowBackpack] = useState(false);
    const [fullName, setFullName] = useState('');
    const { backpack, mysteryState, startMystery } = useMystery();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile and sessions
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, total_minutes')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setFullName(profileData.full_name || '');
            }

            const { data: allSessions } = await supabase
                .from('sessions')
                .select('messages, created_at, scenario_title')
                .eq('user_id', user.id);

            // Calculate stats and extract recent sessions
            let total = 0;
            let todayMin = 0;
            const uniqueDays = new Set();
            const today = new Date();
            const todayDateStr = today.toISOString().split('T')[0];
            today.setHours(0, 0, 0, 0);

            // Sort descending first
            const sortedSessions = (allSessions || []).sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            sortedSessions.forEach(session => {
                let duration = 2; // Default fallback

                // Extract duration from META tag
                const metaMsg = session.messages?.find(m => m.role === 'system' && m.content.startsWith('META:DURATION='));
                if (metaMsg) {
                    const parsed = parseInt(metaMsg.content.split('=')[1]);
                    if (!isNaN(parsed)) duration = parsed;
                }

                total += duration;

                // Check if it's today
                const sessionDate = new Date(session.created_at);
                const sessionDateStr = sessionDate.toLocaleDateString('en-CA');
                uniqueDays.add(sessionDateStr);

                if (sessionDate >= today) {
                    todayMin += duration;
                }
            });

            // --- STREAK CALCULATION ---
            let currentStreak = 0;
            const checkDate = new Date();

            // Check Today first
            const todayStr = checkDate.toLocaleDateString('en-CA');
            if (uniqueDays.has(todayStr)) {
                currentStreak = 1;
            }

            // Check backwards from yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            while (true) {
                const dateStr = checkDate.toLocaleDateString('en-CA');
                if (uniqueDays.has(dateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            setStats({
                totalMinutes: total,
                todayMinutes: todayMin,
                streak: currentStreak
            });

            // Set Recent (Top 3)
            setRecentSessions(sortedSessions.slice(0, 3));

            if (user?.email === 'afuger@gmail.com') {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgeLevel = () => {
        const newLevel = ageLevel === 'kid' ? 'adult' : 'kid';
        setAgeLevel(newLevel);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Chart Data Loading
    const fetchChartData = async () => {
        // Fetch last 30 days of sessions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: monthSessions } = await supabase
            .from('sessions')
            .select('messages, created_at')
            .eq('user_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        // Aggregate by day
        const dailyTotals = {};
        monthSessions?.forEach(s => {
            const day = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            let duration = 2; // Default fallback

            // Try parse meta
            const metaMsg = s.messages?.find(m => m.role === 'system' && m.content.startsWith('META:DURATION='));
            if (metaMsg) {
                const parsed = parseInt(metaMsg.content.split('=')[1]);
                if (!isNaN(parsed)) duration = parsed;
            }

            dailyTotals[day] = (dailyTotals[day] || 0) + duration;
        });

        const formatted = Object.keys(dailyTotals).map(day => ({
            name: day,
            minutes: dailyTotals[day]
        }));
        setChartData(formatted);
    };

    const handleOpenStats = () => {
        setShowStatsModal(true);
        fetchChartData();
    };



    const handleVisitTown = () => {
        // Just go to the map, don't auto-start chat
        navigate('/scenarios');
    };

    const handleAgency = () => {
        // If no active mystery, start one (dynamic)
        if (!mysteryState.isActive) {
            startMystery(true, spanishLevel);
        }
        // Navigate to the map/HQ (AdventureMap handles the UI)
        navigate('/scenarios');
    };

    const handleFreeTalk = () => {
        navigate('/chat');
    };

    if (loading) return null;

    // --- RENDER HELPERS ---
    const isKid = ageLevel === 'kid';

    return (
        <div className="container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Background Ambience */}
            {/* Sun-Drenched Ambience */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(254, 243, 199, 0.4) 0%, rgba(254, 243, 199, 0) 70%)', // Morning Sun Gold
                zIndex: -1,
                pointerEvents: 'none'
            }}></div>
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(224, 242, 254, 0.3) 0%, rgba(224, 242, 254, 0) 70%)', // Sky Blue Glow
                zIndex: -1,
                pointerEvents: 'none'
            }}></div>

            {/* HEADER */}
            {/* HEADER */}
            {!isKid && (
                <header style={{
                    paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
                    display: 'flex',
                    flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: window.innerWidth < 480 ? 'flex-start' : 'center',
                    marginBottom: '1.5rem',
                    gap: '1rem'
                }}>
                    {/* User Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '2px solid var(--border-color)',
                            padding: '2px',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <img src={learnerAvatar} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', filter: 'drop-shadow(0 0 10px rgba(246, 198, 106, 0.4))' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Welcome to</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--color-text-primary)' }}>The Lantern Room</div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Streak Badge -> Lantern Glow */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: isKid ? '#FFFAE8' : 'rgba(246, 198, 106, 0.2)', // Soft Gold
                            color: isKid ? '#D97706' : '#D69E2E',
                            padding: '0 16px',
                            height: '48px',
                            borderRadius: '24px',
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 10px rgba(246, 198, 106, 0.3)', // Glow effect
                            minWidth: '48px',
                            justifyContent: 'center',
                            border: '2px solid #FCD34D'
                        }}>
                            <Sparkles size={20} fill="#F59E0B" />
                            <span>{stats.streak}</span>
                        </div>

                        {/* Age Toggle */}
                        <button
                            onClick={toggleAgeLevel}
                            aria-label={isKid ? "Switch to Adult Mode" : "Switch to Kids Mode"}
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: isKid ? 'var(--color-accent)' : 'var(--color-primary)',
                                color: isKid ? '#1F2937' : 'white', // Dark grey for yellow bg, White for blue bg
                                border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isKid ? <Baby size={28} strokeWidth={2.5} /> : <GraduationCap size={28} strokeWidth={2.5} />}
                        </button>

                        {/* Menu Trigger */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                aria-label="Open Menu"
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'white', border: '1px solid var(--border-color)',
                                    color: 'var(--color-text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Settings size={28} />
                            </button>

                            {/* Dropdown */}
                            {showMenu && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                                    <div style={{
                                        position: 'absolute', top: '120%', right: 0, zIndex: 100,
                                        background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '160px'
                                    }}>
                                        {isAdmin && (
                                            <button onClick={() => navigate('/admin')} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontWeight: '500', cursor: 'pointer', borderRadius: '8px' }}>
                                                <Shield size={16} /> Admin
                                            </button>
                                        )}
                                        <button onClick={() => navigate('/profile')} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontWeight: '500', cursor: 'pointer', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                            <User size={16} /> Profile
                                        </button>
                                        <button onClick={() => { setShowSettingsModal(true); setShowMenu(false); }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontWeight: '500', cursor: 'pointer', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                            <Target size={16} /> Language Level
                                        </button>
                                        <button onClick={handleLogout} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontWeight: '500', color: '#EF4444', cursor: 'pointer', borderRadius: '8px' }}>
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                        <button onClick={() => navigate('/privacy')} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                            <Shield size={12} /> Privacy Policy
                                        </button>
                                        <button onClick={() => navigate('/terms')} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                            <FileText size={12} /> Terms of Service
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {/* MAIN CONTENT AREA */}
            {isKid ? (
                /* SUN & MOON DASHBOARD (Redesign) */
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    overflow: 'hidden',
                    background: '#87CEEB'
                }}>
                    {/* 1. Background */}
                    <InteractiveScenery />

                    {/* 2. Main Layout (Sun & Moon) */}
                    <SunMoonLayout
                        activeMission={mysteryState}
                        onSunClick={async () => {
                            // "Let's Go!" - Active Mode
                            // 1. If no mystery OR current one is solved, start a new one (dynamic)
                            let currentMystery = mysteryState;
                            if (!currentMystery.isActive || currentMystery.isSolved) {
                                currentMystery = await startMystery(true, spanishLevel);
                            }

                            // 2. Identify the current step info
                            const step = currentMystery.caseData.steps[currentMystery.currentStepIndex];

                            // 3. Navigate directly to Chat with scenario
                            navigate('/chat', {
                                state: {
                                    scenario: {
                                        isMystery: true,
                                        locationName: step.targetLocation,
                                        npc: step.npc,
                                        clue: step.clue,
                                        requiredKeyword: step.requiredKeyword,
                                        voice_id: step.voice_id || 'nova' // Use a default or dynamic voice
                                    }
                                }
                            });
                        }}
                        onMoonClick={() => navigate('/bookshelf')}
                    />

                    {/* 3. Hooks */}
                    {/* 3. Hooks */}
                    <LumiGuide />
                    {/* DailyChest moved to header */}


                    {/* 4. Navigation Dock */}
                    <BottomDock
                        onMapClick={() => navigate('/scenarios')}
                        onBackpackClick={() => navigate('/collection')}
                        onWordRushClick={() => navigate('/word-rush')}
                        backpackCount={backpack.length}
                    />

                    {/* 5. Parent/Settings Control (Top Right) */}
                    <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {/* Daily Chest (Scaled for Header) */}
                        <DailyChest style={{
                            position: 'relative',
                            bottom: 'auto',
                            left: 'auto',
                            margin: 0,
                            transform: 'scale(0.6)',
                            transformOrigin: 'center right'
                        }} />

                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'white', border: '2px solid rgba(255,255,255,0.5)',
                                color: '#64748B',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Settings size={24} />
                        </button>
                        {/* Kid Mode Dropdown */}
                        {showMenu && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, zIndex: 100,
                                    background: '#FFF7ED',
                                    border: '3px solid #FCD34D',
                                    borderRadius: '24px',
                                    boxShadow: '0 15px 50px rgba(74, 111, 165, 0.25)',
                                    padding: '1rem',
                                    minWidth: '220px',
                                    display: 'flex', flexDirection: 'column', gap: '0.8rem'
                                }}>
                                    <button onClick={() => { setShowSettingsModal(true); setShowMenu(false); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: 'white', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#4A6FA5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <Target size={22} color="#4A6FA5" /> Language Level
                                    </button>

                                    <button onClick={() => { navigate('/profile'); setShowMenu(false); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: 'white', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#4A6FA5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <User size={22} color="#4A6FA5" /> Profile
                                    </button>

                                    <button onClick={toggleAgeLevel} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: 'white', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#4A6FA5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <GraduationCap size={22} color="#4A6FA5" /> Switch to Adult
                                    </button>

                                    <div style={{ height: '2px', background: '#F1F5F9', margin: '0.2rem 0', opacity: 0.5 }} />

                                    <button onClick={() => { navigate('/privacy'); setShowMenu(false); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: 'white', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#4A6FA5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <Shield size={22} color="#4A6FA5" /> Privacy Policy
                                    </button>

                                    <button onClick={() => { navigate('/terms'); setShowMenu(false); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: 'white', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#4A6FA5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <FileText size={22} color="#4A6FA5" /> Terms of Service
                                    </button>

                                    {isAdmin && (
                                        <button onClick={() => { navigate('/admin'); setShowMenu(false); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: '#F0F9FF', textAlign: 'left', fontWeight: '800', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', color: '#0369A1', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <Zap size={22} color="#0369A1" /> Admin Panel
                                        </button>
                                    )}
                                    <div style={{ height: '2px', background: '#F1F5F9', margin: '0.2rem 0', opacity: 0.5 }} />
                                    <button onClick={handleLogout} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem', width: '100%', border: 'none', background: '#FEF2F2', textAlign: 'left', fontWeight: '800', color: '#EF4444', cursor: 'pointer', borderRadius: '16px', fontSize: '1rem', boxShadow: '0 2px 5px rgba(239, 68, 68, 0.1)' }}>
                                        <LogOut size={22} /> Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>



                </div>
            ) : (
                /* ADULT / STANDARD LAYOUT */
                <>
                    {/* HERO SECTION */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => navigate('/scenarios')}
                        className="card"
                        style={{
                            position: 'relative',
                            height: 'auto',
                            padding: '30px',
                            borderRadius: '32px',
                            marginBottom: '2rem',
                            background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', // Warm Golden Light
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 20px 40px rgba(245, 158, 11, 0.25)',
                            border: '4px solid white',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative background elements */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.2 }}>
                            <MapIcon size={300} style={{ position: 'absolute', top: -50, right: -50, transform: 'rotate(15deg)' }} />
                        </div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)',
                                padding: '0.25rem 0.75rem', borderRadius: '20px', marginBottom: '1rem',
                                fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em'
                            }}>
                                📍 IMMERSIVE LEARNING
                            </div>
                            <h2 style={{
                                fontSize: '2.25rem',
                                fontWeight: '900',
                                marginBottom: '0.5rem',
                                lineHeight: 1,
                                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                Start New Adventure
                            </h2>
                            <p style={{
                                opacity: 0.95,
                                marginBottom: '1.5rem',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                maxWidth: '85%'
                            }}>
                                Visit the Town Plaza and practice your speaking!
                            </p>

                            <button style={{
                                background: 'white',
                                color: 'var(--color-primary)',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '50px',
                                fontWeight: '800',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                alignSelf: 'flex-start',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                cursor: 'pointer'
                            }}>
                                <Play size={18} fill="currentColor" />
                                Start Now
                            </button>
                        </div>
                    </motion.div>

                    {/* QUICK ACTIONS GRID */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                        Quick Actions
                    </h3>

                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}
                    >
                        {/* This img tag is added based on the instruction, assuming it's meant to be a standalone avatar element within the layout */}
                        {/* The exact placement in the original code is ambiguous, so placing it here as a new element */}
                        {/* If this avatar is part of an existing component, its placement might need adjustment */}
                        {/* Stats Card */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 }
                            }}
                            onClick={handleOpenStats}
                            className="card"
                            style={{
                                padding: '1.25rem',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', gap: '1rem',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'transform 0.1s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: '#FFFAE8',
                                    color: '#D97706',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Sun size={24} fill="#F59E0B" />
                                </div>
                                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text-primary)' }}>
                                    {stats.todayMinutes}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Daily Light</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    {Math.round((stats.todayMinutes / 10) * 100)}% Brightness
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#FDE68A', borderRadius: '10px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min((stats.todayMinutes / 10) * 100, 100)}% `, height: '100%', background: '#F59E0B', borderRadius: '10px' }}></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* History/Quick Chat Card */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 }
                            }}
                            onClick={handleFreeTalk}
                            className="card"
                            style={{
                                padding: '1.25rem',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'var(--color-bg-surface)',
                                color: '#F43F5E',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>Free Talk</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500', lineHeight: 1.3, marginTop: '0.2rem' }}>
                                    Quick conversation practice
                                </div>
                            </div>
                            <div style={{ alignSelf: 'flex-end', marginTop: 'auto' }}>
                                <ChevronRight size={20} color="var(--color-text-secondary)" />
                            </div>
                        </motion.div>

                        {/* Storybook Card for Adults */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 }
                            }}
                            onClick={() => navigate('/bookshelf')}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                color: 'white',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)',
                                gridColumn: 'span 2'
                            }}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '15px' }}>
                                <BookOpen size={32} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Magic Bookshelf</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Read & Create custom AI stories.</p>
                            </div>
                            <ChevronRight size={24} style={{ marginLeft: 'auto' }} />
                        </motion.div>
                    </motion.div>

                    {/* RECENT ACTIVITY */}
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        border: '1px solid var(--border-color)',
                        opacity: 1 // Fixed opacity
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Clock size={16} className="text-secondary" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Recent History</span>
                        </div>

                        {recentSessions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {recentSessions.map((session, i) => {
                                    const date = new Date(session.created_at).toLocaleDateString();
                                    const title = session.scenario_title || 'Conversation';

                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i < recentSessions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{date}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)', background: '#F0F9FF', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                                                Completed
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                No recent sessions found. Start chatting!
                            </div>
                        )}
                    </div>
                </>
            )}


            {/* Stats Modal (Reused) */}
            <AnimatePresence>
                {showStatsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="card"
                            style={{ maxWidth: '600px', width: '100%', height: '400px', position: 'relative', display: 'flex', flexDirection: 'column' }}
                        >
                            <button onClick={() => setShowStatsModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
                            <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Your 30-Day Activity</h3>

                            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={Math.floor(chartData.length / 5)} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generating Overlay */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Loader size={60} />
                        </motion.div>
                        <h2 style={{ marginTop: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>Creating Your Adventure...</h2>
                        <p>One moment please</p>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Language Settings Modal */}
            {showSettingsModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card magic-paper" style={{ maxWidth: '400px', width: '100%', padding: '2rem', borderRadius: '40px', border: '5px solid #eee', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
                        <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none' }}><X size={20} /></button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Spanish Fluency</h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Select your current level to adjust the AI's difficulty.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {[
                                { lv: 'A0', label: 'Total Beginner', desc: 'Single words, emojis, bilingual help.' },
                                { lv: 'A1', label: 'Beginner', desc: 'Simple sentences. "I want water."' },
                                { lv: 'A2', label: 'Elementary', desc: 'Basic daily tasks. "Where is the library?"' },
                                { lv: 'B1', label: 'Intermediate', desc: 'Opinions, stories, past tense.' },
                                { lv: 'B2', label: 'Upper Intermediate', desc: 'Complex arguments and topics.' },
                                { lv: 'C1', label: 'Advanced', desc: 'Near-native fluency.' },
                            ].map((opt) => (
                                <button
                                    key={opt.lv}
                                    onClick={() => { setSpanishLevel(opt.lv); setShowSettingsModal(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: spanishLevel === opt.lv ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                        background: spanishLevel === opt.lv ? 'var(--color-bg-surface)' : 'white',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: spanishLevel === opt.lv ? 'var(--color-primary)' : '#eee',
                                        color: spanishLevel === opt.lv ? 'white' : '#666',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
                                    }}>
                                        {opt.lv}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Backpack Modal */}
            <AnimatePresence>
                {showBackpack && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBackpack(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                background: 'white',
                                width: '100%',
                                maxWidth: '500px',
                                borderRadius: '32px',
                                padding: '2rem',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                maxHeight: '80vh',
                                border: '4px solid #F97316'
                            }}
                        >
                            <button onClick={() => setShowBackpack(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: '#FFF7ED', color: '#F97316', marginBottom: '1rem'
                                }}>
                                    <Baby size={40} />
                                </div>
                                {/* Hidden to focus on core features */}
                                {/* 
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#B45309' }}>Mis Tesoros (My Treasures)</h2>
                                <p style={{ color: '#92400E' }}>You collected {backpack.length} items on your missions!</p>
                                */}
                            </div>

                            {/* Hidden to focus on core features */}
                            {/* 
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '1rem',
                                overflowY: 'auto',
                                paddingBottom: '1rem'
                            }}>
                                {backpack.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem 1rem', background: '#F9FAFB', borderRadius: '20px', border: '2px dashed #D1D5DB' }}>
                                        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Your backpack is empty.<br />Solve a mystery to find your first item!</p>
                                    </div>
                                )}
                                {backpack.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: '#FDF2F8',
                                            borderRadius: '24px',
                                            padding: '1rem',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                            textAlign: 'center',
                                            border: '2px solid #FBCFE8'
                                        }}
                                    >
                                        <div style={{ fontSize: '2.5rem' }}>{item.emoji}</div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#BE185D' }}>{item.name_spanish}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#DB2777' }}>{item.found_at ? new Date(item.found_at).toLocaleDateString() : 'Explored'}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {backpack.length > 0 && (
                                <button
                                    onClick={() => navigate('/scenarios')}
                                    style={{
                                        background: '#F97316', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '900', width: '100%', cursor: 'pointer', boxShadow: '0 4px 0 #92400E'
                                    }}
                                >
                                    FIND MORE TREASURES!
                                </button>
                            )}
                            */}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style>
                {`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes glow {
                    0% { filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.4)); }
                    50% { filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.8)); }
                    100% { filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.4)); }
                }
                .floating-magic {
                    animation: float 4s ease-in-out infinite;
                }
                .glowing-lantern {
                    animation: glow 3s ease-in-out infinite;
                }
                
                /* Responsive Overrides */
                @media (max-width: 600px) {
                    .kid-interactive-label {
                        transform: scale(0.7) !important;
                    }
                    .welcome-card {
                        top: 10% !important;
                        padding: 1rem !important;
                    }
                    .welcome-card h2 {
                        font-size: 1.1rem !important;
                    }
                    .welcome-card p {
                        font-size: 0.85rem !important;
                    }
                    
                    /* Specific Zone Tuning */
                    #zone-stories {
                        top: 55% !important;
                        right: 5% !important;
                    }
                    #zone-agency {
                        top: 72% !important;
                        left: 2% !important;
                    }
                    #zone-town {
                        bottom: 12% !important;
                        left: 45% !important;
                    }
                    #kid-toolkit {
                        transform: scale(0.8) !important;
                        top: calc(0.5rem + env(safe-area-inset-top)) !important;
                    }
                }
                `}
            </style>
        </div>
    );
}
