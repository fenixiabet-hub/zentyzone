/**
 * Zentyzone — Componente raiz
 * ------------------------------------------------------------
 * Decide que pantalla mostrar segun la sesion del usuario:
 *  - Si hay sesion activa  -> Dashboard
 *  - Si no hay sesion      -> Landing o Login
 *
 * La sesion se obtiene de Supabase y se mantiene aunque se
 * recargue la pagina.
 * ------------------------------------------------------------
 */
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
import { C } from './theme';
import type { Lang } from './translations';

type PublicView = 'landing' | 'login';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [lang, setLang] = useState<Lang>('es');

  // Carga las fuentes (DM Sans, Caveat, JetBrains Mono) desde Google Fonts.
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Caveat:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {
        /* el link ya fue removido */
      }
    };
  }, []);

  // Revisa si ya hay una sesion guardada y escucha cambios de login/logout.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setPublicView('landing');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga mientras se revisa la sesion inicial.
  if (checkingSession) {
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

  // Hay sesion activa: mostrar el panel del profesional.
  if (session) {
    const email = session.user.email ?? '';
    const userName = email.split('@')[0] || 'user';
    return (
      <Dashboard
        lang={lang}
        setLang={setLang}
        userName={userName}
        userId={session.user.id}
        onLogout={() => supabase.auth.signOut()}
      />
    );
  }

  // No hay sesion: mostrar Login o Landing.
  if (publicView === 'login') {
    return (
      <Login lang={lang} setLang={setLang} onBackToLanding={() => setPublicView('landing')} />
    );
  }

  return <Landing lang={lang} setLang={setLang} onGetStarted={() => setPublicView('login')} />;
}

export default App;
