/**
 * Zentyzone — Router principal
 * ------------------------------------------------------------
 * Define todas las rutas de la app:
 *  /               → Landing (si no autenticado) o /app/home
 *  /login          → Login
 *  /app/*          → Layout con sidebar (requiere sesión)
 *    /app/home
 *    /app/new
 *    /app/history
 *    /app/templates
 *    /app/clients
 *    /app/glossary
 *    /app/tutorial
 *    /app/faq
 *    /app/account
 *    /app/billing
 * ------------------------------------------------------------
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Logo } from './components/Logo';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './components/pages/Home';
import { NewNote } from './components/pages/NewNote';
import { History } from './components/pages/History';
import { Templates } from './components/pages/Templates';
import { Clients } from './components/pages/Clients';
import { Glossary } from './components/pages/Glossary';
import { Tutorial } from './components/pages/Tutorial';
import { FAQ } from './components/pages/FAQ';
import { Account } from './components/pages/Account';
import { Billing } from './components/pages/Billing';
import { C } from './theme';
import type { Lang } from './translations';

// ── Pantalla de carga inicial ──────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ fontFamily: "'DM Sans', sans-serif", background: C.cream }}
    >
      <div className="flex flex-col items-center gap-4">
        <Logo size={48} />
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: C.mustard, borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  );
}

// ── Ruta protegida: redirige a /login si no hay sesión ─────
function RequireAuth({ session }: { session: Session | null }) {
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ── Componente principal ───────────────────────────────────
export default function App() {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lang, setLang] = useState<Lang>('es');

  // Estado del perfil (para el sidebar)
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [notesCount, setNotesCount] = useState(0);

  // ── Sesión Supabase ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setPlan('free');
        setNotesCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Perfil del usuario (para el sidebar) ──
  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('profiles')
      .select('subscription_status, notes_generated_count')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.subscription_status === 'pro' ? 'pro' : 'free');
          setNotesCount(
            typeof data.notes_generated_count === 'number'
              ? data.notes_generated_count
              : 0,
          );
        }
      });
  }, [session?.user.id]);

  if (checkingSession) return <LoadingScreen />;

  // Datos derivados de la sesión
  const userId = session?.user.id ?? '';
  const userEmail = session?.user.email ?? '';
  const userName = userEmail.split('@')[0] || 'user';

  const handleLogout = () => supabase.auth.signOut();

  return (
    <Routes>
      {/* Raíz: Landing si no hay sesión, dashboard si la hay */}
      <Route
        path="/"
        element={
          session ? (
            <Navigate to="/app/home" replace />
          ) : (
            <Landing
              lang={lang}
              setLang={setLang}
              onGetStarted={() => navigate('/login')}
            />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/app/home" replace />
          ) : (
            <Login
              lang={lang}
              setLang={setLang}
              onBackToLanding={() => navigate('/')}
            />
          )
        }
      />

      {/* Rutas protegidas */}
      <Route element={<RequireAuth session={session} />}>
        <Route
          path="/app"
          element={
            <AppLayout
              lang={lang}
              setLang={setLang}
              userEmail={userEmail}
              userName={userName}
              userId={userId}
              plan={plan}
              notesCount={notesCount}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route
            path="home"
            element={
              <Home lang={lang} userId={userId} userName={userName} />
            }
          />
          <Route
            path="new"
            element={<NewNote lang={lang} userId={userId} />}
          />
          <Route
            path="history"
            element={<History lang={lang} userId={userId} />}
          />
          <Route
            path="templates"
            element={<Templates lang={lang} userId={userId} />}
          />
          <Route
            path="clients"
            element={<Clients lang={lang} userId={userId} />}
          />
          <Route path="glossary" element={<Glossary lang={lang} />} />
          <Route path="tutorial" element={<Tutorial lang={lang} />} />
          <Route path="faq" element={<FAQ lang={lang} />} />
          <Route
            path="account"
            element={
              <Account
                lang={lang}
                setLang={setLang}
                userId={userId}
                userEmail={userEmail}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="billing"
            element={<Billing lang={lang} userId={userId} />}
          />
        </Route>
      </Route>

      {/* Cualquier otra ruta → raíz */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
