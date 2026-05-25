/**
 * CanceledScreen — Pantalla de suscripción cancelada
 * ----------------------------------------------------------
 * Se muestra cuando subscription_status === 'canceled' y el
 * usuario tuvo una suscripción previa (chosen_plan != null).
 * Ofrece: portal Stripe para reactivar OR nuevo checkout.
 * ----------------------------------------------------------
 */
import { useState } from 'react';
import { XCircle, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { C } from '../theme';
import type { Lang } from '../translations';

interface CanceledScreenProps {
  lang: Lang;
  userId: string;
  onStartCheckout?: (plan: 'plus' | 'pro') => void;
}

export function CanceledScreen({ lang, userId, onStartCheckout }: CanceledScreenProps) {
  const es = lang === 'es';
  const [loading, setLoading]           = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError]               = useState('');

  // Suppress unused variable warning
  void userId;

  const openPortal = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(es ? 'Sesión no válida. Recarga la página.' : 'Invalid session. Reload the page.');
        return;
      }
      const res  = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || (es ? 'Error al abrir el portal.' : 'Error opening portal.'));
      }
    } catch {
      setError(es ? 'No se pudo conectar. Inténtalo de nuevo.' : 'Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: 'plus' | 'pro') => {
    if (onStartCheckout) {
      // Si Billing pasa el handler, lo usamos directamente
      onStartCheckout(plan);
      return;
    }
    // Fallback: llamar checkout inline
    setCheckoutLoading(plan);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(es ? 'Sesión no válida. Vuelve a entrar.' : 'Invalid session. Please sign in again.');
        return;
      }
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan, origin: 'billing' }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || (es ? 'Error al procesar.' : 'Error processing.'));
      }
    } catch {
      setError(es ? 'No se pudo conectar.' : 'Could not connect.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
      {/* Icono */}
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: '#fbeae5' }}
      >
        <XCircle className="w-7 h-7" style={{ color: '#b4412e' }} />
      </div>

      {/* Título */}
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: C.brown, letterSpacing: '-0.01em' }}
      >
        {es ? 'Suscripción cancelada' : 'Subscription canceled'}
      </h3>

      {/* Descripción */}
      <p className="text-sm mb-6 max-w-xs" style={{ color: C.brownSoft }}>
        {es
          ? 'Tu suscripción ha sido cancelada. Reactiva tu plan o elige uno nuevo para seguir generando notas.'
          : 'Your subscription has been canceled. Reactivate or choose a new plan to keep generating notes.'}
      </p>

      {error && (
        <p className="text-sm mb-4 px-4 py-2 rounded-xl"
          style={{ background: '#fbeae5', color: '#b4412e' }}>
          {error}
        </p>
      )}

      {/* CTA 1: Reactivar via portal */}
      <button
        onClick={openPortal}
        disabled={loading || checkoutLoading !== null}
        className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 mb-3"
        style={{ background: C.brown, color: C.cream }}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: C.cream, borderTopColor: 'transparent' }} />
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            {es ? 'Reactivar suscripción' : 'Reactivate subscription'}
          </>
        )}
      </button>

      <p className="text-xs mb-6" style={{ color: C.brownLight }}>
        {es
          ? 'Se abrirá el portal de Stripe para gestionar tu suscripción.'
          : "Stripe's portal will open to manage your subscription."}
      </p>

      {/* Separador */}
      <div className="flex items-center gap-3 w-full max-w-xs mb-6">
        <div className="flex-1 h-px" style={{ background: C.creamWarm }} />
        <span className="text-xs" style={{ color: C.brownLight }}>
          {es ? 'o empieza de nuevo' : 'or start fresh'}
        </span>
        <div className="flex-1 h-px" style={{ background: C.creamWarm }} />
      </div>

      {/* CTA 2: Nuevo checkout Plus */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => handleCheckout('plus')}
          disabled={loading || checkoutLoading !== null}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ border: `1.5px solid ${C.brown}`, color: C.brown, background: 'white' }}
        >
          {checkoutLoading === 'plus' ? (
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: C.brown, borderTopColor: 'transparent' }} />
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5" />
              Plus — $19.99
            </>
          )}
        </button>
        <button
          onClick={() => handleCheckout('pro')}
          disabled={loading || checkoutLoading !== null}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: C.brown, color: C.cream }}
        >
          {checkoutLoading === 'pro' ? (
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: C.cream, borderTopColor: 'transparent' }} />
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5" />
              Pro — $29.99
            </>
          )}
        </button>
      </div>
      <p className="text-xs mt-3" style={{ color: C.brownLight }}>
        {es ? '5 días gratis · Sin cobro hasta el día 6.' : '5 days free · No charge until day 6.'}
      </p>
    </div>
  );
}
