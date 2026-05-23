/**
 * Zentyzone — Layout principal autenticado
 * ------------------------------------------------------------
 * Desktop: sidebar fijo (240px) + área de contenido scrollable
 * Móvil:   sidebar como overlay + botón hamburguesa
 * ------------------------------------------------------------
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileMenuButton } from './MobileMenuButton';
import { useSessionGuard } from '../../hooks/useSessionGuard';
import { C } from '../../theme';
import type { Lang } from '../../translations';

export interface AppLayoutProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  userEmail: string;
  userName: string;
  userId: string;
  plan: 'free' | 'pro';
  notesCount: number;
  onLogout: () => void;
}

export function AppLayout({
  lang,
  setLang,
  userEmail,
  plan,
  notesCount,
  onLogout,
}: AppLayoutProps) {
  useSessionGuard(); // Vigila sesión única en toda la app autenticada
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex"
      style={{
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
        background: C.cream,
        color: C.brown,
      }}
    >
      {/* ── Overlay backdrop (solo móvil) ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(61,52,42,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar desktop (siempre visible) ── */}
      <aside
        className="hidden lg:flex flex-shrink-0"
        style={{ width: 240, height: '100vh', overflowY: 'auto' }}
      >
        <Sidebar
          lang={lang}
          setLang={setLang}
          userEmail={userEmail}
          plan={plan}
          notesCount={notesCount}
          onLogout={onLogout}
        />
      </aside>

      {/* ── Sidebar móvil (overlay, deslizable) ── */}
      <aside
        className="lg:hidden fixed inset-y-0 left-0 z-40 flex-shrink-0 transition-transform duration-300 ease-in-out"
        style={{
          width: 240,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <Sidebar
          lang={lang}
          setLang={setLang}
          userEmail={userEmail}
          plan={plan}
          notesCount={notesCount}
          onLogout={onLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Área de contenido ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ height: '100vh', minWidth: 0 }}
      >
        {/* Espacio para botón hamburguesa en móvil */}
        <div className="lg:hidden h-14" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* ── Botón hamburguesa (solo móvil) ── */}
      <MobileMenuButton
        open={sidebarOpen}
        onClick={() => setSidebarOpen((v) => !v)}
      />
    </div>
  );
}
