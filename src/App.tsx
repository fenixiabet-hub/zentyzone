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
import { AppLayout, type PlanStatus } from './components/layout/AppLayout';
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
import { Onboarding } from './components/pages/Onboarding';
import { TermsPage } from './components/pages/TermsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { CookiesPage } from './components/pages/CookiesPage';
import { DisclaimerModal } from './components/DisclaimerModal';
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

// ── Ruta que requiere plan activo ──────────────────────────────────────────
function RequirePlan({ plan, profileLoaded }: { plan: PlanStatus; profileLoaded: boolean }) {
  if (!profileLoaded) return <LoadingScreen />;
  if (plan === 'canceled') return <Navigate to="/app/billing" replace />;
  return <Outlet />;
}

// ── Componente principal ───────────────────────────────────
export default function App() {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lang, setLang] = useState<Lang>('es');

  // Estado del perfil (para el sidebar)
  const [plan, setPlan] = useState<PlanStatus>('canceled');
  const [notesCount, setNotesCount] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Modal de disclaimer de primera sesión
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

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
        setPlan('canceled');
        setNotesCount(0);
        setProfileLoaded(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Perfil del usuario (carga inicial) ──────────────────
  useEffect(() => {
    if (!session?.user.id) {
      setProfileLoaded(false);
      setDisclaimerChecked(false);
      return;
    }
    setProfileLoaded(false);
    supabase
      .from('profiles')
      .select('subscription_status, notes_generated_count, onboarding_disclaimer_acknowledged_at')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const validStatuses: PlanStatus[] = ['trial', 'plus', 'pro', 'past_due', 'canceled'];
          const rawStatus = data.subscription_status as string;
          setPlan(
            validStatuses.includes(rawStatus as PlanStatus)
              ? (rawStatus as PlanStatus)
              : 'canceled',
          );
          setNotesCount(
            typeof data.notes_generated_count === 'number'
              ? data.notes_generated_count
              : 0,
          );
          // Mostrar modal si nunca ha visto el disclaimer
          const acknowledged = (data as { onboarding_disclaimer_acknowledged_at?: string | null })
            .onboarding_disclaimer_acknowledged_at;
          if (!acknowledged) {
            setShowDisclaimerModal(true);
          }
          setDisclaimerChecked(true);
        }
        setProfileLoaded(true);
      });
  }, [session?.user.id]);

  // ── Realtime: actualiza plan cuando Supabase cambia ─────
  // Cuando el webhook o sync-subscription actualizan el perfil,
  // este listener recibe el cambio y actualiza el estado global
  // sin necesidad de recargar la página.
  useEffect(() => {
    if (!session?.user.id) return;
    const channel = supabase
      .channel(`profile-plan:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          const row = payload.new as { subscription_status: string; notes_generated_count: number };
          const validStatuses: PlanStatus[] = ['trial', 'plus', 'pro', 'past_due', 'canceled'];
          const rawStatus = row.subscription_status as string;
          setPlan(
            validStatuses.includes(rawStatus as PlanStatus)
              ? (rawStatus as PlanStatus)
              : 'canceled',
          );
          if (typeof row.notes_generated_count === 'number') {
            setNotesCount(row.notes_generated_count);
          }
          setProfileLoaded(true);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id]);

  if (checkingSession) return <LoadingScreen />;

  // Datos derivados de la sesión
  const userId = session?.user.id ?? '';
  const userEmail = session?.user.email ?? '';
  const userName = userEmail.split('@')[0] || 'user';

  const handleLogout = () => supabase.auth.signOut();

  return (
    <>
    {/* Modal de disclaimer de primera sesión */}
    {session && disclaimerChecked && showDisclaimerModal && (
      <DisclaimerModal
        lang={lang}
        userId={userId}
        onAcknowledged={() => setShowDisclaimerModal(false)}
      />
    )}
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

      {/* Onboarding: requiere sesión, NO requiere plan activo */}
      <Route
        path="/onboarding"
        element={
          session ? (
            <Onboarding userId={userId} userEmail={userEmail} lang={lang} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Rutas protegidas — requieren sesión */}
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
          {/* Billing: accesible para todos los planes (incluido canceled) */}
          <Route
            path="billing"
            element={<Billing lang={lang} userId={userId} />}
          />

          {/* Rutas que requieren plan activo (bloquea free y canceled) */}
          <Route element={<RequirePlan plan={plan} profileLoaded={profileLoaded} />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route
              path="home"
              element={<Home lang={lang} userId={userId} userName={userName} />}
            />
            <Route path="new" element={<NewNote lang={lang} userId={userId} />} />
            <Route path="history" element={<History lang={lang} userId={userId} />} />
            <Route path="templates" element={<Templates lang={lang} userId={userId} />} />
            <Route path="clients" element={<Clients lang={lang} userId={userId} />} />
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
          </Route>
        </Route>
      </Route>

      {/* Páginas legales — accesibles sin autenticación */}
      <Route path="/terms"   element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />

      {/* Cualquier otra ruta → raíz */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
