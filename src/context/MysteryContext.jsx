import { createContext, useState, useContext, useEffect } from 'react';
import { generateMystery } from '../lib/MysteryGenerator';
import { supabase } from '../lib/supabase';

const MysteryContext = createContext();

// Hardcoded test mystery for Phase 1
const TEST_MYSTERY = {
    id: 'case-001',
    title: 'The Case of the Missing Golden Key',
    intro: 'Oh no! The Town Mayor lost his Golden Key! He thinks he left it near the Café.',
    goal: 'Find the Golden Key',
    collectible: {
        id: 'golden-key',
        name: 'Golden Key',
        nameSpanish: 'La Llave de Oro',
        emoji: '🗝️'
    },
    steps: [
        {
            id: 1,
            targetLocation: 'cafe',
            npc: 'Barista',
            initialPrompt: 'Ask the Barista if they saw the key.',
            clue: 'I saw the Baker take something shiny to the Plaza!',
            requiredKeyword: 'llave', // simplistic check for now
            requiredKeywordEnglish: 'Key',
            nextStepId: 2
        },
        {
            id: 2,
            targetLocation: 'plaza',
            npc: 'Baker',
            initialPrompt: 'Ask the Baker about the key.',
            clue: 'I gave it to the Librarian for safe keeping!',
            requiredKeyword: 'llave',
            requiredKeywordEnglish: 'Key',
            nextStepId: 3
        },
        {
            id: 3,
            targetLocation: 'school', // Library is at the school
            npc: 'Librarian',
            initialPrompt: 'Ask the Librarian for the key.',
            clue: 'Here it is! You found the Golden Key!',
            requiredKeyword: 'llave',
            requiredKeywordEnglish: 'Key',
            isFinal: true
        }
    ]
};

