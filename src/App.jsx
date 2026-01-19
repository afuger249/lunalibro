
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import LoadingPage from './components/LoadingPage';

import { MysteryProvider } from './context/MysteryContext';

// Lazy Load Pages
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChatSession = lazy(() => import('./pages/ChatSession'));
const ScenarioSelect = lazy(() => import('./pages/ScenarioSelect'));
const History = lazy(() => import('./pages/History'));
const AdminStats = lazy(() => import('./pages/AdminStats'));
const ScenarioAdmin = lazy(() => import('./pages/ScenarioAdmin'));
const Landing = lazy(() => import('./pages/Landing'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const StorybookCreator = lazy(() => import('./pages/StorybookCreator'));
const StoryReader = lazy(() => import('./pages/StoryReader'));
const Bookshelf = lazy(() => import('./pages/Bookshelf'));
const Legal = lazy(() => import('./pages/Legal'));
const WordRush = lazy(() => import('./pages/WordRush'));
const Collection = lazy(() => import('./pages/Collection'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ageLevel, setAgeLevel] = useState(() => {
    return localStorage.getItem('ageLevel') || 'kid';
  });
  const [spanishLevel, setSpanishLevel] = useState(() => {
    return localStorage.getItem('spanishLevel') || 'A1';
  });

  useEffect(() => {
    if (ageLevel === 'adult') {
      document.body.classList.add('adult-mode');
    } else {
      document.body.classList.remove('adult-mode');
    }
    localStorage.setItem('ageLevel', ageLevel);
  }, [ageLevel]);

  useEffect(() => {
    localStorage.setItem('spanishLevel', spanishLevel);
  }, [spanishLevel]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <MysteryProvider>
      <Router>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route
              path="/auth"
              element={!session ? <Auth /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/reset-password"
              element={<ResetPassword />}
            />
            <Route
              path="/"
              element={<Landing session={session} />}
            />
            <Route
              path="/dashboard"
              element={session ? <Dashboard ageLevel={ageLevel} setAgeLevel={setAgeLevel} spanishLevel={spanishLevel} setSpanishLevel={setSpanishLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/chat"
              element={session ? <ChatSession ageLevel={ageLevel} setAgeLevel={setAgeLevel} spanishLevel={spanishLevel} setSpanishLevel={setSpanishLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/scenarios"
              element={session ? <ScenarioSelect ageLevel={ageLevel} spanishLevel={spanishLevel} setSpanishLevel={setSpanishLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/history"
              element={session ? <History ageLevel={ageLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/admin"
              element={session ? <AdminStats ageLevel={ageLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/admin/scenarios"
              element={session ? <ScenarioAdmin ageLevel={ageLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/profile"
              element={session ? <Profile ageLevel={ageLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/storybook/create"
              element={session ? <StorybookCreator ageLevel={ageLevel} spanishLevel={spanishLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/storybook/read/:id"
              element={session ? <StoryReader /> : <Navigate to="/auth" />}
            />
            <Route
              path="/bookshelf"
              element={session ? <Bookshelf /> : <Navigate to="/auth" />}
            />
            <Route
              path="/privacy"
              element={<Legal type="privacy" ageLevel={ageLevel} />}
            />
            <Route
              path="/terms"
              element={<Legal type="terms" ageLevel={ageLevel} />}
            />
            <Route
              path="/word-rush"
              element={session ? <WordRush ageLevel={ageLevel} spanishLevel={spanishLevel} /> : <Navigate to="/auth" />}
            />
            <Route
              path="/collection"
              element={session ? <Collection ageLevel={ageLevel} /> : <Navigate to="/auth" />}
            />
          </Routes>
        </Suspense>
      </Router>
    </MysteryProvider>
  );
}

export default App;
