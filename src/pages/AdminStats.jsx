
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Coffee, ArrowLeft, ShieldAlert, TrendingUp, Settings, Activity, Zap, Cpu, Database, Cloud, Sparkles, Volume2, Image, DollarSign } from 'lucide-react';



export default function AdminStats() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [stories, setStories] = useState([]); // New state for stories
    const [users, setUsers] = useState([]);
    const [feedback, setFeedback] = useState([]); // New state for feedback
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [usageData, setUsageData] = useState({
        elevenlabs: null,
        openai: { used: 0, limit: 10 } // Placeholder for OpenAI
    });


    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }
            if (user?.email !== 'afuger@gmail.com') {
                navigate('/dashboard');
                return;
            }
            setIsAdmin(true);
            fetchStats();

        } catch (error) {
            console.error('Error checking user:', error);
            navigate('/dashboard');
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Fetch Sessions
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (sessionError) {
                console.warn('Could not fetch sessions from DB, falling back to local storage', sessionError);
                const localSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
                setSessions(localSessions);
            } else {
                setSessions(sessionData || []);
            }

            // 1.5 Fetch Story Logs
            const { data: storyData, error: storyError } = await supabase
                .from('story_generations')
                .select('*')
                .order('created_at', { ascending: false });

            if (!storyError) {
                setStories(storyData || []);
            }

            // 2. Fetch User Profiles / Logins
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .order('last_login', { ascending: false });

            if (userError) {
                console.warn('Could not fetch profiles from DB:', userError.message);
                // Fallback: If DB fails, at least show the current user session info
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUsers([{
                        id: user.id,
                        email: user.email,
                        last_login: new Date().toISOString(),
                        total_minutes: '?'
                    }]);
                }
            } else {
                setUsers(userData || []);
            }

            // 2.5 Fetch Story Feedback
            const { data: feedbackData, error: feedbackError } = await supabase
                .from('story_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (!feedbackError) {
                setFeedback(feedbackData || []);
            }


        } catch (error) {
            console.error('Critical error in fetchStats:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (used, limit) => {
        if (!limit) return 0;
        return Math.min(Math.round((used / limit) * 100), 100);
    };


    if (loading) {
        return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Loading Admin Dashboard...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'var(--color-text-secondary)', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>Admin Dashboard</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Platform Usage & Session Logs</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={() => navigate('/admin/scenarios')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Settings size={18} /> Manage Scenarios
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card">
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sessions</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{sessions.length}</div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unique Users</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        {new Set(sessions.map(s => s.user_id)).size}
                    </div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stories Created</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        {stories.length}
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Satisfaction Rate</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#10b981' }}>
                        {feedback.length > 0
                            ? Math.round((feedback.filter(f => f.rating === 'good').length / feedback.length) * 100)
                            : 0}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        From {feedback.length} ratings
                    </div>
                </div>
            </div>

            {/* API Costs & Usage Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={24} style={{ color: 'var(--color-accent)' }} />
                    API Costs & Usage
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
                    Monthly cost breakdown and usage metrics for all third-party services
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {/* Supabase */}
                <div className="card" style={{ borderLeft: '4px solid #3ECF8E', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supabase</div>
                        <Database size={18} color="#3ECF8E" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3ECF8E', marginBottom: '0.5rem' }}>
                        $0–25/mo
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Database, Auth, Edge Functions
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: '15%', height: '100%', backgroundColor: '#3ECF8E', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        Free tier: 500MB DB, 2GB bandwidth<br />
                        Threshold: $25/mo (Pro tier)
                    </div>
                </div>

                {/* OpenAI GPT-4o */}
                <div className="card" style={{ borderLeft: '4px solid #10A37F', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OpenAI GPT-4o</div>
                        <Cpu size={18} color="#10A37F" />
                    </div>
                    {(() => {
                        const totalPromptTokens = stories.reduce((sum, s) => sum + (s.details?.tokens?.prompt_tokens || 0), 0);
                        const totalCompletionTokens = stories.reduce((sum, s) => sum + (s.details?.tokens?.completion_tokens || 0), 0);
                        const totalTokens = totalPromptTokens + totalCompletionTokens;
                        const estimatedCost = (totalPromptTokens * 0.0000025) + (totalCompletionTokens * 0.00001);
                        const monthlyThreshold = 50;
                        const percentage = Math.min((estimatedCost / monthlyThreshold) * 100, 100);

                        return (
                            <>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10A37F', marginBottom: '0.5rem' }}>
                                    ${estimatedCost.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {totalTokens.toLocaleString()} tokens used
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10A37F', transition: 'width 0.5s ease-out' }}></div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                    $2.50/1M input, $10/1M output<br />
                                    Threshold: ${monthlyThreshold}/mo
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Azure TTS */}
                <div className="card" style={{ borderLeft: '4px solid #0078D4', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Azure TTS</div>
                        <Volume2 size={18} color="#0078D4" />
                    </div>
                    {(() => {
                        // Estimate character count from stories (assuming avg 150 chars per page)
                        const totalChars = stories.reduce((sum, s) => sum + ((s.page_count || 0) * 150), 0);
                        const freeLimit = 500000; // 500K chars free
                        const paidChars = Math.max(0, totalChars - freeLimit);
                        const estimatedCost = (paidChars / 1000000) * 16;
                        const monthlyThreshold = 20;
                        const percentage = Math.min((estimatedCost / monthlyThreshold) * 100, 100);

                        return (
                            <>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0078D4', marginBottom: '0.5rem' }}>
                                    ${estimatedCost.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {totalChars.toLocaleString()} characters
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#0078D4', transition: 'width 0.5s ease-out' }}></div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                    Free: 500K chars/mo, then $16/1M<br />
                                    Threshold: ${monthlyThreshold}/mo
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Google Imagen */}
                <div className="card" style={{ borderLeft: '4px solid #4285F4', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google Imagen</div>
                        <Sparkles size={18} color="#4285F4" />
                    </div>
                    {(() => {
                        const totalImages = stories.reduce((sum, s) => sum + (s.page_count || 0), 0);
                        const costPerImage = 0.03;
                        const estimatedCost = totalImages * costPerImage;
                        const monthlyThreshold = 15;
                        const percentage = Math.min((estimatedCost / monthlyThreshold) * 100, 100);

                        return (
                            <>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#4285F4', marginBottom: '0.5rem' }}>
                                    ${estimatedCost.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {totalImages} images generated
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#4285F4', transition: 'width 0.5s ease-out' }}></div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                    ~$0.02–0.04 per image<br />
                                    Threshold: ${monthlyThreshold}/mo
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Leonardo.ai */}
                <div className="card" style={{ borderLeft: '4px solid #8B5CF6', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leonardo.ai</div>
                        <Image size={18} color="#8B5CF6" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '0.5rem' }}>
                        $0–30/mo
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Character portraits & illustrations
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: '20%', height: '100%', backgroundColor: '#8B5CF6', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        Free: 150 credits/day<br />
                        Artisan: $30/mo (25K credits)
                    </div>
                </div>

                {/* OpenAI DALL-E 3 */}
                <div className="card" style={{ borderLeft: '4px solid #FF6B6B', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DALL-E 3 (Fallback)</div>
                        <Image size={18} color="#FF6B6B" />
                    </div>
                    {(() => {
                        // Estimate DALL-E usage (fallback when Imagen fails)
                        const dalleImages = Math.floor(stories.length * 0.1); // Assume 10% fallback rate
                        const estimatedCost = dalleImages * 0.04;
                        const monthlyThreshold = 10;
                        const percentage = Math.min((estimatedCost / monthlyThreshold) * 100, 100);

                        return (
                            <>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FF6B6B', marginBottom: '0.5rem' }}>
                                    ${estimatedCost.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    ~{dalleImages} images (estimated)
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#FF6B6B', transition: 'width 0.5s ease-out' }}></div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                    $0.04 per 1024×1024 image<br />
                                    Threshold: ${monthlyThreshold}/mo
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* ElevenLabs (if active) */}
                <div className="card" style={{ borderLeft: '4px solid #A855F7', display: 'flex', flexDirection: 'column', opacity: 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ElevenLabs (Inactive)</div>
                        <Volume2 size={18} color="#A855F7" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#A855F7', marginBottom: '0.5rem' }}>
                        $0/mo
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Premium voice synthesis
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#A855F7', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        Free: 10K chars/mo<br />
                        Creator: $22/mo (100K chars)
                    </div>
                </div>

                {/* Total Monthly Estimate */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Total Monthly Cost</div>
                        <TrendingUp size={18} color="var(--color-accent)" />
                    </div>
                    {(() => {
                        const openaiCost = stories.reduce((sum, s) => {
                            const promptTokens = s.details?.tokens?.prompt_tokens || 0;
                            const completionTokens = s.details?.tokens?.completion_tokens || 0;
                            return sum + (promptTokens * 0.0000025) + (completionTokens * 0.00001);
                        }, 0);
                        const azureCost = Math.max(0, (stories.reduce((sum, s) => sum + ((s.page_count || 0) * 150), 0) - 500000) / 1000000) * 16;
                        const imagenCost = stories.reduce((sum, s) => sum + (s.page_count || 0), 0) * 0.03;
                        const dalleCost = Math.floor(stories.length * 0.1) * 0.04;
                        const supabaseCost = 0; // Free tier for now
                        const totalCost = openaiCost + azureCost + imagenCost + dalleCost + supabaseCost;
                        const projectedCost = totalCost; // Could multiply by days remaining in month for projection

                        return (
                            <>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                                    ${totalCost.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    Current billing cycle
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                    Budget: $75–150/mo<br />
                                    Status: <span style={{ color: totalCost < 75 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                        {totalCost < 75 ? '✓ On Track' : '⚠ Monitor'}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>


            {/* Session Logs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-bg-surface)' }}>
                    <h3 style={{ fontWeight: 'bold' }}>Recent Session Activity</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>User ID</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Scenario</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Timestamp</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Messages</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length > 0 ? sessions.map((session, idx) => (
                                <tr key={session.id || idx} style={{ borderBottom: '1px solid var(--color-bg-surface)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--font-size-sm)' }}>
                                        <div style={{ fontFamily: 'monospace' }}>{session.user_id?.substring(0, 8) || 'Anonymous'}...</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                            {users.find(u => u.id === session.user_id)?.email || 'Unknown User'}
                                        </div>
                                    </td>

                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Coffee size={14} style={{ color: 'var(--color-accent)' }} />
                                            <span style={{ fontWeight: '500' }}>{session.scenario_title}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {new Date(session.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            backgroundColor: '#CCFBF1', // Teal 100
                                            color: '#0F766E', // Teal 700
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: 'bold'
                                        }}>
                                            {session.messages?.length || 0} msgs
                                        </span>

                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        No session logs found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Story Logs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-bg-surface)' }}>
                    <h3 style={{ fontWeight: 'bold' }}>Storybook Creations</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Title</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Pages</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Core Details</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stories.length > 0 ? stories.map((story, idx) => (
                                <tr key={story.id || idx} style={{ borderBottom: '1px solid var(--color-bg-surface)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--font-size-sm)' }}>
                                        <div style={{ color: 'var(--color-text-secondary)' }}>
                                            {users.find(u => u.id === story.user_id)?.email || story.user_id?.substring(0, 8) + '...'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                        {story.title}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {story.page_count} pgs
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                                        <div>{story.language || 'Spanish'}</div>
                                        <div style={{ color: 'var(--color-text-secondary)' }}>
                                            {story.details?.reading_time} min • {story.details?.character_count} chars
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {new Date(story.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        No stories generated yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User History */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-bg-surface)' }}>
                    <h3 style={{ fontWeight: 'bold' }}>User Login History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>User Email</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Last Login</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Total Practice</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map((u, idx) => (
                                <tr key={u.id || idx} style={{ borderBottom: '1px solid var(--color-bg-surface)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--font-size-sm)' }}>
                                        {u.email || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {u.total_minutes || 0}m
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        No user profiles found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Story Feedback */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-bg-surface)' }}>
                    <h3 style={{ fontWeight: 'bold' }}>Story Feedback</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Story Title</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Rating</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedback.length > 0 ? feedback.map((f, idx) => (
                                <tr key={f.id || idx} style={{ borderBottom: '1px solid var(--color-bg-surface)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--font-size-sm)' }}>
                                        {users.find(u => u.id === f.user_id)?.email || 'Anonymous'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>
                                        {f.title || 'Untitled'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '50px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            backgroundColor: f.rating === 'good' ? '#d1fae5' : '#fee2e2',
                                            color: f.rating === 'good' ? '#065f46' : '#991b1b'
                                        }}>
                                            {f.rating === 'good' ? '👍 Good' : '👎 Bad'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {new Date(f.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        No feedback received yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
