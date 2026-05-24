/**
 * CanceledScreen — Pantalla de suscripción cancelada
 * ----------------------------------------------------------
 * Se muestra cuando subscription_status === 'canceled'.
 * Ofrece botón para reactivar vía Stripe Customer Portal.
 * ----------------------------------------------------------
 */
import { useState } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { C } from '../theme';
import type { Lang } from '../translations';

interface CanceledScreenProps {
  lang: Lang;
  userId: string;
}

export function CanceledScreen({ lang, userId }: CanceledScreenProps) {
  const es = lang === 'es';
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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

  // Suppress unused variable warning
  void userId;

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
          ? 'Tu suscripción ha sido cancelada. Reactiva tu plan para seguir generando notas.'
          : 'Your subscription has been canceled. Reactivate your plan to keep generating notes.'}
      </p>

      {error && (
        <p className="text-sm mb-4 px-4 py-2 rounded-xl"
          style={{ background: '#fbeae5', color: '#b4412e' }}>
          {error}
        </p>
      )}

      {/* CTA Reactivar */}
      <button
        onClick={openPortal}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
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

      <p className="text-xs mt-4" style={{ color: C.brownLight }}>
        {es
          ? 'Se abrirá el portal de Stripe para gestionar tu suscripción.'
          : "Stripe's portal will open to manage your subscription."}
      </p>
    </div>
  );
}
