import { getChatResponse } from './openai';

export const generateMystery = async (theme = 'default', spanishLevel = 'A1') => {
  const prompt = `
    Create a unique, simple Lumi Adventure (a magical mystery) for a Spanish learner.
    Output MUST be a valid JSON object with this exact structure:
    {
      "id": "generated-${Date.now()}",
      "title": "Adventure Title in English",
      "intro": "Short magical intro in English explaining what glowing object is lost.",
      "goal": "Main objective (e.g. Find the Lost Cat)",
      "collectible": {
        "id": "item-${Date.now()}",
        "name": "Name in English",
        "nameSpanish": "Name in Spanish",
        "emoji": "Emoji icon of the prize"
      },
      "steps": [
        {
          "id": 1,
          "targetLocation": "one of: cafe, plaza, school, home, beach",
          "npc": "Name of character at this location (e.g. Barista, Teacher)",
          "initialPrompt": "Instruction for user in English (e.g. Ask the Barista...)",
          "clue": "The hint they give in English/Spanish mixed (e.g. I saw it near the Plaza!)",
          "suggestedPhrase": "What the user should ASK to get this info (e.g. '¿Has visto mi sombrero?')",
          "requiredKeyword": "Single Spanish word related to the clue that user must say to find it (e.g. 'plaza' or the item name)",
          "nextStepId": 2
        },
        ... (create 3 steps total) ...
        {
          "id": 3,
          "targetLocation": "...",
          "npc": "...",
          "initialPrompt": "...",
          "clue": "You found it! (Ending message)",
          "requiredKeyword": "Single Spanish word related to the clue that user must say to find it (e.g. 'plaza' or the item name)",
          "requiredKeywordEnglish": "English translation of the keyword (e.g. 'Square' or 'Key')",
          "isFinal": true
        }
      ]
    }
    
    CRITICAL: YOU MUST USE ONLY THESE LOCATIONS (ID must match exactly):
    - cafe (Magic Café)
    - plaza (Town Plaza)
    - school (Library/School)
    - home (Abuela's House)
    - beach (Sunny Beach)
    
    THEME: ${theme}
    Language Level: ${spanishLevel}.
    Keep clues simple. ensure 'collectible' is always included so the user gets a prize.
  `;

  try {
    const responseMessage = await getChatResponse([
      { role: 'system', content: 'You are a creative game master designed to generate JSON mystery scenarios.' },
      { role: 'user', content: prompt }
    ]);

    // Attempt to parse JSON (sometimes LLM adds markdown blocks)
    const rawContent = responseMessage.message.content || "";
    const jsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to generate mystery:", error);
    // Fallback or re-throw
    return null;
  }
};

export const generateSurpriseScenario = async (ageLevel = 'adult', spanishLevel = 'A1', locationId = null) => {
  const getLevelInstructions = (level) => {
    switch (level) {
      case 'A0':
        return 'VERY BEGINNER. Use mostly single words, greetings, and basic pointing (e.g., "Sí", "No", "Por favor", "Aquí"). Assume zero Spanish knowledge.';
      case 'A1':
        return 'BEGINNER. Use simple present tense, common nouns with emojis, and short sentences (max 5 words). Offer clear A/B choices.';
      case 'A2':
        return 'ELEMENTARY. Can use present and basic past tense (Pretérito Perfecto). Sentences can be 5-10 words. Context should be very clear.';
      case 'B1':
        return 'INTERMEDIATE. Use a mix of tenses including past and future. Can use more abstract vocabulary but keep it helper-friendly.';
      case 'B2':
        return 'UPPER INTERMEDIATE. Use complex sentence structures, some idioms, and subjuctive mood if appropriate. Talk like a native but slightly slower.';
      case 'C1':
        return 'ADVANCED. Use full native-level complexity, including slang, metaphors, and fast-paced conversation.';
      default:
        return 'Adjust complexity to a general beginner level.';
    }
  };

  const locationContext = locationId ? `The scenario MUST take place at this location: ${locationId}.` : '';

  const prompt = `
    Create a unique, practical roleplay scenario for a Spanish learner.
    
    USER SETTINGS:
    - Age Level: ${ageLevel}
    - Spanish Difficulty: ${spanishLevel}
    - PEDAGOGICAL GUIDANCE: ${getLevelInstructions(spanishLevel)}
    ${locationContext}

    Focus on the most common questions and short conversations one might have in real-world situations (e.g., ordering food, asking for help, shopping, greetings).
    
    Output MUST be a valid JSON object with this exact structure:
    {
      "title": "Clear and descriptive title in English",
      "description": "One sentence description of the scenario in English.",
      "prompt": "YOU ARE [ROLE]. [Context for AI character]. [Instructions: 1. RECAST user intent correctly. 2. USE FORCED CHOICE. 3. Use emojis for nouns. 4. NUMBER REINFORCEMENT. 5. Keep responses to 2-3 sentences max. 6. 100% Spanish. 7. Use a warm, helpful tone. 8. STRICTLY ADHERE TO THE SPANISH DIFFICULTY LEVEL: ${spanishLevel}]",
      "avatar_type": "auto",
      "voice_id": "Choose one: ash, ballad, coral, sage, shimmer, alloy, echo, onyx (matches character persona)",
      "color": "Hex color code matching the vibe"
    }
    
    Themes to prioritize: Ordering at a Cafe, Asking for Directions, Introducing Yourself, Simple Shopping, Checking into a Hotel (if adult), School/Library (if kid).
    DO NOT use complex fantasy or highly abstract themes. Keep it practical and useful.
    `;

  try {
    const responseMessage = await getChatResponse([
      { role: 'system', content: 'You are a creative scenario generator. Output only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const rawContent = responseMessage.message.content || "";
    const jsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to generate surprise scenario:", error);
    return {
      title: "Surprise Chat",
      description: "Let's talk about anything!",
      prompt: "YOU ARE A FRIENDLY STRANGER. Talk about hobbies.",
      avatar_type: "auto",
      color: "#8B5CF6"
    };
  }
};
