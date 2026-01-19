/**
 * Utility for persisting storybooks in localStorage.
 * Stories are stored as an array of objects.
 */

import { supabase } from './supabase';
// Storage now handled via Supabase 'stories' table.
// LocalStorage is deprecated for stories to avoid QuotaExceededError.

// Async Save
export const saveStorybook = async (storyData, userId) => {
    try {
        if (!userId) throw new Error("User ID required for cloud storage");

        const newStory = {
            id: storyData.id || Date.now().toString(),
            user_id: userId,
            title: storyData.title,
            content: storyData, // Store full JSON including images
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('stories').upsert(newStory);

        if (error) throw error;
        return newStory.id;
    } catch (e) {
        console.error("Failed to save storybook to Cloud", e);
        return null;
    }
};

// Async Fetch List (Lightweight)
export const getStorybooksHistory = async (userId) => {
    try {
        if (!userId) return [];
        // Efficiently fetch only what we need for the library view
        const { data, error } = await supabase
            .from('stories')
            .select(`
                id, 
                title, 
                created_at, 
                thumbnail:content->pages->0->image
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(row => ({
            id: row.id,
            title: row.title,
            created_at: row.created_at,
            coverImage: row.thumbnail // Just the cover
        }));
    } catch (e) {
        console.error("Failed to load storybooks from Cloud", e);
        return [];
    }
};

// Async Get Single
export const getStorybookById = async (userId, id) => {
    try {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return null;

        return {
            ...data.content,
            id: data.id,
            title: data.title,
            created_at: data.created_at
        };
    } catch (e) {
        console.error("Failed to fetch single story", e);
        return null;
    }
};

export const getSeriesHistory = (userId, seriesId) => {
    if (!seriesId) return [];
    const history = getStorybooksHistory(userId);
    return history
        .filter(s => s.seriesId === seriesId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

// Async Delete
export const deleteStorybook = async (userId, id) => {
    try {
        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('user_id', userId)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Failed to delete storybook", e);
        return false;
    }
};
