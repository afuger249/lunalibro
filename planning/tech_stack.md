# LunaLibro Tech Stack

This document serves as the master record of the technology stack for LunaLibro. It is updated as the architecture evolves.

## 🏗️ Core Architecture
*   **Frontend Framework:** **React 19** (JavaScript) managed by **Vite**.
*   **Mobile/Desktop Bridge:** **Capacitor 8**, enabling the web app to run natively on **iOS** and **Android**.
*   **Routing:** **React Router 7**, providing a smooth single-page application experience.

## 🔥 Backend & Infrastructure (**Supabase**)
*   **Database:** **PostgreSQL** for storing user data, story metadata, scenarios, and vocabulary.
*   **Authentication:** **Supabase Auth** for secure user login and profile management.
*   **Serverless Logic:** **Supabase Edge Functions** (Deno-based) handle complex backend tasks like:
    *   `chat`: Real-time AI conversation logic.
    *   `generate-image`: DALL-E integration for story illustrations.
    *   `generate-speech`: Orchestrating text-to-speech across multiple providers.
    *   `generate-vocabulary`: Extracting educational content from sessions.

## 🤖 AI & Voice Layer
*   **LLM (Text):** **OpenAI (GPT models)** for scenario generation and interactive chat sessions.
*   **Voice (TTS):** A multi-provider approach to deliver kid-friendly Spanish voices:
    *   **OpenAI TTS**
    *   **ElevenLabs** (Premium, expressive voices)
    *   **Azure Neural Voices**
*   **Images:** **OpenAI DALL-E 3** for generating character avatars and storybook pages.

## 🎨 Styling & Experience
*   **Styling:** **Vanilla CSS** with a custom design system focused on "glassmorphism" and a playful, 3D "Kiddopia-style" / Lego-brick aesthetic.
*   **Animations:** **Framer Motion** for smooth transitions and interactive elements.
*   **Icons:** **Lucide React** for a clean, consistent iconography.

## 📚 Specialized Libraries
*   **Storytelling:** `react-pageflip` for the signature book-flipping animation in the story viewer.
*   **PDF Generation:** `jspdf` for exporting generated stories to printable formats.
*   **Analytics:** `recharts` for visualizing progress and feedback in the Admin dashboard.
*   **Celebration:** `canvas-confetti` for "Lumi" rewards and milestone feedback.
