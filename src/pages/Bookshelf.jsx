import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, BookOpen, Download, X, Home, Loader, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorybooksHistory, deleteStorybook, getStorybookById } from '../lib/storybook_storage';
import { generateStoryPDF } from '../lib/pdf_generator';
import { supabase } from '../lib/supabase';
import CustomModal from '../components/CustomModal';

export default function Bookshelf() {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [readyPDFs, setReadyPDFs] = useState({}); // { storyId: { blobUrl, fileName } }

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [isDeletingId, setIsDeletingId] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                loadStories(user.id);
            } else {
                setIsLoading(false);
            }
        });
    }, []);

    const loadStories = async (uid) => {
        setIsLoading(true);
        const history = await getStorybooksHistory(uid);
        setStories(history);
        setIsLoading(false);
    };

    const handleDeleteStory = async (e, id) => {
        e.stopPropagation();
        e.preventDefault();

        setModalConfig({
            isOpen: true,
            title: "Remove Book?",
            message: "Are you sure you want to remove this book from your library? This cannot be undone.",
            type: "warning",
            confirmText: "Yes, Delete",
            cancelText: "Keep it",
            onConfirm: () => confirmDelete(id)
        });
    };

    const confirmDelete = async (id) => {
        setModalConfig({ ...modalConfig, isOpen: false });
        if (userId) {
            await deleteStorybook(userId, id);
            loadStories(userId);
        }
    };

    const handleDownloadPDF = async (e, storySummary) => {
        e.stopPropagation();
        e.preventDefault();
        if (!userId) return;

        // If it's already generated and ready, trigger the final trusted click
        if (readyPDFs[storySummary.id]) {
            const { trigger } = readyPDFs[storySummary.id];
            trigger();
            return;
        }

        setDownloadingId(storySummary.id);
        try {
            const fullStory = await getStorybookById(userId, storySummary.id);
            if (fullStory) {
                const result = await generateStoryPDF(fullStory);
                if (result) {
                    setReadyPDFs(prev => ({
                        ...prev,
                        [storySummary.id]: result
                    }));
                }
            } else {
                setModalConfig({
                    isOpen: true,
                    title: "Missing Magic",
                    message: "We couldn't find the full details of this story to create a PDF. Please try again.",
                    type: "error"
                });
            }
        } catch (err) {
            console.error("PDF Download Error:", err);
            setModalConfig({
                isOpen: true,
                title: "Magic Jammed",
                message: "Something went wrong while painting your PDF. It might be due to a complex image.",
                type: "error"
            });
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundImage: 'url(/bookshelf_bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            {/* Overlay for readability if needed */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{
                position: 'relative', zIndex: 10, padding: '1.5rem 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)'
            }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                        padding: '0.6rem 1rem', borderRadius: '50px',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '0.9rem'
                    }}
                >
                    <Home size={18} /> Home
                </button>
                <div className="font-serif" style={{
                    color: 'white',
                    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                    fontWeight: '900',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    textAlign: 'right'
                }}>
                    The Great Library
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                position: 'relative', zIndex: 10, flex: 1,
                padding: 'min(2rem, 5vw)',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                {isLoading ? (
                    <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '4rem' }}>Loading your books...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '2rem',
                        width: '100%',
                        maxWidth: '1000px',
                        padding: '1rem'
                    }}>
                        {/* Create New Book Card */}
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/storybook/create')}
                            className="magic-paper"
                            style={{
                                aspectRatio: '3/4',
                                background: 'rgba(255,255,255,0.9)',
                                borderRadius: '16px',
                                border: '4px dashed #8B5CF6',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: '#8B5CF6', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <Plus size={32} />
                            </div>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#8B5CF6', textAlign: 'center' }}>
                                Write New<br />Story
                            </span>
                        </motion.div>

                        {/* Existing Books */}
                        {stories.map(story => (
                            <motion.div
                                key={story.id}
                                whileHover={{ scale: 1.05, y: -10 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/storybook/read/${story.id}`)}
                                style={{
                                    aspectRatio: '3/4',
                                    background: 'white',
                                    borderRadius: '5px 16px 16px 5px', // Sharper spine, rounded edge
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    boxShadow: '5px 5px 15px rgba(0,0,0,0.3)', // Deep shadow
                                    display: 'flex', flexDirection: 'column',
                                    transformStyle: 'preserve-3d',
                                    borderLeft: '12px solid #5d4037', // Leather spine look
                                }}
                            >
                                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                    {story.coverImage ? (
                                        <img
                                            src={story.coverImage}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt="Cover"
                                            onError={(e) => {
                                                e.target.onerror = null; // Prevent infinite loops
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div style={{
                                        width: '100%', height: '100%',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        display: story.coverImage ? 'none' : 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <BookOpen size={40} color="white" />
                                    </div>
                                    {/* Actions Overlay */}
                                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '8px', zIndex: 100 }}>
                                        <button
                                            onClick={(e) => handleDeleteStory(e, story.id)}
                                            style={{
                                                padding: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)',
                                                color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                transform: 'translateZ(10px)'
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDownloadPDF(e, story)}
                                            disabled={downloadingId === story.id}
                                            style={{
                                                padding: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)',
                                                color: '#3b82f6', border: '1px solid #dbeafe',
                                                cursor: downloadingId === story.id ? 'default' : 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                transform: 'translateZ(10px)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={readyPDFs[story.id] ? "Download Now" : "Paint PDF"}
                                        >
                                            {downloadingId === story.id ? (
                                                <Loader size={18} className="animate-spin" />
                                            ) : readyPDFs[story.id] ? (
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} style={{ color: '#10b981' }}>
                                                    <Sparkles size={18} />
                                                </motion.div>
                                            ) : (
                                                <Download size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '1rem', background: 'white',
                                    borderTop: '1px solid #f1f5f9'
                                }}>
                                    <h3 className="font-serif" style={{
                                        fontSize: '1rem', fontWeight: 'bold', color: '#1e293b',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        marginBottom: '0.2rem'
                                    }}>
                                        {story.title || 'Untitled'}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {new Date(story.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </div>
    );
}
