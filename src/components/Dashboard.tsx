/**
 * Zentyzone — Dashboard (panel principal del profesional)
 * ------------------------------------------------------------
 * Contiene la cabecera, el saludo y el generador de notas.
 * ------------------------------------------------------------
 */
import { LogOut } from 'lucide-react';
import { C } from '../theme';
import { t, type Lang } from '../translations';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';
import { NoteGenerator } from './NoteGenerator';

interface DashboardProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  userName: string;
  userId: string;
  onLogout: () => void;
}

export function Dashboard({ lang, setLang, userName, userId, onLogout }: DashboardProps) {
  const L = t[lang];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return L.goodMorning;
    if (h < 18) return L.goodAfternoon;
    return L.goodEvening;
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ fontFamily: "'DM Sans', sans-serif", background: C.cream, color: C.brown }}
    >
      <div
        className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: C.mustardSoft, transform: 'translate(30%, -30%)' }}
      />

      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(251, 247, 238, 0.85)', borderBottom: `1px solid ${C.creamWarm}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <Logo size={36} />
              <span
                className="text-lg tracking-tight hidden sm:block"
                style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
              >
                Zentyzone
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <LangToggle lang={lang} setLang={setLang} />
              <div
                className="hidden sm:flex items-center gap-2.5 text-sm pl-3"
                style={{ borderLeft: `1px solid ${C.creamWarm}` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: C.mustardSoft, color: C.mustardDark, fontWeight: 700 }}
                >
                  {userName.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ color: C.brown }}>{userName || 'user'}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                style={{ color: C.brownSoft }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{L.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14">
          <div
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: C.mustardDark, fontWeight: 600 }}
          >
            —{' '}
            {new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <h1
            className="text-3xl md:text-4xl tracking-tight"
            style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.02em' }}
          >
            {greeting()}, <span style={{ color: C.mustardDark }}>{userName || 'amig@'}</span>
          </h1>
          <p className="mt-3 text-lg" style={{ color: C.brownSoft }}>
            {L.dashSubtitle}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-12 lg:pb-16">
        <NoteGenerator lang={lang} userId={userId} />
      </main>
    </div>
  );
}
