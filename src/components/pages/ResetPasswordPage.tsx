/**
 * Zentyzone — Reset Password Page
 * ------------------------------------------------------------
 * El usuario llega aquí desde el link del email de recuperación.
 * Supabase procesa el token del hash de la URL automáticamente y
 * crea una sesión temporal. Esta página permite actualizar la
 * contraseña y redirige al dashboard.
 * Ruta: /reset-password (pública, sin RequireAuth)
 * ------------------------------------------------------------
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Logo } from '../Logo';
import { LangToggle } from '../LangToggle';
import { C } from '../../theme';
import type { Lang } from '../../translations';

const ERROR_BG = '#fbeae5';
const ERROR_FG = '#b4412e';

interface ResetPasswordPageProps {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export function ResetPasswordPage({ lang, setLang }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const es = lang === 'es';

  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [done, setDone]                   = useState(false);
  const [sessionReady, setSessionReady]   = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Supabase procesa el token del hash de la URL al montar.
  // Esperamos la sesión via onAuthStateChange o getSession().
  useEffect(() => {
    // Listener para el evento PASSWORD_RECOVERY (o SIGNED_IN con token de recuperación)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && session)
      ) {
        setSessionReady(true);
        setCheckingSession(false);
      }
      if (event === 'SIGNED_OUT') {
        setSessionReady(false);
      }
    });

    // También revisar sesión existente en caso de que el token
    // ya haya sido procesado antes de que el listener se registrara.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (newPassword.length < 8) {
      setErrorMsg(
        es
          ? 'La contraseña debe tener al menos 8 caracteres.'
          : 'Password must be at least 8 characters.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(
        es ? 'Las contraseñas no coinciden.' : 'Passwords do not match.',
      );
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMsg(
          es
            ? 'No se pudo actualizar. Inténtalo de nuevo.'
            : 'Could not update. Please try again.',
        );
      } else {
        setDone(true);
        setTimeout(() => navigate('/app'), 2000);
      }
    } catch {
      setErrorMsg(
        es
          ? 'No se pudo conectar. Revisa tu internet.'
          : 'Could not connect. Check your internet.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: C.cream, color: C.brown }}
    >
      {/* Decoración de fondo */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: C.mustardSoft, transform: 'translate(40%, -40%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: C.creamWarm, transform: 'translate(-40%, 40%)' }}
      />

      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-3"
        >
          <Logo size={40} />
          <span
            className="text-xl tracking-tight"
            style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
          >
            Zentyzone
          </span>
        </button>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <div
          className="rounded-[2rem] p-8"
          style={{ background: 'white', border: `1.5px solid ${C.creamWarm}` }}
        >
          {checkingSession ? (
            // ── Verificando link ──
            <div className="flex flex-col items-center py-10 gap-4">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: C.mustard, borderTopColor: 'transparent' }}
              />
              <p style={{ color: C.brownSoft }}>
                {es ? 'Verificando enlace...' : 'Verifying link...'}
              </p>
            </div>
          ) : !sessionReady ? (
            // ── Link inválido o expirado ──
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: ERROR_BG }}
              >
                <Lock className="w-6 h-6" style={{ color: ERROR_FG }} />
              </div>
              <h2
                className="text-xl mb-2"
                style={{ fontWeight: 700, color: C.brown }}
              >
                {es ? 'Enlace inválido o expirado' : 'Invalid or expired link'}
              </h2>
              <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
                {es
                  ? 'Este enlace ya no es válido. Solicita uno nuevo desde el inicio de sesión.'
                  : 'This link is no longer valid. Request a new one from the sign in screen.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01]"
                style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
              >
                {es ? 'Ir al inicio de sesión' : 'Go to sign in'}
              </button>
            </div>
          ) : done ? (
            // ── Contraseña actualizada ──
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: C.mustardSoft }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: C.mustardDark }} />
              </div>
              <h2
                className="text-xl mb-2"
                style={{ fontWeight: 700, color: C.brown }}
              >
                {es ? '¡Contraseña actualizada!' : 'Password updated!'}
              </h2>
              <p className="text-sm" style={{ color: C.brownSoft }}>
                {es
                  ? 'Redirigiendo a tu cuenta...'
                  : 'Redirecting to your account...'}
              </p>
            </div>
          ) : (
            // ── Formulario ──
            <>
              <div
                className="text-xs uppercase tracking-[0.2em] mb-4"
                style={{ color: C.mustardDark, fontWeight: 600 }}
              >
                — {es ? 'Recuperar acceso' : 'Recover access'}
              </div>
              <h1
                className="text-4xl tracking-tight mb-2"
                style={{
                  fontWeight: 700,
                  color: C.brown,
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                }}
              >
                {es ? 'Crea tu nueva' : 'Create your new'}
                <br />
                <span style={{ color: C.mustardDark }}>
                  {es ? 'contraseña' : 'password'}
                </span>
                .
              </h1>
              <p className="text-sm mb-8 mt-2" style={{ color: C.brownSoft }}>
                {es ? 'Mínimo 8 caracteres.' : 'Minimum 8 characters.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nueva contraseña */}
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: C.brown, fontWeight: 500 }}
                  >
                    {es ? 'Nueva contraseña' : 'New password'}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: C.brownLight }}
                    />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3.5 rounded-2xl focus:outline-none transition-all"
                      style={{
                        background: 'white',
                        border: `1.5px solid ${C.creamWarm}`,
                        color: C.brown,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                      onBlur={(e) => (e.target.style.borderColor = C.creamWarm)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: C.brownLight }}
                    >
                      {showNew ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ color: C.brown, fontWeight: 500 }}
                  >
                    {es ? 'Confirmar contraseña' : 'Confirm password'}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: C.brownLight }}
                    />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3.5 rounded-2xl focus:outline-none transition-all"
                      style={{
                        background: 'white',
                        border: `1.5px solid ${C.creamWarm}`,
                        color: C.brown,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                      onBlur={(e) => (e.target.style.borderColor = C.creamWarm)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: C.brownLight }}
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{ background: ERROR_BG, color: ERROR_FG }}
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: C.mustard,
                    color: C.brown,
                    fontWeight: 600,
                    boxShadow: `0 6px 20px ${C.mustard}40`,
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: C.brown, borderTopColor: 'transparent' }}
                      />
                      {es ? 'Actualizando...' : 'Updating...'}
                    </>
                  ) : (
                    es ? 'Actualizar contraseña' : 'Update password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Disclaimer */}
        <p
          className="text-center text-xs mt-5 px-2"
          style={{ color: C.brownLight }}
        >
          {es
            ? 'Zentyzone es un asistente de redacción. No somos clínica ni proveedor de servicios médicos.'
            : 'Zentyzone is a writing assistant. We are not a clinic or medical service provider.'}
        </p>
      </div>
    </div>
  );
}
