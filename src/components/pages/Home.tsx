/**
 * Home — Dashboard de inicio
 * Stats del mes + botón generar + últimas 3 notas
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, FileText, Zap, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

import type { PlanStatus } from '../layout/AppLayout';

/** Límite mensual de copias según plan. */
function copyLimitForPlan(p: PlanStatus): number {
  if (p === 'pro')   return Infinity;
  if (p === 'plus')  return 25;
  if (p === 'trial') return 10;
  return 0;
}

/** Etiqueta del plan para mostrar en stats. */
function planLabel(p: PlanStatus): string {
  if (p === 'pro')      return 'Pro ✦';
  if (p === 'plus')     return 'Plus ✦';
  if (p === 'trial')    return 'Trial ✦';
  if (p === 'past_due') return 'Past Due ⚠';
  return 'Cancelado';
}

interface HomeProps {
  lang: Lang;
  userId: string;
  userName: string;
}

interface RecentNote {
  id: string;
  client_initials: string | null;
  session_date: string | null;
  note_type: string;
  output_text: string;
  created_at: string;
}

const NOTE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  rbt_daily:     { label: 'RBT Daily',     bg: '#e8c478', color: '#8a6420' },
  soap:          { label: 'SOAP',          bg: '#a5ab8a', color: '#3d4a2e' },
  bcba_progress: { label: 'BCBA Progress', bg: '#ede4cd', color: '#6b5d4f' },
};

export function Home({ lang, userId, userName }: HomeProps) {
  const navigate = useNavigate();
  const M = tm[lang];
  const es = lang === 'es';

  const [plan, setPlan]                       = useState<PlanStatus>('canceled');
  const [copiesThisMonth, setCopiesThisMonth] = useState(0);
  const [monthCount, setMonthCount]           = useState(0);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    Promise.all([
      supabase.from('profiles')
        .select('subscription_status, copies_this_month')
        .eq('id', userId)
        .single(),
      supabase.from('notes')
        .select('id, client_initials, session_date, note_type, output_text, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth),
    ]).then(([profileRes, notesRes, countRes]) => {
      if (!active) return;
      if (profileRes.data) {
        setPlan((profileRes.data.subscription_status ?? 'canceled') as PlanStatus);
        setCopiesThisMonth(profileRes.data.copies_this_month ?? 0);
      }
      if (notesRes.data) setRecentNotes(notesRes.data);
      setMonthCount(countRes.count ?? 0);
      setLoading(false);
    });

    return () => { active = false; };
  }, [userId]);

  const copyLimit  = copyLimitForPlan(plan);
  const copiesLeft = plan === 'pro' ? Infinity : Math.max(0, copyLimit - copiesThisMonth);
  const minutesSaved = monthCount * 8; // minutos ahorrados ESTE mes

  const stats = [
    { label: M.homeStatsNotes,  value: monthCount,   Icon: FileText, bg: C.mustardSoft, color: C.mustardDark },
    {
      label: M.homeStatsPlan,
      value: planLabel(plan),
      Icon: Star,
      bg: plan === 'pro' ? C.oliveSoft : C.mustardSoft,
      color: plan === 'pro' ? '#3d4a2e' : C.mustardDark,
    },
    {
      label: plan === 'pro'
        ? (es ? 'Notas ilimitadas' : 'Unlimited notes')
        : (es ? 'Copias disponibles' : 'Copies available'),
      value: plan === 'pro' ? '∞' : `${copiesLeft}/${copyLimit}`,
      Icon: Zap,
      bg: plan !== 'pro' && copiesLeft === 0 ? '#fbeae5' : C.cream,
      color: plan !== 'pro' && copiesLeft === 0 ? '#b4412e' : C.brown,
    },
    { label: M.homeStatsSaved, value: minutesSaved, Icon: Clock, bg: C.creamSoft, color: C.brownSoft },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: C.mustard, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1
          className="text-2xl lg:text-3xl tracking-tight"
          style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.homeGreeting},{' '}
          <span style={{ color: C.mustardDark }}>{userName}</span>.
        </h1>
        <p className="mt-1 text-base" style={{ color: C.brownSoft }}>
          {M.homeSubtitle}
        </p>
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, bg, color }, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] p-5"
            style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}0d` }}
          >
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />
            </div>
            <div
              className="text-2xl font-bold mb-0.5"
              style={{ color: C.brown, letterSpacing: '-0.02em' }}
            >
              {value}
            </div>
            <div className="text-xs" style={{ color: C.brownLight, fontWeight: 500 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/app/new')}
        className="flex items-center gap-3 px-7 py-4 rounded-full transition-all hover:shadow-xl hover:scale-[1.01] group"
        style={{
          background: C.brown,
          color: C.cream,
          fontWeight: 600,
          boxShadow: `0 6px 20px ${C.brown}30`,
        }}
      >
        <Sparkles className="w-4 h-4" />
        {M.homeCtaBtn}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Últimas notas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: C.brown }}>
            {M.homeRecentTitle}
          </h2>
          {recentNotes.length > 0 && (
            <button
              onClick={() => navigate('/app/history')}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: C.mustardDark }}
            >
              {M.homeViewAll} →
            </button>
          )}
        </div>

        {recentNotes.length === 0 ? (
          <div
            className="rounded-[1.5rem] p-8 text-center"
            style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}0d` }}
          >
            <p className="text-sm mb-3" style={{ color: C.brownLight }}>
              {M.homeRecentEmpty}
            </p>
            <button
              onClick={() => navigate('/app/new')}
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: C.mustardDark }}
            >
              {es ? 'Generar mi primera nota ✨' : 'Generate my first note ✨'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => {
              const badge = NOTE_BADGE[note.note_type] ?? { label: note.note_type, bg: C.creamSoft, color: C.brownSoft };
              // Quita los separadores ===...=== del preview
              const preview = note.output_text.replace(/={10,}[\s\S]*?={10,}/g, '').trim().slice(0, 140);
              const dateStr = note.session_date
                ? new Date(note.session_date + 'T12:00:00').toLocaleDateString(es ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })
                : new Date(note.created_at).toLocaleDateString(es ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });

              return (
                <div
                  key={note.id}
                  className="rounded-[1.5rem] p-5"
                  style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}0d` }}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {note.client_initials && (
                      <span className="text-xs font-medium" style={{ color: C.brownLight }}>
                        {note.client_initials}
                      </span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: C.brownLight }}>
                      {dateStr}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: C.brownSoft,
                      fontFamily: "'JetBrains Mono', monospace",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {preview}…
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
