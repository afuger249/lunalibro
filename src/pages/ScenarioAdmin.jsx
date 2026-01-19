
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    ArrowLeft,
    Check,
    AlertCircle,
    Coffee,
    Users,
    MapPin,
    Home,
    Briefcase,
    CloudRain,
    Smile,
    Palmtree,
    Gift,
    Thermometer,
    Volume2,
    Sparkles,
    Loader,
    Sun,
    Moon,
    Utensils,
    Backpack,
    Phone,
    Pizza,
    Bus,
    Hotel,
    Stethoscope,
    Book,
    ShieldAlert,
    ShoppingCart,
    Shirt,
    Droplet,
    Package,
    IceCream
} from 'lucide-react';

import { generateOpenAISpeech } from '../lib/openai_tts';
import { generateStoryImage } from '../lib/imagen';

// Avatar Assets
import learnerAvatar from '../assets/avatars/learner.png';
import baristaAvatar from '../assets/avatars/barista.png';
import abuelaAvatar from '../assets/avatars/abuela.png';
import tioAvatar from '../assets/avatars/tio.png';
import papiAvatar from '../assets/avatars/papi.png';
import mariAvatar from '../assets/avatars/mari.png';
import siblingAvatar from '../assets/avatars/sibling.png';
import mamiAvatar from '../assets/avatars/mami.png';
import tiaAvatar from '../assets/avatars/tia.png';
import juanAvatar from '../assets/avatars/juan.png';
import localAvatar from '../assets/avatars/local.png';
import icecreamAvatar from '../assets/avatars/icecream.png';

const AVATAR_MAP = {
    'barista': { name: 'Barista (Cafe)', img: baristaAvatar },
    'abuela': { name: 'Abuela (Home)', img: abuelaAvatar },
    'learner': { name: 'Learner (Tutor)', img: learnerAvatar },
    'tio': { name: 'Tío (Uncle)', img: tioAvatar },
    'papi': { name: 'Papi (Dad)', img: papiAvatar },
    'mari': { name: 'Mari (Cousin)', img: mariAvatar },
    'sibling': { name: 'Sibling (Beach)', img: siblingAvatar },
    'mami': { name: 'Mami (Mom)', img: mamiAvatar },
    'tia': { name: 'Tía (Aunt)', img: tiaAvatar },
    'juan': { name: 'Juan (Friend)', img: juanAvatar },
    'local': { name: 'Local (San Juan)', img: localAvatar },
    'icecream': { name: 'Ice Cream Delivery', img: icecreamAvatar }
};


const ICON_MAP = {
    'Coffee': <Coffee size={24} />,
    'Users': <Users size={24} />,
    'MapPin': <MapPin size={24} />,
    'Home': <Home size={24} />,
    'Briefcase': <Briefcase size={24} />,
    'CloudRain': <CloudRain size={24} />,
    'Smile': <Smile size={24} />,
    'Palmtree': <Palmtree size={24} />,
    'Gift': <Gift size={24} />,
    'Thermometer': <Thermometer size={24} />,
    'Sun': <Sun size={24} />,
    'Moon': <Moon size={24} />,
    'Utensils': <Utensils size={24} />,
    'Backpack': <Backpack size={24} />,
    'Phone': <Phone size={24} />,
    'Pizza': <Pizza size={24} />,
    'Bus': <Bus size={24} />,
    'Hotel': <Hotel size={24} />,
    'Stethoscope': <Stethoscope size={24} />,
    'Book': <Book size={24} />,
    'ShieldAlert': <ShieldAlert size={24} />,
    'ShoppingCart': <ShoppingCart size={24} />,
    'Shirt': <Shirt size={24} />,
    'Droplet': <Droplet size={24} />,
    'Package': <Package size={24} />,
    'IceCream': <IceCream size={24} />
};

