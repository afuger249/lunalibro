// Supabase Edge Function: generate-vocabulary
// Generates personalized Spanish vocabulary using OpenAI based on user interests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface VocabularyRequest {
    userId: string
    spanishLevel: string // 'A0', 'A1', 'A2'
    count: number // Number of words to generate
    userInterests?: string[] // Optional: detected from user's story/chat history
}

interface VocabularyWord {
    english_word: string
    spanish_word: string
    difficulty_level: string
    category: string
    illustration_emoji: string
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, spanishLevel, count, userInterests }: VocabularyRequest = await req.json()

        if (!userId || !spanishLevel || !count) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: userId, spanishLevel, count' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        // Fetch user interests if not provided
        let interests = userInterests
        if (!interests || interests.length === 0) {
            interests = await getUserInterests(supabase, userId)
        }

        // Generate vocabulary using OpenAI
        const vocabulary = await generateVocabularyWithOpenAI(spanishLevel, count, interests)

        // Save to database
        const savedWords = await saveVocabularyToDatabase(supabase, userId, vocabulary)

        return new Response(
            JSON.stringify({
                success: true,
                words: savedWords,
                count: savedWords.length
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error generating vocabulary:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/**
 * Fetch user interests from their story topics and chat sessions
 */
async function getUserInterests(supabase: any, userId: string): Promise<string[]> {
    try {
        // Get recent story topics
        const { data: stories } = await supabase
            .from('stories')
            .select('main_character, setting')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)

        // Get recent chat scenarios
        const { data: sessions } = await supabase
            .from('sessions')
            .select('scenario_title')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        // Extract interests
        const interests: string[] = []

        if (stories) {
            stories.forEach((story: any) => {
                if (story.main_character) interests.push(story.main_character)
                if (story.setting) interests.push(story.setting)
            })
        }

        if (sessions) {
            sessions.forEach((session: any) => {
                if (session.scenario_title) interests.push(session.scenario_title)
            })
        }

        // Return unique interests or default to general topics
        const uniqueInterests = [...new Set(interests)]
        return uniqueInterests.length > 0 ? uniqueInterests.slice(0, 3) : ['daily life', 'animals', 'food']
    } catch (error) {
        console.error('Error fetching user interests:', error)
        return ['daily life', 'animals', 'food'] // Fallback defaults
    }
}

/**
 * Generate vocabulary using OpenAI based on difficulty level and interests
 */
async function generateVocabularyWithOpenAI(
    spanishLevel: string,
    count: number,
    interests: string[]
): Promise<VocabularyWord[]> {
    const prompt = createPrompt(spanishLevel, count, interests)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a Spanish language learning expert specializing in CEFR-based vocabulary curation. Always respond with valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        }),
    })

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)

    return content.vocabulary as VocabularyWord[]
}

/**
 * Create prompt for OpenAI vocabulary generation
 */
function createPrompt(spanishLevel: string, count: number, interests: string[]): string {
    const levelDescriptions = {
        'A0': 'absolute beginner (articles, pronouns, basic nouns, numbers 1-10)',
        'A1': 'beginner (common verbs, everyday adjectives, simple phrases)',
        'A2': 'elementary (complex verbs, abstract nouns, opinions, descriptions)'
    }

    const levelDesc = levelDescriptions[spanishLevel as keyof typeof levelDescriptions] || 'beginner'
    const interestsStr = interests.join(', ')

    return `Generate ${count} Spanish vocabulary words for ${spanishLevel} (${levelDesc}) level learners.

The learner is interested in: ${interestsStr}

Requirements:
1. Words should be appropriate for CEFR ${spanishLevel} level
2. Incorporate themes related to user interests when possible
3. Each word should have an appropriate emoji illustration
4. Categorize words (e.g., "animals", "food", "verbs", "adjectives", "emotions", "sports")
5. Prioritize high-frequency words within the difficulty level
6. Avoid words that are too rare or specialized

Return ONLY a JSON object in this exact format:
{
  "vocabulary": [
    {
      "english_word": "example",
      "spanish_word": "ejemplo",
      "difficulty_level": "${spanishLevel}",
      "category": "abstract",
      "illustration_emoji": "📚"
    }
  ]
}

Generate exactly ${count} words. Make them diverse across categories.`
}

/**
 * Save generated vocabulary to database
 */
async function saveVocabularyToDatabase(
    supabase: any,
    userId: string,
    vocabulary: VocabularyWord[]
): Promise<any[]> {
    // Mark all as AI-generated and NOT core
    const wordsToInsert = vocabulary.map(word => ({
        ...word,
        is_core: false,
        source: 'ai_generated'
    }))

    // Insert into vocabulary table
    const { data, error } = await supabase
        .from('vocabulary')
        .insert(wordsToInsert)
        .select()

    if (error) {
        // If words already exist, that's okay - just fetch them
        if (error.code === '23505') { // Unique violation
            const { data: existing } = await supabase
                .from('vocabulary')
                .select('*')
                .in('spanish_word', vocabulary.map(w => w.spanish_word))

            return existing || []
        }
        throw error
    }

    return data
}