export const MysteryProvider = ({ children }) => {
    const [backpack, setBackpack] = useState([]);

    // In a real app, we'd persist this to generic user_progress or localStorage
    const [mysteryState, setMysteryState] = useState({
        isActive: false,
        loading: false,
        caseData: null,
        currentStepIndex: 0,
        currentLocationId: null, // Track where we are
        isAwaitingJump: false,   // Show "Go to [Location]" button
        showBriefing: false,     // Show the HQ Briefing overlay
        isSolved: false,
        discoveredClues: []
    });

    // Load backpack from DB on mount (and migrate legacy localStorage if needed)
    useEffect(() => {
        const syncBackpack = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            try {
                // 1. Fetch existing DB treasures
                const { data: dbTreasures, error } = await supabase
                    .from('user_treasures')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;

                // 2. Check for legacy localStorage items
                const localKey = `backpack_${user.id}`;
                const saved = localStorage.getItem(localKey);
                let localItems = [];

                if (saved) {
                    try {
                        localItems = JSON.parse(saved);
                    } catch (e) {
                        console.error("Failed to parse legacy backpack", e);
                    }
                }

                // 3. Migrate local items if they aren't in DB
                if (localItems.length > 0) {
                    const existingIds = new Set(dbTreasures?.map(t => t.collectible_id) || []);
                    const newItems = localItems.filter(item => !existingIds.has(item.id));

                    if (newItems.length > 0) {
                        const itemsToInsert = newItems.map(item => ({
                            user_id: user.id,
                            collectible_id: item.id,
                            name_spanish: item.nameSpanish,
                            name_english: item.name || item.nameEnglish || item.id,
                            emoji: item.emoji,
                            found_at: item.foundAt || new Date().toISOString()
                        }));

                        const { data: inserted, error: insertError } = await supabase
                            .from('user_treasures')
                            .insert(itemsToInsert)
                            .select();

                        if (!insertError && inserted) {
                            console.log(`Migrated ${inserted.length} items to database`);
                            // Add migrated items to our initial state
                            dbTreasures.push(...inserted);

                            // Clear legacy storage after successful migration
                            localStorage.removeItem(localKey);
                        } else {
                            console.error("Migration failed", insertError);
                        }
                    }
                }

                setBackpack(dbTreasures || []);

            } catch (err) {
                console.error("Error syncing backpack:", err);
            }
        };

        syncBackpack();
    }, []);

    // Save backpack to DB when adding new item
    const addToBackpack = async (item) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        const newItem = {
            ...item,
            foundAt: new Date().toISOString()
        };

        // Check if already exists in state
        if (backpack.some(i => i.collectible_id === item.id || i.id === item.id)) return;

        // Prepare for DB
        const dbItem = {
            user_id: user.id,
            collectible_id: item.id,
            name_spanish: item.nameSpanish,
            name_english: item.name,
            emoji: item.emoji,
            found_at: newItem.foundAt
        };

        try {
            const { data, error } = await supabase
                .from('user_treasures')
                .insert([dbItem])
                .select()
                .single();

            if (error) throw error;

            setBackpack(prev => [...prev, data]);
        } catch (err) {
            console.error("Error adding to backpack DB:", err);
            // Revert optimistic update if we had one (though here we updated state in success block)
        }
    };


    const startMystery = async (useDynamic = false, spanishLevel = 'A1') => {
        const initializeState = (data) => ({
            isActive: true,
            loading: false,
            caseData: data,
            currentStepIndex: 0,
            currentLocationId: data.steps[0].targetLocation,
            isAwaitingJump: false,
            showBriefing: true, // Always start with briefing
            isSolved: false,
            discoveredClues: []
        });

        if (!useDynamic) {
            const newState = initializeState(TEST_MYSTERY);
            setMysteryState(newState);
            return newState;
        }

        setMysteryState(prev => ({ ...prev, loading: true, isActive: true }));

        try {
            const dynamicCase = await generateMystery('default', spanishLevel);
            if (dynamicCase) {
                const newState = initializeState(dynamicCase);
                setMysteryState(newState);
                return newState;
            } else {
                console.warn("Generation failed, using test case");
                const newState = initializeState(TEST_MYSTERY);
                setMysteryState(newState);
                return newState;
            }
        } catch (e) {
            const newState = initializeState(TEST_MYSTERY);
            setMysteryState(newState);
            return newState;
        }
    };

    const closeBriefing = () => {
        setMysteryState(prev => ({ ...prev, showBriefing: false }));
    };

    const advanceStep = () => {
        setMysteryState(prev => {
            if (!prev.caseData) return prev;

            const nextIndex = prev.currentStepIndex + 1;
            const isSolved = nextIndex >= prev.caseData.steps.length;

            if (isSolved && !prev.isSolved) {
                const item = prev.caseData.collectible;
                if (item) {
                    addToBackpack(item);
                }
            }

            // If not solved, wait for jump to next location
            return {
                ...prev,
                currentStepIndex: isSolved ? prev.currentStepIndex : nextIndex,
                isSolved: isSolved,
                isAwaitingJump: !isSolved // Logic: if NOT solved, we need to jump to the next NPC's location
            };
        });
    };

    const jumpToLocation = () => {
        setMysteryState(prev => {
            if (!prev.caseData) return prev;
            const nextStep = prev.caseData.steps[prev.currentStepIndex];
            return {
                ...prev,
                currentLocationId: nextStep.targetLocation,
                isAwaitingJump: false
            };
        });
    };

    const resetMystery = () => {
        setMysteryState({
            isActive: false,
            caseData: null,
            currentStepIndex: 0,
            currentLocationId: null,
            isAwaitingJump: false,
            showBriefing: false,
            isSolved: false,
            discoveredClues: []
        });
    };

    const getCurrentObjective = () => {
        if (!mysteryState.isActive || !mysteryState.caseData) return null;
        if (mysteryState.isSolved) return "Case Solved! Return to HQ.";

        const step = mysteryState.caseData.steps[mysteryState.currentStepIndex];
        return step.initialPrompt;
    };

    return (
        <MysteryContext.Provider value={{
            mysteryState,
            backpack,
            startMystery,
            advanceStep,
            jumpToLocation,
            closeBriefing,
            resetMystery,
            getCurrentObjective,
            previewMystery: TEST_MYSTERY
        }}>
            {children}
        </MysteryContext.Provider>
    );
};

export const useMysteryContext = () => useContext(MysteryContext);
