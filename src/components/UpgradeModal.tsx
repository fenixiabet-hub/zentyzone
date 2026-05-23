/**
 * Zentyzone — Modal de "pasar a Pro"
 * ------------------------------------------------------------
 * Aparece cuando un usuario del plan gratuito llega a su limite
 * de notas. El pago real (Stripe) se conecta mas adelante.
 * ------------------------------------------------------------
 */
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { C } from '../theme';
import type { Lang } from '../translations';

interface UpgradeModalProps {
  lang: Lang;
  onClose: () => void;
}

export function UpgradeModal({ lang, onClose }: UpgradeModalProps) {
  const es       = lang === 'es';
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61, 52, 42, 0.55)', fontFamily: "'DM Sans', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="relative rounded-[2rem] p-8 max-w-md w-full text-center"
        style={{ background: 'white', boxShadow: `0 30px 60px -15px ${C.brown}80` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 transition-opacity hover:opacity-60"
          style={{ color: C.brownLight }}
          aria-label={es ? 'Cerrar' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: C.mustardSoft }}
        >
          <Sparkles className="w-8 h-8" style={{ color: C.mustardDark }} />
        </div>

        <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: C.brown }}>
          {es ? 'Llegaste a tu límite gratis' : "You've reached your free limit"}
        </h2>
        <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
          {es
            ? 'Usaste tus 20 notas del plan gratuito. Pasa a Pro y genera notas sin límite.'
            : "You've used all 20 notes on the free plan. Go Pro for unlimited notes."}
        </p>

        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: C.cream, border: `1px solid ${C.creamWarm}` }}
        >
          <div
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: C.mustardDark, fontWeight: 600 }}
          >
            Zentyzone Pro
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl" style={{ fontWeight: 700, color: C.brown }}>
              $29
            </span>
            <span className="text-sm" style={{ color: C.brownSoft }}>
              {es ? '/mes' : '/mo'}
            </span>
          </div>
          <div className="text-sm mt-1" style={{ color: C.brownSoft }}>
            {es ? 'Notas ilimitadas' : 'Unlimited notes'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => { onClose(); navigate('/app/billing'); }}
          className="w-full py-3.5 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01]"
          style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
        >
          {es ? 'Ver planes — 5 días gratis' : 'See plans — 5 days free'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-sm"
          style={{ color: C.brownLight }}
        >
          {es ? 'Ahora no' : 'Not now'}
        </button>
      </div>
    </div>
  );
}
