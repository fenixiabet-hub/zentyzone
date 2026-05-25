/**
 * Billing — Plan y Pagos
 * Soporta: free · trial · plus · pro · past_due · canceled
 * Botones reales de Stripe Checkout con prueba de 5 días.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, Zap, Check, CreditCard, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import { CanceledScreen } from '../CanceledScreen';
import type { Lang } from '../../translations';

const PLUS_COPY_LIMIT = 25;

interface BillingProps {
  lang: Lang;
  userId: string;
}

interface Profile {
  subscription_status: string;
  copies_this_month: number;
  notes_generated_count: number;
  pro_renewal_date: string | null;
  chosen_plan: string | null;
  trial_ends_at: string | null;
  subscription_current_period_end: string | null;
  payment_failed: boolean;
  stripe_customer_id: string | null;
}

export function Billing({ lang, userId }: BillingProps) {
  const M  = tm[lang];
  const es = lang === 'es';

  const [profile, setProfile]             = useState<Profile | null>(null);
  const [loading, setLoading]             = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError]     = useState('');
  const [manageLoading, setManageLoading]     = useState(false);
  const [searchParams]                    = useSearchParams();

  const checkoutResult = searchParams.get('checkout'); // 'success' | 'canceled'
  const checkoutPlan   = searchParams.get('plan');     // 'plus' | 'pro'
  const checkoutSessionId = searchParams.get('session_id'); // cs_test_...

  // ── Auto-sync cuando Stripe redirige con ?checkout=success ────────────────
  // Usa el session_id que Stripe pone en la URL para verificar directamente
  // el pago y actualizar el perfil. Bypass total del webhook.
  useEffect(() => {
    if (checkoutResult !== 'success' || !userId) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 4;

    const doSync = async (): Promise<boolean> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return false;

        const res = await fetch('/api/sync-subscription', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId: checkoutSessionId }),
        });
        const json = await res.json() as { synced?: boolean; status?: string };

        if (json.synced) {
          // Refrescar perfil local de Billing
          const { data } = await supabase
            .from('profiles')
            .select('subscription_status, copies_this_month, notes_generated_count, pro_renewal_date, chosen_plan, trial_ends_at, subscription_current_period_end, payment_failed, stripe_customer_id')
            .eq('id', userId)
            .single();
          if (data) setProfile(data as Profile);
          return true;
        }
        return false;
      } catch { return false; }
    };

    const retry = async () => {
      const ok = await doSync();
      if (ok) return;
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        // Reintentar con back-off: 2s, 4s, 8s
        setTimeout(retry, 2000 * attempts);
      }
    };

    retry();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult, userId, checkoutSessionId]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select(
        'subscription_status, copies_this_month, notes_generated_count, pro_renewal_date, chosen_plan, trial_ends_at, subscription_current_period_end, payment_failed, stripe_customer_id',
      )
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
        setLoading(false);
      });
  }, [userId]);

  // ── Portal de Stripe (cancelar / cambiar método de pago) ────────────────────
  const handleManageSubscription = async () => {
    setManageLoading(true);
    setCheckoutError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setCheckoutError(json.error || (es ? 'No se pudo abrir el portal.' : 'Could not open portal.'));
      }
    } catch {
      setCheckoutError(es ? 'No se pudo conectar.' : 'Could not connect.');
    } finally {
      setManageLoading(false);
    }
  };

  // ── Checkout ────────────────────────────────────────────────────────────────
  const startCheckout = async (plan: 'plus' | 'pro') => {
    setCheckoutLoading(plan);
    setCheckoutError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCheckoutError(es ? 'Sesión no válida. Vuelve a entrar.' : 'Invalid session. Please sign in again.');
        return;
      }
      const res  = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, origin: 'billing' }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setCheckoutError(
          json.error ||
          (es ? 'Error al procesar. Inténtalo de nuevo.' : 'Error processing. Please try again.'),
        );
      }
    } catch {
      setCheckoutError(
        es ? 'No se pudo conectar. Inténtalo de nuevo.' : 'Could not connect. Please try again.',
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(es ? 'es-US' : 'en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      });
    } catch { return ''; }
  };

  const daysUntil = (dateStr: string | null): number => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const _nextResetDate = (() => {
    const now = new Date();
    const d   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return d.toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  })();
  void _nextResetDate; // calculada por si se usa más adelante

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: C.mustard, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const status           = profile?.subscription_status ?? 'canceled';
  const stripeCustomerId = profile?.stripe_customer_id ?? null;

  // Pantalla de reactivación SOLO si el usuario realmente tuvo una suscripción activa antes.
  // chosen_plan solo se establece cuando el webhook checkout.session.completed confirma la
  // suscripción. Si chosen_plan es null, el usuario abrió el checkout pero lo abandonó
  // → mostrar cards de plan en lugar de CanceledScreen.
  const hadSubscription = !!profile?.chosen_plan;
  if (status === 'canceled' && stripeCustomerId && hadSubscription) {
    return <CanceledScreen lang={lang} userId={userId} onStartCheckout={startCheckout} />;
  }

  const copies          = profile?.copies_this_month   ?? 0;
  const _notesTotal     = profile?.notes_generated_count ?? 0;
  void _notesTotal;
  const trialEndsAt     = profile?.trial_ends_at        ?? null;
  const periodEnd       = profile?.subscription_current_period_end ?? null;
  const chosenPlan      = profile?.chosen_plan          ?? null;
  const trialDaysLeft   = daysUntil(trialEndsAt);

  // Durante trial, el limite refleja el plan elegido
  const isUnlimited = status === 'pro' || (status === 'trial' && chosenPlan === 'pro');
  const copyLimit   = isUnlimited ? Infinity
    : (status === 'plus' || status === 'trial') ? PLUS_COPY_LIMIT
    : 0;
  const copiesLeft = isUnlimited ? Infinity : Math.max(0, copyLimit - copies);
  const pct        = isUnlimited ? 0 : (copyLimit > 0 ? Math.min(100, (copies / copyLimit) * 100) : 0);

  const barColor = pct >= 90 ? '#d97706' : pct >= 70 ? C.mustard : C.mustardSoft;

  // ── Plan features lists ─────────────────────────────────────────────────────
  const plusFeatures = es
    ? ['25 notas confirmadas / mes', 'Soporte prioritario', 'Exportar notas', 'Acceso anticipado a nuevas funciones']
    : ['25 confirmed notes / month', 'Priority support', 'Export notes', 'Early access to new features'];

  const proFeatures = es
    ? ['Notas ilimitadas', 'Mayor capacidad de IA', 'Soporte prioritario', 'Exportar notas', 'Acceso anticipado a nuevas funciones']
    : ['Unlimited notes', 'Higher AI capacity', 'Priority support', 'Export notes', 'Early access to new features'];

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <h1 className="text-2xl lg:text-3xl tracking-tight font-bold"
        style={{ color: C.brown, letterSpacing: '-0.02em' }}>
        {M.billingTitle}
      </h1>

      {/* ── Banner: resultado del checkout ─────────────────────────────────── */}
      {checkoutResult === 'success' && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
          <Sparkles className="w-5 h-5 shrink-0" style={{ color: '#16a34a' }} />
          <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
            {es
              ? `¡Listo! Tu prueba gratuita de Plan ${checkoutPlan === 'pro' ? 'Pro' : 'Plus'} está activa. Tienes 5 días sin cobro.`
              : `Done! Your free ${checkoutPlan === 'pro' ? 'Pro' : 'Plus'} Plan trial is active. No charge for 5 days.`}
          </p>
        </div>
      )}
      {checkoutResult === 'canceled' && (
        <div className="rounded-2xl p-4" style={{ background: '#fef3c7', border: '1.5px solid #fcd34d' }}>
          <p className="text-sm" style={{ color: '#92400e' }}>
            {es ? 'Cancelaste el proceso de pago. Puedes intentarlo cuando quieras.' : 'You canceled the checkout. You can try again anytime.'}
          </p>
        </div>
      )}

      {/* ── Pago fallido ──────────────────────────────────────────────────── */}
      {status === 'past_due' && (
        <div className="rounded-2xl p-5 flex items-start gap-3"
          style={{ background: '#fbeae5', border: '1.5px solid #f97316' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#b4412e' }} />
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: '#b4412e' }}>{M.billingPastDue}</p>
            <p className="text-sm" style={{ color: '#7c2d12' }}>{M.billingPastDueDesc}</p>
          </div>
        </div>
      )}

      {/* ── Plan actual ───────────────────────────────────────────────────── */}
      <div className="rounded-[2rem] p-6" style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}>
        <p className="text-xs uppercase tracking-wider font-semibold mb-5" style={{ color: C.brownLight }}>
          {M.billingCurrentPlan}
        </p>

        {/* SIN PLAN (canceled, sin suscripción previa) */}
        {status === 'canceled' && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.creamWarm }}>
              <Zap className="w-5 h-5" style={{ color: C.brownSoft }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: C.brown }}>
                {es ? 'Sin plan activo' : 'No active plan'}
              </p>
              <p className="text-sm" style={{ color: C.brownSoft }}>
                {stripeCustomerId && !hadSubscription
                  ? (es ? 'El proceso de pago no se completó. Elige un plan para empezar.' : 'Checkout was not completed. Choose a plan to get started.')
                  : (es ? 'Elige un plan para empezar.' : 'Choose a plan to get started.')
                }
              </p>
            </div>
          </div>
        )}

        {/* TRIAL */}
        {status === 'trial' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.mustardSoft }}>
                <Crown className="w-5 h-5" style={{ color: C.mustardDark }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingTrialDesc}</p>
                <p className="text-sm font-semibold" style={{ color: C.mustardDark }}>
                  {chosenPlan === 'pro' ? 'Plan Pro' : 'Plan Plus'} —{' '}
                  {es ? `${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''}` : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`}
                </p>
                {trialEndsAt && (
                  <p className="text-xs mt-0.5" style={{ color: C.brownLight }}>
                    {M.billingTrialEnds} {formatDate(trialEndsAt)}
                  </p>
                )}
              </div>
            </div>
            {/* Barra de uso — solo si el plan trial es Plus (pro = ilimitado) */}
            {!isUnlimited && (
              <div>
                <div className="flex justify-between text-xs mb-2" style={{ color: C.brownSoft }}>
                  <span>{M.billingUsed} {copies} {es ? 'copias' : 'copies'}</span>
                  <span>{copiesLeft} {es ? 'restantes' : 'remaining'}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: C.creamSoft }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <p className="text-xs mt-1.5 text-right" style={{ color: C.brownLight }}>
                  {copies}/{PLUS_COPY_LIMIT} {es ? 'copias este mes' : 'copies this month'}
                </p>
              </div>
            )}
            {isUnlimited && (
              <p className="text-xs" style={{ color: C.mustardDark, fontWeight: 600 }}>
                {es ? 'Notas ilimitadas durante el trial' : 'Unlimited notes during trial'}
              </p>
            )}
          </>
        )}

        {/* PLUS */}
        {status === 'plus' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.mustardSoft }}>
                <Crown className="w-5 h-5" style={{ color: C.mustardDark }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingPlusDesc}</p>
                <p className="text-sm font-semibold" style={{ color: C.mustardDark }}>{M.billingPlusPrice}</p>
                {periodEnd && (
                  <p className="text-xs mt-0.5" style={{ color: C.brownLight }}>
                    {M.billingRenews}: {formatDate(periodEnd)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2" style={{ color: C.brownSoft }}>
                <span>{M.billingUsed} {copies} {es ? 'copias' : 'copies'}</span>
                <span>{copiesLeft} {es ? 'restantes' : 'remaining'}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: C.creamSoft }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <p className="text-xs mt-1.5 text-right" style={{ color: C.brownLight }}>
                {copies}/{PLUS_COPY_LIMIT} {es ? 'copias este mes' : 'copies this month'}
              </p>
            </div>
          </>
        )}

        {/* PRO */}
        {(status === 'pro' || status === 'past_due') && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.mustardSoft }}>
              <Crown className="w-5 h-5" style={{ color: C.mustardDark }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingProDesc}</p>
              <p className="text-sm font-semibold" style={{ color: C.mustardDark }}>{M.billingProPrice}</p>
              {periodEnd && status === 'pro' && (
                <p className="text-xs mt-0.5" style={{ color: C.brownLight }}>
                  {M.billingRenews}: {formatDate(periodEnd)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botón gestionar suscripción (trial / plus / pro / past_due) */}
        {(status === 'trial' || status === 'plus' || status === 'pro' || status === 'past_due') && (
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${C.creamSoft}` }}>
            {checkoutError && (
              <p className="text-xs mb-3 rounded-xl px-3 py-2"
                style={{ background: '#fbeae5', color: '#b4412e' }}>{checkoutError}</p>
            )}
            <button
              onClick={handleManageSubscription}
              disabled={manageLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: `1.5px solid ${C.creamWarm}`, color: C.brownSoft, fontWeight: 500 }}
            >
              {manageLoading ? (
                <div className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: C.brownSoft, borderTopColor: 'transparent' }} />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {es ? 'Gestionar suscripción' : 'Manage subscription'}
                </>
              )}
            </button>
            <p className="text-xs text-center mt-2" style={{ color: C.brownLight }}>
              {es
                ? 'Cancela, cambia método de pago o ve tu historial.'
                : 'Cancel, update payment method, or view history.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Planes disponibles (sin suscripción activa: nuevo o checkout abandonado) ── */}
      {(status === 'canceled' && !hadSubscription) && (
        <>
          {/* Header de la sección */}
          <div className="text-center py-2">
            <p className="text-lg font-bold" style={{ color: C.brown }}>{M.billingUpgradeTitle}</p>
            <p className="text-sm" style={{ color: C.brownSoft }}>{M.billingUpgradeDesc}</p>
          </div>

          {checkoutError && (
            <div className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: '#fbeae5', color: '#b4412e' }}>
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Plus */}
            <div className="rounded-[2rem] p-6 flex flex-col"
              style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10`, border: `1.5px solid ${C.creamWarm}` }}>
              <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: C.brownLight }}>Plus</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold" style={{ color: C.brown }}>$19.99</span>
                <span className="text-sm" style={{ color: C.brownSoft }}>{es ? '/mes' : '/mo'}</span>
              </div>
              <p className="text-xs mb-4" style={{ color: C.brownLight }}>
                {es ? '5 días gratis, luego $19.99/mes' : '5 days free, then $19.99/mo'}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {plusFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.brownSoft }}>
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.mustardDark }} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout('plus')}
                disabled={checkoutLoading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: C.brown, color: C.cream }}>
                {checkoutLoading === 'plus' ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: C.cream, borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {M.billingStartTrial}
                  </>
                )}
              </button>
            </div>

            {/* Plan Pro */}
            <div className="rounded-[2rem] p-6 flex flex-col"
              style={{ background: C.brown, boxShadow: `0 8px 30px ${C.brown}30` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-3.5 h-3.5" style={{ color: C.mustardSoft }} />
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.mustardSoft }}>Pro</p>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold" style={{ color: C.cream }}>$29.99</span>
                <span className="text-sm" style={{ color: C.creamWarm, opacity: 0.75 }}>{es ? '/mes' : '/mo'}</span>
              </div>
              <p className="text-xs mb-4" style={{ color: C.creamWarm, opacity: 0.7 }}>
                {es ? '5 días gratis, luego $29.99/mes' : '5 days free, then $29.99/mo'}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {proFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.cream }}>
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.mustardSoft }} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout('pro')}
                disabled={checkoutLoading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: C.mustardSoft, color: C.brown }}>
                {checkoutLoading === 'pro' ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: C.brown, borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {M.billingStartTrial}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: C.brownLight }}>
            {es
              ? '* Sin cobro hasta el día 6. Cancela cuando quieras.'
              : '* No charge until day 6. Cancel anytime.'}
          </p>
        </>
      )}

      {/* ── Upgrade a Pro (solo Plus) ──────────────────────────────────────── */}
      {status === 'plus' && (
        <div className="rounded-[2rem] p-6"
          style={{ background: C.brown, boxShadow: `0 8px 30px ${C.brown}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4" style={{ color: C.mustardSoft }} />
            <p className="font-bold text-base" style={{ color: C.cream }}>
              {es ? 'Actualiza a Pro — Ilimitado' : 'Upgrade to Pro — Unlimited'}
            </p>
          </div>
          <p className="text-sm mb-5" style={{ color: C.creamWarm, opacity: 0.8 }}>
            {es
              ? 'Notas ilimitadas, mayor capacidad de IA y todas las funciones futuras.'
              : 'Unlimited notes, higher AI capacity, and all future features.'}
          </p>
          {checkoutError && (
            <p className="text-xs mb-3 rounded-xl px-3 py-2"
              style={{ background: '#fbeae5', color: '#b4412e' }}>{checkoutError}</p>
          )}
          <button
            onClick={() => startCheckout('pro')}
            disabled={checkoutLoading !== null}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: C.mustardSoft, color: C.brown }}>
            {checkoutLoading === 'pro' ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: C.brown, borderTopColor: 'transparent' }} />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {es ? 'Actualizar a Pro — $29.99/mes' : 'Upgrade to Pro — $29.99/mo'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Historial de pagos ─────────────────────────────────────────────── */}
      <div className="rounded-[2rem] p-6"
        style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}>
        <p className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: C.brownLight }}>
          {M.billingPayments}
        </p>
        <p className="text-sm" style={{ color: C.brownLight }}>{M.billingNoPayments}</p>
      </div>
    </div>
  );
}
