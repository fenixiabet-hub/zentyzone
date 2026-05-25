/**
 * Zentyzone — Modal de disclaimer de primera sesión
 * Se muestra la primera vez que el usuario entra a la app (después del signup).
 * NO se puede cerrar sin clic en "Entiendo y acepto".
 * Guarda onboarding_disclaimer_acknowledged_at en Supabase.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { C } from '../theme';
import type { Lang } from '../translations';

interface DisclaimerModalProps {
  lang: Lang;
  userId: string;
  onAcknowledged: () => void;
}

export function DisclaimerModal({ lang, userId, onAcknowledged }: DisclaimerModalProps) {
  const es = lang === 'es';
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_disclaimer_acknowledged_at: new Date().toISOString() })
        .eq('id', userId);
    } catch {
      // Si falla el update, igual dejamos pasar — el usuario ya vio el disclaimer
    } finally {
      setSaving(false);
      onAcknowledged();
    }
  };

  return (
    /* Backdrop — no-click-to-close intencional */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(61,52,42,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-[2rem] p-8"
        style={{
          background: 'white',
          boxShadow: `0 24px 80px ${C.brown}30`,
          fontFamily: "'DM Sans', sans-serif",
          color: C.brown,
        }}
      >
        {/* Icono */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: C.mustardSoft }}
        >
          <span className="text-xl">👋</span>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: C.brown, letterSpacing: '-0.01em' }}>
          {es ? 'Bienvenido a Zentyzone' : 'Welcome to Zentyzone'}
        </h2>
        <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
          {es
            ? 'Antes de empezar, queremos que tengas claras 3 cosas:'
            : 'Before you start, we want 3 things to be crystal clear:'}
        </p>

        {/* Puntos clave */}
        <div className="space-y-4 mb-7">
          {[
            {
              icon: '✍️',
              title: es ? 'Somos una herramienta de redacción.' : 'We are a writing tool.',
              desc: es
                ? 'No somos clínica, doctores ni terapeutas. Solo te ayudamos con la estructura inicial del texto.'
                : 'We are not a clinic, doctors, or therapists. We only help with the initial text structure.',
            },
            {
              icon: '✅',
              title: es ? 'Tú revisas, ajustas y firmas.' : 'You review, adjust, and sign.',
              desc: es
                ? 'Zentyzone genera un borrador. La responsabilidad clínica y la autoría profesional son tuyas.'
                : 'Zentyzone generates a draft. Clinical responsibility and professional authorship are yours.',
            },
            {
              icon: '⚖️',
              title: es ? 'Tu responsabilidad profesional sigue siendo tuya.' : 'Your professional responsibility remains yours.',
              desc: es
                ? 'Cumplir con tu BACB, agencia, HIPAA y leyes locales es tu deber. Zentyzone no valida el contenido generado.'
                : 'Complying with your BACB, agency, HIPAA, and local laws is your duty. Zentyzone does not validate generated content.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: C.brown }}>
                  {item.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: C.brownSoft }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Links legales */}
        <p className="text-xs mb-6" style={{ color: C.brownLight }}>
          {es
            ? 'Al continuar aceptas nuestros '
            : 'By continuing you accept our '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.mustardDark, fontWeight: 600 }}>
            {es ? 'Términos de Servicio' : 'Terms of Service'}
          </a>
          {es ? ' y ' : ' and '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.mustardDark, fontWeight: 600 }}>
            {es ? 'Política de Privacidad' : 'Privacy Policy'}
          </a>.
        </p>

        {/* Botón — único cierre posible */}
        <button
          onClick={handleAccept}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: C.brown, color: C.cream }}
        >
          {saving ? (
            <>
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: C.cream, borderTopColor: 'transparent' }}
              />
              {es ? 'Guardando...' : 'Saving...'}
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              {es ? 'Entiendo y acepto' : 'I understand and agree'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
