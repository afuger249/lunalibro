# LumiLibro Master Roadmap & Status

This document tracks the current state of **LumiLibro** (formerly SpanishBuddy/LingoTales) and outlines the remaining steps for production and polish.

## ✅ Completed Milestones
The following core systems have been implemented, tested, and verified during recent sessions:

### 🎨 Branding & Identity
- **LumiLibro Rebrand**: Global update from "SpanishBuddy" complete. Native app name, landing page, dashboard, and icons are all synchronized.
- **Immersive World**: Replaced traditional menus with a "Living Map" and "Detective Agency" world navigation.
- **Dynamic Character Designer**: Visual color swatches and context-aware customization for the "Cast."

### 🔐 Infrastructure & Security
- **API Key Proxying**: Removed client-side exposure of OpenAI and ElevenLabs keys. All calls now go through **Supabase Edge Functions**.
- **Cloud Persistence**: Migrated from `localStorage` to **Supabase**. Stories and sessions are now synced to the cloud, preventing data loss and `QuotaExceededError`.
- **Storage Guard**: Robust cleanup for deprecated local data and protection against oversized payloads.

### 📖 Story & UX Polish
- **Creator Flow Enhancements**: Added "Magic Dice" (Prompt Starters), "Surprise Me," and real-time character DNA previews.
- **Reader Immersion**: "Open the Magic Book" entry transition with background sparkles and 3D animatons.
- **PDF Naming & Export**: Resolved UUID naming issues on mobile; PDF downloads now correctly use the story title and `.pdf` extension.
- **Optimized Bookshelf**: Implemented thumbnail extraction for fast loading of large libraries.
- **Admin Usage Dashboard**: Real-time credit tracking for OpenAI/ElevenLabs and cost estimation.
- **Story Feedback Loop**: Integrated 👍/👎 rating system with admin overview.

---

## 🛠 Remaining Roadmap (Final Polish)

- **Goal**: Transition from "robotic" adult voices to playful, character-specific alternatives using OpenAI's extended library.
- **Voice Mapping Strategy**:
    - **Boy/Young Male**: `ash` or `ballad` (energetic/youthful).
    - **Girl/Young Female**: `coral` (playful) or `nova`.
    - **Grandma/Mature Female**: `sage` (calm/mature).
    - **Neutral/Narrator**: `shimmer` or `alloy`.

## Proposed Changes

### 💾 Database Layer
- **SQL Migration**: Run the following in the Supabase SQL Editor:
  ```sql
  ALTER TABLE scenarios ADD COLUMN voice_id TEXT DEFAULT 'nova';
  ```

### 🌐 Edge Function Layer
- **Function `generate-speech`**: Already supports the `voice` parameter. No backend changes needed immediately, but verify deployment.

### 🖥 Frontend Layer
- **[MODIFY] `ChatSession.jsx`**: Update to fetch the `voice_id` from the scenario and pass it to the TTS call.
- **[MODIFY] `ScenarioAdmin.jsx`**: Add a dropdown to select the `voice_id` when creating/editing scenarios.

### 2. 🎪 Atmospheric Animations
- [ ] **Voice-Responsive Particles**: (Polish) Enhance the Chat mic button to trigger dynamic particle bursts/waveforms that react to real-time volume input.
- [ ] **Living Floor**: Implement parallax cloud layers and "Wandering Butterflies" (randomly flying emojis) on the Adventure Map.
- [ ] **Squash & Stretch**: Add tactile "bouncy" animations to location nodes during hover and click sequences.
- [ ] **Click Fireworks**: Add small, themed particle bursts (e.g. coffee beans for the Café) when selecting locations.

### 3. 📱 Mobile Distribution Strategy
- [ ] **Production Bundle ID**: Change `com.yourdomain.lumilibro` to a final, unique identifier (e.g. `com.lumilibro.app`).
- [ ] **Asset Finalization**: Verify the generated `@capacitor/assets` look crisp on high-density Retina displays.
- [ ] **TestFlight / beta**: Upload the first build to Apple TestFlight for external beta testing.
- [ ] **Legal Review**: Ensure the `PrivacyPolicy.md` link is correctly integrated into the app's 'About' or 'Settings' page.


---

## 🚀 Manual Sync Workflow (For USER)
Whenever you are ready to test these transitions on your physical device:
1. `npm run build`
2. `npx cap sync`
3. `npx cap open ios` (Clean & Build in Xcode)
