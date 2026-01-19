import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MessageCircle, Calendar } from 'lucide-react';

export default function History({ ageLevel }) {

    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Mock data for now if table doesn't exist
            // In real app:
            /*
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (data) setSessions(data);
            */

            // Check local storage for demo purposes if Supabase fails or is empty
            const localSessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
            setSessions(localSessions);

        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', minHeight: '100vh' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'var(--color-text-secondary)', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-serif" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>Conversation History</h1>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading history...</div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-secondary)' }}>
                    <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No conversations yet. Start a session to see it here!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {sessions.map((session, index) => (
                        <div key={session.id || index} className="card magic-paper" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 className="font-serif" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{session.scenario_title || 'Unknown Scenario'}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    <Calendar size={14} />
                                    {new Date(session.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {session.messages && session.messages
                                    .filter(m => m.role !== 'system') // Hide system prompts
                                    .map((msg, i) => (
                                        <div key={i} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                            color: msg.role === 'user' ? '#000' : 'var(--color-text-primary)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '1rem',
                                            maxWidth: '80%',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
