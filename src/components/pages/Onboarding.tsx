/**
 * Zentyzone — Onboarding obligatorio
 * Pantalla de eleccion de plan para nuevos usuarios.
 * Se muestra antes de entrar a la app y obliga a elegir Plus o Pro
 * con trial de 5 dias. No hay opcion de saltar.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Crown, CreditCard, Check, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { Logo } from '../Logo';
import type { Lang } from '../../translations';

interface OnboardingProps {
  userId: string;
  userEmail: string;
  lang: Lang;
}

export function Onboarding({ userId, userEmail, lang }: OnboardingProps) {
  const es = lang === 'es';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutResult = searchParams.get('checkout'); // 'success' | 'canceled'
  const checkoutPlan   = searchParams.get('plan');

  const [checkoutLoading, setCheckoutLoading] = useState<'plus' | 'pro' | null>(null);
  const [checkoutError, setCheckoutError]     = useState('');
  const [polling, setPolling]                 = useState(false);
  const [pollFailed, setPollFailed]           = useState(false);

  // Si ya tiene plan activo, redirigir directo a la app
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        const s = data?.subscription_status;
        if (s && s !== 'free') {
          navigate('/app/home', { replace: true });
        }
      });
  }, [userId, navigate]);

  // Polling al volver de Stripe checkout exitoso
  useEffect(() => {
    if (checkoutResult !== 'success') return;

    setPolling(true);
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', userId)
          .single();

        if (data?.subscription_status && data.subscription_status !== 'free') {
          navigate('/app/home', { replace: true });
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setPolling(false);
          setPollFailed(true);
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 3000);
        else { setPolling(false); setPollFailed(true); }
      }
    };

    setTimeout(poll, 2000);
  }, [checkoutResult, userId, navigate]);

  const startCheckout = async (plan: 'plus' | 'pro') => {
    setCheckoutLoading(plan);
    setCheckoutError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCheckoutError(es ? 'Sesión no válida. Recarga la página.' : 'Invalid session. Reload the page.');
        return;
      }
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, origin: 'onboarding' }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setCheckoutError(
          json.error || (es ? 'Error al procesar. Inténtalo de nuevo.' : 'Error. Please try again.'),
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

  const plusFeatures = es
    ? ['25 notas confirmadas / mes', 'Soporte prioritario', 'Exportar notas', 'Acceso anticipado a nuevas funciones']
    : ['25 confirmed notes / month', 'Priority support', 'Export notes', 'Early access to new features'];

  const proFeatures = es
    ? ['Notas ilimitadas', 'Mayor capacidad de IA', 'Soporte prioritario', 'Exportar notas', 'Acceso anticipado']
    : ['Unlimited notes', 'Higher AI capacity', 'Priority support', 'Export notes', 'Early access'];

  // ── Estado: esperando activación tras checkout ─────────────────────────
  if (checkoutResult === 'success' && polling) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: C.cream, fontFamily: "'DM Sans', sans-serif" }}
      >
        <Logo size={52} />
        <div className="mt-8 text-center max-w-sm">
          <div
            className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-5"
            style={{ borderColor: C.mustard, borderTopColor: 'transparent' }}
          />
          <h2 className="text-xl font-bold mb-2" style={{ color: C.brown }}>
            {es ? 'Activando tu prueba...' : 'Activating your trial...'}
          </h2>
          <p className="text-sm" style={{ color: C.brownSoft }}>
            {es
              ? 'Un momento, estamos configurando tu cuenta.'
              : "One moment, we're setting up your account."}
          </p>
        </div>
      </div>
    );
  }

  if (checkoutResult === 'success' && pollFailed) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: C.cream, fontFamily: "'DM Sans', sans-serif" }}
      >
        <Logo size={52} />
        <div className="mt-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2" style={{ color: C.brown }}>
            {es ? '¡Suscripción recibida!' : 'Subscription received!'}
          </h2>
          <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
            {es
              ? `Tu ${checkoutPlan === 'pro' ? 'Plan Pro' : 'Plan Plus'} fue procesado. La activación puede tomar unos minutos.`
              : `Your ${checkoutPlan === 'pro' ? 'Pro' : 'Plus'} Plan was processed. Activation may take a few minutes.`}
          </p>
          <button
            onClick={() => navigate('/app/home', { replace: true })}
            className="px-6 py-3 rounded-2xl font-semibold transition-all hover:opacity-90"
            style={{ background: C.brown, color: C.cream }}
          >
            {es ? 'Entrar a la app' : 'Enter the app'}
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla principal: selección de plan ──────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: C.cream, fontFamily: "'DM Sans', sans-serif", color: C.brown }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-12 py-5 border-b"
        style={{ borderColor: C.creamWarm }}>
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-base font-bold" style={{ color: C.brown }}>Zentyzone</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: C.brownSoft }}>
            {userEmail}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-70"
            style={{ color: C.brownSoft, border: `1px solid ${C.creamWarm}` }}
          >
            {es ? 'Salir' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">

          {/* Cancelado */}
          {checkoutResult === 'canceled' && (
            <div
              className="rounded-2xl px-4 py-3 mb-6 text-sm"
              style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', color: '#92400e' }}
            >
              {es
                ? 'Cancelaste el proceso. Elige un plan cuando estés listo.'
                : "You canceled. Choose a plan whenever you're ready."}
            </div>
          )}

          {/* Título */}
          <div className="text-center mb-8">
            <div
              className="text-xs uppercase tracking-[0.2em] font-semibold mb-3"
              style={{ color: C.mustardDark }}
            >
              — {es ? 'Bienvenido a Zentyzone' : 'Welcome to Zentyzone'}
            </div>
            <h1
              className="text-3xl lg:text-4xl font-bold tracking-tight mb-3"
              style={{ color: C.brown, letterSpacing: '-0.02em' }}
            >
              {es ? 'Elige tu plan para empezar' : 'Choose your plan to get started'}
            </h1>
            <p className="text-sm" style={{ color: C.brownSoft }}>
              {es
                ? '5 días completamente gratis. Sin cobro hasta el día 6. Cancela cuando quieras.'
                : '5 days completely free. No charge until day 6. Cancel anytime.'}
            </p>
          </div>

          {checkoutError && (
            <div
              className="rounded-2xl px-4 py-3 mb-5 text-sm"
              style={{ background: '#fbeae5', color: '#b4412e' }}
            >
              {checkoutError}
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

            {/* Plus */}
            <div
              className="rounded-[2rem] p-6 flex flex-col"
              style={{
                background: 'white',
                boxShadow: `0 4px 20px ${C.mustardDark}10`,
                border: `1.5px solid ${C.creamWarm}`,
              }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: C.brownLight }}>Plus</p>
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
                style={{ background: C.brown, color: C.cream }}
              >
                {checkoutLoading === 'plus' ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: C.cream, borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {es ? 'Comenzar prueba gratis' : 'Start free trial'}
                  </>
                )}
              </button>
            </div>

            {/* Pro */}
            <div
              className="rounded-[2rem] p-6 flex flex-col"
              style={{ background: C.brown, boxShadow: `0 8px 30px ${C.brown}30` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-3.5 h-3.5" style={{ color: C.mustardSoft }} />
                <p className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: C.mustardSoft }}>Pro</p>
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
                style={{ background: C.mustardSoft, color: C.brown }}
              >
                {checkoutLoading === 'pro' ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: C.brown, borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {es ? 'Comenzar prueba gratis' : 'Start free trial'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: C.brownLight }}>
            {es
              ? '* Sin cobro hasta el día 6. Cancela antes del cobro y no se te cobra nada.'
              : '* No charge until day 6. Cancel before then and pay nothing.'}
          </p>
        </div>
      </div>
    </div>
  );
}