export default function ScenarioAdmin() {
    const navigate = useNavigate();
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);





    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scenarios:', error);
            setError('Failed to load scenarios. Make sure the "scenarios" table exists in Supabase.');
        } else {
            setScenarios(data || []);
            setError(null);
        }
        setLoading(false);
    };

    const handleEdit = (scenario) => {
        setEditingId(scenario.id);
        setFormData(scenario);
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
    };

    const handleSave = async () => {
        setError(null);
        const method = editingId === 'new' ? 'insert' : 'update';

        let query = supabase.from('scenarios');

        if (editingId === 'new') {
            const { id, ...newScenario } = formData;
            const { data, error } = await query.insert([newScenario]).select();
            if (error) {
                setError(error.message);
                return;
            }
        } else {
            const { error } = await query.update(formData).eq('id', editingId);
            if (error) {
                setError(error.message);
                return;
            }
        }

        setSuccess('Scenario saved successfully!');
        setEditingId(null);
        setFormData({});
        fetchScenarios();
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this scenario?')) return;

        const { error } = await supabase.from('scenarios').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            setSuccess('Deleted successfully');
            fetchScenarios();
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const addNew = () => {
        setEditingId('new');
        setFormData({
            title: '',
            description: '',
            prompt: '',
            color: '#F59E0B',
            icon_name: 'Coffee',
            voice_id: 'es-MX-MarinaNeural',
            is_active: true
        });
    };

    if (loading) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Loading scenarios...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/admin')} style={{ background: 'none', color: 'var(--color-text-secondary)', padding: '0.5rem' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>Manage Scenarios</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>

                    <button
                        onClick={addNew}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> New Scenario
                    </button>
                </div>
            </header>

            {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AlertCircle /> {error}
                </div>
            )}

            {success && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Check /> {success}
                </div>
            )}

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {(editingId === 'new') && (
                    <ScenarioForm
                        formData={formData}
                        setFormData={setFormData}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                )}

                {scenarios.map(sc => (
                    editingId === sc.id ? (
                        <ScenarioForm
                            key={sc.id}
                            formData={formData}
                            setFormData={setFormData}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    ) : (
                        <div key={sc.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{
                                padding: '1rem',
                                borderRadius: '1rem',
                                backgroundColor: `${sc.color}20`,
                                color: sc.color
                            }}>
                                {ICON_MAP[sc.icon_name] || <Coffee size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sc.title}</h3>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        backgroundColor: sc.difficulty_level === 'A0' ? '#D1FAE5' : sc.difficulty_level === 'A1' ? '#DBEAFE' : '#FCE7F3',
                                        color: sc.difficulty_level === 'A0' ? '#065F46' : sc.difficulty_level === 'A1' ? '#1E40AF' : '#9D174D',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        border: '1px solid currentColor'
                                    }}>
                                        {sc.difficulty_level || 'A1'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', backgroundColor: 'var(--color-bg-secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', opacity: 0.8 }}>
                                        {sc.avatar_url ? (
                                            <img src={sc.avatar_url} style={{ width: '16px', height: '16px', borderRadius: '50%' }} alt="" />
                                        ) : (
                                            <img src={AVATAR_MAP[sc.avatar_type || 'barista']?.img} style={{ width: '16px', height: '16px', borderRadius: '50%' }} alt="" />
                                        )}
                                        {sc.avatar_url ? 'Custom Avatar' : (AVATAR_MAP[sc.avatar_type || 'barista']?.name || 'Barista')}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--color-primary-faded)', color: 'var(--color-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>🎤 {sc.voice_id || 'nova'}</span>
                                    {!sc.is_active && <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Inactive</span>}
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{sc.description}</p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', backgroundColor: 'var(--color-bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                    {sc.prompt}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEdit(sc)} className="btn" style={{ padding: '0.5rem', background: 'var(--color-bg-surface)' }}><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(sc.id)} className="btn" style={{ padding: '0.5rem', background: 'var(--color-bg-surface)', color: 'var(--color-danger)' }}><Trash2 size={18} /></button>
                            </div>
                        </div>
                    )
                ))}
            </div>


        </div >
    );
}

