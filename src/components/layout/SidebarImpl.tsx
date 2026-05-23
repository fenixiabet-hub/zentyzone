/**
 * Zentyzone — Sidebar de navegación
 * ------------------------------------------------------------
 * Sidebar fijo de 240px con:
 *  - Logo arriba
 *  - 10 opciones agrupadas con separadores visuales
 *  - Estado activo: borde mostaza izquierdo + fondo suave
 *  - Hover: fondo crema
 *  - Footer fijo: email, plan, toggle de idioma, cerrar sesión
 * ------------------------------------------------------------
 */
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Sparkles,
  ClipboardList,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { C } from '../../theme';
import { Logo } from '../Logo';
import { LangToggle } from '../LangToggle';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';
import type { PlanStatus } from './AppLayout';

interface SidebarProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  userEmail: string;
  plan: PlanStatus;
  notesCount: number;
  onLogout: () => void;
  onClose?: () => void;
}

interface NavItem {
  path: string;
  Icon: LucideIcon;
  labelKey: keyof (typeof tm)['es'];
}

interface NavGroup {
  sectionKey: keyof (typeof tm)['es'];
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    sectionKey: 'sectionMain',
    items: [
      { path: '/app/home', Icon: Home, labelKey: 'navHome' },
      { path: '/app/new', Icon: Sparkles, labelKey: 'navNewNote' },
      { path: '/app/history', Icon: ClipboardList, labelKey: 'navHistory' },
    ],
  },
  {
    sectionKey: 'sectionMySpace',
    items: [
      { path: '/app/templates', Icon: FileText, labelKey: 'navTemplates' },
      { path: '/app/clients', Icon: Users, labelKey: 'navClients' },
    ],
  },
  {
    sectionKey: 'sectionHelp',
    items: [
      { path: '/app/glossary', Icon: BookOpen, labelKey: 'navGlossary' },
      { path: '/app/tutorial', Icon: GraduationCap, labelKey: 'navTutorial' },
      { path: '/app/faq', Icon: HelpCircle, labelKey: 'navFaq' },
    ],
  },
  {
    sectionKey: 'sectionAccount',
    items: [
      { path: '/app/account', Icon: Settings, labelKey: 'navAccount' },
      { path: '/app/billing', Icon: CreditCard, labelKey: 'navBilling' },
    ],
  },
];

const FREE_NOTE_LIMIT = 20;

export function Sidebar({
  lang,
  setLang,
  userEmail,
  plan,
  notesCount,
  onLogout,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const M = tm[lang];

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const isActive = (path: string) => location.pathname === path;

  const notesLeft = Math.max(0, FREE_NOTE_LIMIT - notesCount);
  const userInitial = (userEmail.charAt(0) || 'U').toUpperCase();

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        background: 'white',
        borderRight: `1px solid ${C.creamWarm}`,
        fontFamily: "'DM Sans', sans-serif",
        width: 240,
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.creamSoft}` }}
      >
        <Logo size={32} />
        <span
          className="text-base tracking-tight"
          style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
        >
          Zentyzone
        </span>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {/* Separador de sección */}
            {group.sectionKey !== 'sectionMain' && M[group.sectionKey] && (
              <div className="flex items-center gap-2 px-2 py-2 mt-2">
                <span
                  className="text-[10px] uppercase tracking-[0.12em] font-semibold whitespace-nowrap"
                  style={{ color: C.brownLight }}
                >
                  {M[group.sectionKey]}
                </span>
                <div className="flex-1 h-px" style={{ background: C.creamWarm }} />
              </div>
            )}

            {/* Items del grupo */}
            {group.items.map(({ path, Icon, labelKey }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  onClick={() => handleNav(path)}
                  className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150"
                  style={{
                    background: active ? C.mustardSoft : 'transparent',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = C.creamSoft;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Barra activa izquierda */}
                  {active && (
                    <span
                      className="absolute left-0 inset-y-2 w-[3px] rounded-r-full"
                      style={{ background: C.mustard }}
                    />
                  )}
                  <Icon
                    className="shrink-0"
                    style={{
                      width: 18,
                      height: 18,
                      color: active ? C.mustardDark : C.brownSoft,
                    }}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span
                    className="text-sm"
                    style={{
                      color: active ? C.mustardDark : C.brown,
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {M[labelKey]}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="px-4 py-4 space-y-3"
        style={{ borderTop: `1px solid ${C.creamSoft}` }}
      >
        {/* Toggle de idioma */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: C.brownLight }}>
            {lang === 'es' ? 'Idioma' : 'Language'}
          </span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Email + plan */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: C.cream }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
            style={{ background: C.mustardSoft, color: C.mustardDark }}
          >
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: C.brown }}>
              {userEmail}
            </p>
            {plan === 'free' || plan === 'canceled' ? (
              <p className="text-[11px]" style={{ color: C.brownLight }}>
                {M.planFree} · {notesLeft}/{FREE_NOTE_LIMIT} {M.notesUsed}
              </p>
            ) : plan === 'trial' ? (
              <p className="text-[11px] font-semibold" style={{ color: C.mustardDark }}>
                {M.planTrial} ✦
              </p>
            ) : plan === 'plus' ? (
              <p className="text-[11px] font-semibold" style={{ color: C.mustardDark }}>
                {M.planPlus} ✦
              </p>
            ) : plan === 'past_due' ? (
              <p className="text-[11px] font-semibold" style={{ color: '#b4412e' }}>
                {M.planPastDue} ⚠
              </p>
            ) : (
              <p className="text-[11px] font-semibold" style={{ color: C.mustardDark }}>
                {M.planPro} ✦
              </p>
            )}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors duration-150"
          style={{ color: C.brownSoft }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fbeae5';
            e.currentTarget.style.color = '#b4412e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.brownSoft;
          }}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          <span style={{ fontWeight: 500 }}>{M.logout}</span>
        </button>
      </div>
    </div>
  );
}
