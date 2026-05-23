/**
 * LimitReachedScreen — Pantalla de limite mensual de copias
 * ----------------------------------------------------------
 * Se muestra cuando el usuario del plan free ha usado sus 10
 * copias confirmadas del mes. Indica la fecha de reset y
 * ofrece el upgrade a Pro.
 *
 * (Paso 5: version basica. Paso 6: se enriquece con CTA de upgrade.)
 * ----------------------------------------------------------
 */
import { Lock, Crown } from 'lucide-react';
import { C } from '../theme';
import type { Lang } from '../translations';

interface LimitReachedScreenProps {
  lang: Lang;
  /** Fecha del proximo reset en formato 'YYYY-MM-DD'. */
  nextReset: string;
  /** Callback al hacer click en el boton de upgrade (opcional). */
  onUpgrade?: () => void;
}

export function LimitReachedScreen({ lang, nextReset, onUpgrade }: LimitReachedScreenProps) {
  const es = lang === 'es';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00Z');
      return d.toLocaleDateString(es ? 'es-US' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
      {/* Icono */}
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: C.mustardSoft }}
      >
        <Lock className="w-7 h-7" style={{ color: C.mustardDark }} />
      </div>

      {/* Titulo */}
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: C.brown, letterSpacing: '-0.01em' }}
      >
        {es ? '10 notas usadas este mes' : '10 notes used this month'}
      </h3>

      {/* Descripcion */}
      <p className="text-sm mb-2 max-w-xs" style={{ color: C.brownSoft }}>
        {es
          ? 'Tu plan gratuito incluye 10 notas confirmadas por mes.'
          : 'Your free plan includes 10 confirmed notes per month.'}
      </p>

      {/* Fecha de reset */}
      {nextReset && (
        <p className="text-sm mb-6" style={{ color: C.brownLight }}>
          {es
            ? `El contador se reinicia el ${formatDate(nextReset)}.`
            : `Counter resets on ${formatDate(nextReset)}.`}
        </p>
      )}

      {/* CTA upgrade */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: C.brown, color: C.cream }}
        >
          <Crown className="w-4 h-4" />
          {es ? 'Actualizar a Pro — notas ilimitadas' : 'Upgrade to Pro — unlimited notes'}
        </button>
      )}
    </div>
  );
}