function ScenarioForm({ formData, setFormData, onSave, onCancel }) {
    const [previewLoading, setPreviewLoading] = useState(false);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);

    const playVoicePreview = async () => {
        setPreviewLoading(true);
        try {
            const voiceId = formData.voice_id || 'nova';
            const text = "Hola, soy tu guía de LumiLibro. ¿Estás listo para una aventura?";
            const url = await generateOpenAISpeech(text, voiceId, 1.0);
            const audio = new Audio(url);
            audio.play();
        } catch (err) {
            console.error("Preview failed", err);
        } finally {
            setPreviewLoading(false);
        }
    };

    const generateCustomAvatar = async () => {
        if (!formData.title || !formData.prompt) {
            alert("Please provide a title and prompt first so the AI knows what to generate!");
            return;
        }
        setGeneratingAvatar(true);
        try {
            const prompt = `A portrait avatar of a character for a children's language app. 3D Pixar style, simple background. Character: ${formData.title}. Description: ${formData.description}. Persona: ${formData.prompt}`;
            const imageUrl = await generateStoryImage(prompt);
            setFormData({ ...formData, avatar_url: imageUrl, avatar_type: 'custom' });
        } catch (err) {
            console.error("Avatar generation failed", err);
            alert("Failed to generate avatar. Magic is hard!");
        } finally {
            setGeneratingAvatar(false);
        }
    };

    return (
        <div className="card" style={{ border: '2px solid var(--color-accent)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                    <input
                        className="input"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Ordering Pizza"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Icon & Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="input"
                            value={formData.icon_name}
                            onChange={e => setFormData({ ...formData, icon_name: e.target.value })}
                            style={{ flex: 1 }}
                        >
                            {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                            style={{ width: '40px', height: '42px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>AI Avatar</label>
                    <button
                        onClick={generateCustomAvatar}
                        disabled={generatingAvatar}
                        style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 'bold',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.3rem',
                            background: 'rgba(0, 163, 218, 0.1)'
                        }}
                    >
                        {generatingAvatar ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {formData.avatar_url ? 'Regenerate Custom' : 'Create Custom Avatar'}
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '0.5rem',
                    padding: '1rem',
                    background: 'var(--color-bg-primary)',
                    borderRadius: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {formData.avatar_url && (
                        <div
                            onClick={() => setFormData({ ...formData, avatar_type: 'custom' })}
                            style={{
                                cursor: 'pointer',
                                border: formData.avatar_type === 'custom' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                borderRadius: '0.5rem',
                                padding: '0.2rem',
                                textAlign: 'center',
                                background: formData.avatar_type === 'custom' ? 'white' : 'transparent'
                            }}
                        >
                            <img src={formData.avatar_url} style={{ width: '100%', borderRadius: '50%', aspectRatio: '1/1', objectFit: 'cover' }} alt="Custom" />
                            <div style={{ fontSize: '0.6rem', marginTop: '0.2rem', fontWeight: 'bold' }}>Custom</div>
                        </div>
                    )}
                    {Object.entries(AVATAR_MAP).map(([key, data]) => (
                        <div
                            key={key}
                            onClick={() => setFormData({ ...formData, avatar_type: key, avatar_url: null })}
                            style={{
                                cursor: 'pointer',
                                border: formData.avatar_type === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                                borderRadius: '0.5rem',
                                padding: '0.2rem',
                                textAlign: 'center',
                                background: formData.avatar_type === key ? 'white' : 'transparent',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <img src={data.img} style={{ width: '100%', borderRadius: '50%', aspectRatio: '1/1', objectFit: 'cover' }} alt={data.name} />
                            <div style={{ fontSize: '0.6rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>{data.name.split(' ')[0]}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Difficulty Level</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="input"
                            value={formData.difficulty_level || 'A1'}
                            onChange={e => setFormData({ ...formData, difficulty_level: e.target.value })}
                            style={{ fontWeight: 'bold', color: 'var(--color-primary)', flex: 1 }}
                        >
                            <option value="A0">A0 - Absolute Beginner</option>
                            <option value="A1">A1 - Beginner</option>
                            <option value="A2">A2 - Elementary</option>
                            <option value="B1">B1 - Intermediate</option>
                        </select>
                    </div>
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>OpenAI Voice</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="input"
                            value={formData.voice_id || 'es-MX-MarinaNeural'}
                            onChange={e => setFormData({ ...formData, voice_id: e.target.value })}
                            style={{ fontWeight: 'bold', color: 'var(--color-primary)', flex: 1 }}
                        >
                            <optgroup label="⭐ Azure Children (Spanish)">
                                <option value="es-MX-MarinaNeural">⭐ Marina (Child - MX)</option>
                                <option value="es-MX-YagoNeural">Yago (Young Boy - MX)</option>
                                <option value="es-MX-NuriaNeural">Nuria (Young Girl - MX)</option>
                            </optgroup>
                            <optgroup label="👨‍👩‍👧 Azure Young Adults (Spanish)">
                                <option value="es-MX-BeatrizNeural">Beatriz (Service Worker - MX)</option>
                                <option value="es-MX-CecilioNeural">Cecilio (Young Male - MX)</option>
                                <option value="es-MX-PelayoNeural">Pelayo (Youth - MX)</option>
                            </optgroup>
                            <optgroup label="👥 Azure Adults (Spanish)">
                                <option value="es-MX-DaliaNeural">Dalia (Professional F - MX)</option>
                                <option value="es-MX-CandelaNeural">Candela (Energetic F - MX)</option>
                                <option value="es-MX-LarisaNeural">Larisa (Playful F - MX)</option>
                                <option value="es-MX-RenataNeural">Renata (Maternal F - MX)</option>
                                <option value="es-MX-JorgeNeural">Jorge (Adult M - MX)</option>
                                <option value="es-MX-LucianoNeural">Luciano (Uncle - MX)</option>
                            </optgroup>
                            <optgroup label="🇺🇸 Azure Kids (English)">
                                <option value="en-US-AnaNeural">Ana (Girl - US)</option>
                                <option value="en-US-ChristopherNeural">Christopher (Boy - US)</option>
                            </optgroup>
                            <optgroup label="🔧 OpenAI Voices (Fallback)">
                                <option value="coral">Coral (Playful)</option>
                                <option value="ash">Ash (Boy)</option>
                                <option value="nova">Nova (Vibrant)</option>
                                <option value="shimmer">Shimmer (Soft)</option>
                                <option value="fable">Fable (Storyteller)</option>
                                <option value="sage">Sage (Calm)</option>
                                <option value="alloy">Alloy (Neutral)</option>
                                <option value="echo">Echo (Neutral M)</option>
                                <option value="onyx">Onyx (Deep M)</option>
                            </optgroup>
                        </select>
                        <button
                            onClick={playVoicePreview}
                            disabled={previewLoading}
                            style={{
                                padding: '0 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {previewLoading ? <Loader size={18} className="animate-spin" /> : <Volume2 size={18} />}
                        </button>
                    </div>
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                    <input
                        className="input"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Short summary for the user..."
                    />
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>AI Prompt (The Personality)</label>
                <textarea
                    className="input"
                    style={{ minHeight: '150px', fontFamily: 'monospace' }}
                    value={formData.prompt}
                    onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="YOU ARE A..."
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active and Visible to Users
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onCancel} className="btn" style={{ background: 'var(--color-bg-surface)' }}>Cancel</button>
                    <button onClick={onSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={18} /> Save Scenario</button>
                </div>
            </div>
        </div>
    );
}
