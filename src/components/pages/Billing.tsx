/**
 * Billing — Plan y Pagos
 * Plan actual + barra de uso + card de upgrade + "Próximamente Stripe"
 */
import { useState, useEffect } from 'react';
import { Crown, Zap, Check, CreditCard, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

const FREE_NOTE_LIMIT = 20;

interface BillingProps {
  lang: Lang;
  userId: string;
}

export function Billing({ lang, userId }: BillingProps) {
  const M = tm[lang];
  const es = lang === 'es';

  const [plan, setPlan]             = useState<'free' | 'pro'>('free');
  const [notesCount, setNotesCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('plan, notes_generated_count')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan === 'pro' ? 'pro' : 'free');
          setNotesCount(data.notes_generated_count ?? 0);
        }
        setLoading(false);
      });
  }, [userId]);

  const notesLeft = Math.max(0, FREE_NOTE_LIMIT - notesCount);
  const pct       = Math.min(100, (notesCount / FREE_NOTE_LIMIT) * 100);

  const barColor =
    pct >= 90 ? '#d97706' :
    pct >= 70 ? C.mustard :
    C.mustardSoft;

  const proFeatures = es
    ? ['Notas ilimitadas de por vida', 'Prioridad de respuesta de Zenty', 'Acceso anticipado a nuevas funciones', 'Soporte prioritario']
    : ['Unlimited lifetime notes', 'Priority Zenty response', 'Early access to new features', 'Priority support'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: C.mustard, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-xl space-y-6">
        {/* Header */}
        <h1
          className="text-2xl lg:text-3xl tracking-tight font-bold"
          style={{ color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.billingTitle}
        </h1>

        {/* Plan actual */}
        <div
          className="rounded-[2rem] p-6"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          <p className="text-xs uppercase tracking-wider font-semibold mb-5" style={{ color: C.brownLight }}>
            {M.billingCurrentPlan}
          </p>

          {plan === 'free' ? (
            <>
              {/* Cabecera plan free */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.creamWarm }}>
                  <Zap className="w-5 h-5" style={{ color: C.brownSoft }} />
                </div>
                <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingFreeDesc}</p>
              </div>

              {/* Barra de uso */}
              <div>
                <div className="flex justify-between text-xs mb-2" style={{ color: C.brownSoft }}>
                  <span>{M.billingUsed} {notesCount} {es ? 'notas' : 'notes'}</span>
                  <span>{notesLeft} {es ? 'restantes' : 'remaining'}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: C.creamSoft }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: C.brownLight }}>
                  {notesCount}/{FREE_NOTE_LIMIT} {es ? 'notas usadas' : 'notes used'}
                </p>
              </div>
            </>
          ) : (
            /* Plan pro */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.mustardSoft }}>
                <Crown className="w-5 h-5" style={{ color: C.mustardDark }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingProDesc}</p>
                <p className="text-sm font-semibold" style={{ color: C.mustardDark }}>{M.billingProPrice}</p>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade card (solo plan free) */}
        {plan === 'free' && (
          <div
            className="rounded-[2rem] p-6"
            style={{ background: C.brown, boxShadow: `0 8px 30px ${C.brown}30` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4" style={{ color: C.mustardSoft }} />
              <p className="font-bold text-base" style={{ color: C.cream }}>
                {M.billingUpgradeTitle}
              </p>
            </div>
            <p className="text-sm mb-5" style={{ color: C.creamWarm, opacity: 0.85 }}>
              {M.billingUpgradeDesc}
            </p>
            <ul className="space-y-2.5 mb-6">
              {proFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: C.cream }}>
                  <Check className="w-4 h-4 shrink-0" style={{ color: C.mustardSoft }} strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowComingSoon(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: C.mustardSoft, color: C.brown }}
            >
              <CreditCard className="w-4 h-4" />
              {M.billingUpgradeBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Historial de pagos */}
        <div
          className="rounded-[2rem] p-6"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: C.brownLight }}>
            {M.billingPayments}
          </p>
          <p className="text-sm" style={{ color: C.brownLight }}>
            {M.billingNoPayments}
          </p>
        </div>
      </div>

      {/* Modal: Próximamente */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(61,52,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="rounded-[2rem] w-full max-w-sm p-8 text-center"
            style={{ background: 'white', boxShadow: `0 24px 60px ${C.brown}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: C.mustardSoft }}
            >
              <Crown className="w-7 h-7" style={{ color: C.mustardDark }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: C.brown }}>
              {M.billingComingSoon}
            </h3>
            <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
              {es
                ? 'Estamos integrando Stripe. En cuanto esté listo recibirás una notificación.'
                : "We're integrating Stripe. You'll get a notification when it's ready."}
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: C.brown, color: C.cream }}
            >
              {es ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
