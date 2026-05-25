/**
 * Zentyzone — Pantalla de Login (autenticacion real con Supabase)
 * ------------------------------------------------------------
 * Maneja dos modos: 'signin' (entrar) y 'signup' (crear cuenta).
 * Cuando el login tiene exito, App.tsx detecta la nueva sesion y
 * cambia automaticamente al Dashboard.
 * ------------------------------------------------------------
 */
import { useState, type SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { C } from '../theme';
import { t, type Lang } from '../translations';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';

// Colores para los mensajes de error.
const ERROR_BG = '#fbeae5';
const ERROR_FG = '#b4412e';

type Mode = 'signin' | 'signup';

// Colores de la caja de disclaimer
const DISC_BG  = '#fef9ec';
const DISC_BD  = '#d4a544';

/** Traduce los mensajes de error de Supabase a algo claro y amable. */
function authError(message: string, lang: Lang): string {
  const m = message.toLowerCase();
  const es = lang === 'es';
  if (m.includes('invalid login credentials')) {
    return es ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.';
  }
  if (m.includes('email not confirmed')) {
    return es
      ? 'Aún no confirmaste tu correo. Revisa tu bandeja de entrada (y la carpeta de spam).'
      : "You haven't confirmed your email yet. Check your inbox (and spam folder).";
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return es
      ? 'Ese correo ya tiene una cuenta. Cambia a "Entrar".'
      : 'That email already has an account. Switch to "Sign in".';
  }
  if (m.includes('password')) {
    return es
      ? 'La contraseña debe tener al menos 6 caracteres.'
      : 'Password must be at least 6 characters.';
  }
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return es ? 'El correo no es válido.' : 'The email address is not valid.';
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('seconds')) {
    return es
      ? 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
      : 'Too many attempts. Please wait a moment and try again.';
  }
  return es
    ? 'No se pudo completar. Inténtalo de nuevo.'
    : 'Could not complete. Please try again.';
}

interface LoginProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  onBackToLanding: () => void;
}

export function Login({ lang, setLang, onBackToLanding }: LoginProps) {
  const L = t[lang];
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [signupDone, setSignupDone] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [forgotView, setForgotView] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionTaken = searchParams.get('reason') === 'session_taken';
  const es = lang === 'es';

  const handleSubmit = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg(
        lang === 'es'
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Password must be at least 6 characters.',
      );
      return;
    }
    if (mode === 'signup' && !termsAccepted) {
      setErrorMsg(
        lang === 'es'
          ? 'Debes confirmar que entiendes los términos antes de crear tu cuenta.'
          : 'You must confirm you understand the terms before creating your account.',
      );
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        // ── Pre-check: verificar email duplicado via endpoint propio ──────────
        // Más robusto que el check de identities (funciona con o sin
        // mailer_autoconfirm y sin depender del comportamiento anti-enumeration).
        try {
          const checkRes = await fetch('/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });
          if (checkRes.ok) {
            const { exists } = await checkRes.json() as { exists: boolean };
            if (exists) {
              setErrorMsg(
                lang === 'es'
                  ? 'Ese correo ya tiene una cuenta. Cambia a "Entrar" o usa "¿Olvidaste tu contraseña?".'
                  : 'That email already has an account. Sign in or use "Forgot your password?".',
              );
              setLoading(false);
              return;
            }
          }
        } catch {
          // Fail-open: si el check falla, continuar con signUp normal
          // (el check de identities de Supabase actúa como fallback)
        }

        const siteUrl =
          (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: siteUrl,
            data: {
              terms_accepted_at: new Date().toISOString(),
              terms_version: 'v1.0',
            },
          },
        });
        if (error) {
          setErrorMsg(authError(error.message, lang));
        } else if (data.user?.identities && data.user.identities.length === 0) {
          // Supabase devuelve un usuario con identities vacio cuando
          // el correo YA estaba registrado.
          setErrorMsg(
            lang === 'es'
              ? 'Ese correo ya tiene una cuenta. Cambia a "Entrar".'
              : 'That email already has an account. Switch to "Sign in".',
          );
        } else {
          // Guardar terms_accepted_at en profiles si el user fue creado
          if (data.user) {
            await supabase.from('profiles').update({
              terms_accepted_at: new Date().toISOString(),
              terms_version: 'v1.0',
            }).eq('id', data.user.id);
          }
          setSignupDone(true);
        }
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setErrorMsg(authError(error.message, lang));
        } else if (signInData.user) {
          const sessionId = crypto.randomUUID();
          // Escribir en localStorage ANTES del await para que useSessionGuard
          // encuentre el ID correcto si se monta durante la escritura a DB.
          // onAuthStateChange(SIGNED_IN) dispara antes de que llegue aquí,
          // pero React batchea el re-render, así que este setItem es síncrono
          // y ocurre antes de que el dashboard monte.
          localStorage.setItem('zenty_session_id', sessionId);
          await supabase
            .from('profiles')
            .update({
              active_session_id: sessionId,
              last_login_at: new Date().toISOString(),
            })
            .eq('id', signInData.user.id);
        }
        // Si tiene exito, App.tsx detecta la sesion y muestra el Dashboard.
      }
    } catch {
      setErrorMsg(
        lang === 'es'
          ? 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.'
          : 'Could not connect. Check your internet and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setErrorMsg('');
    setTermsAccepted(false);
    setForgotView(false);
    setForgotSent(false);
  };

  const handleForgot = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const siteUrl =
        (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) {
        setErrorMsg(authError(error.message, lang));
      } else {
        setForgotSent(true);
      }
    } catch {
      setErrorMsg(
        es ? 'No se pudo conectar. Inténtalo de nuevo.' : 'Could not connect. Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: C.cream, color: C.brown }}
    >
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: C.mustardSoft, transform: 'translate(40%, -40%)' }}
      />

      <div className="flex-1 flex flex-col px-6 lg:px-16 py-8 relative z-10">
        <div className="flex items-center justify-between mb-12">
          <button onClick={onBackToLanding} className="flex items-center gap-3">
            <Logo size={42} />
            <span
              className="text-xl tracking-tight"
              style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
            >
              Zentyzone
            </span>
          </button>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {/* ── Banner: sesión cerrada por seguridad ── */}
            {sessionTaken && (
              <div
                className="rounded-xl p-5 mb-6 flex items-start gap-3"
                style={{ background: C.mustardSoft + '50', border: `1.5px solid ${C.mustard}` }}
              >
                <ShieldAlert className="w-7 h-7 shrink-0 mt-0.5" style={{ color: C.mustardDark }} />
                <div>
                  <h3 className="font-bold text-base mb-1.5" style={{ color: C.brown }}>
                    {es ? 'Sesión cerrada por seguridad' : 'Session closed for security'}
                  </h3>
                  <p className="text-sm mb-1.5" style={{ color: C.brownSoft }}>
                    {es
                      ? 'Detectamos un nuevo inicio de sesión desde otro dispositivo. Por seguridad de la información clínica que manejas, Zentyzone solo permite una sesión activa a la vez.'
                      : 'We detected a new login from another device. For the security of the clinical information you handle, Zentyzone only allows one active session at a time.'}
                  </p>
                  <p className="text-sm" style={{ color: C.brownSoft }}>
                    {es
                      ? 'Si fuiste tú, ignora este mensaje. Si no reconoces esta actividad, cambia tu contraseña inmediatamente.'
                      : "If it was you, ignore this message. If you don't recognize this activity, change your password immediately."}
                  </p>
                </div>
              </div>
            )}

            {forgotView ? (
              // ----- Vista de recuperar contraseña -----
              forgotSent ? (
                // --- Pantalla "email enviado" (reset) ---
                <div
                  className="rounded-[2rem] p-8 text-center"
                  style={{ background: 'white', border: `1.5px solid ${C.creamWarm}` }}
                >
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: C.mustardSoft }}
                  >
                    <Mail className="w-7 h-7" style={{ color: C.mustardDark }} />
                  </div>
                  <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: C.brown }}>
                    {es ? 'Revisa tu correo' : 'Check your email'}
                  </h2>
                  <p className="text-sm mb-2" style={{ color: C.brownSoft }}>
                    {es
                      ? 'Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.'
                      : 'If that email has an account, we sent you a link to create a new password. Check your spam folder too.'}
                  </p>
                  <p className="text-sm mb-6" style={{ color: C.mustardDark, fontWeight: 600 }}>
                    {email}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotView(false); setForgotSent(false); setErrorMsg(''); }}
                    className="w-full py-3.5 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01]"
                    style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
                  >
                    {es ? 'Volver al inicio de sesión' : 'Back to sign in'}
                  </button>
                </div>
              ) : (
                // --- Formulario "olvidé contraseña" ---
                <>
                  <button
                    type="button"
                    onClick={() => { setForgotView(false); setErrorMsg(''); }}
                    className="flex items-center gap-2 mb-6 text-sm hover:opacity-70 transition-opacity"
                    style={{ color: C.brownSoft }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {es ? 'Volver' : 'Back'}
                  </button>
                  <div
                    className="text-xs uppercase tracking-[0.2em] mb-4"
                    style={{ color: C.mustardDark, fontWeight: 600 }}
                  >
                    — {es ? 'Recuperar acceso' : 'Recover access'}
                  </div>
                  <h1
                    className="text-4xl md:text-5xl tracking-tight mb-3"
                    style={{
                      fontWeight: 700,
                      color: C.brown,
                      lineHeight: 1.1,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {es ? '¿Olvidaste tu' : 'Forgot your'}
                    <br />
                    <span style={{ color: C.mustardDark }}>
                      {es ? 'contraseña?' : 'password?'}
                    </span>
                  </h1>
                  <p className="mb-10" style={{ color: C.brownSoft }}>
                    {es
                      ? 'Ingresa tu correo y te enviamos un enlace para crear una nueva contraseña.'
                      : "Enter your email and we'll send you a link to create a new password."}
                  </p>
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label
                        className="block text-sm mb-2"
                        style={{ color: C.brown, fontWeight: 500 }}
                      >
                        {es ? 'Correo' : 'Email'}
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: C.brownLight }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@ejemplo.com"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none transition-all"
                          style={{
                            background: 'white',
                            border: `1.5px solid ${C.creamWarm}`,
                            color: C.brown,
                          }}
                          onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                          onBlur={(e) => (e.target.style.borderColor = C.creamWarm)}
                          required
                        />
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
                      disabled={loading || !email.trim()}
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
                          {es ? 'Enviando...' : 'Sending...'}
                        </>
                      ) : (
                        es ? 'Enviar instrucciones' : 'Send instructions'
                      )}
                    </button>
                  </form>
                </>
              )
            ) : signupDone ? (
              // ----- Pantalla "revisa tu correo" -----
              <div
                className="rounded-[2rem] p-8 text-center"
                style={{ background: 'white', border: `1.5px solid ${C.creamWarm}` }}
              >
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: C.mustardSoft }}
                >
                  <Mail className="w-7 h-7" style={{ color: C.mustardDark }} />
                </div>
                <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: C.brown }}>
                  {L.checkEmailTitle}
                </h2>
                <p className="text-sm mb-2" style={{ color: C.brownSoft }}>
                  {L.checkEmailDesc}
                </p>
                <p className="text-sm mb-6" style={{ color: C.mustardDark, fontWeight: 600 }}>
                  {email}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSignupDone(false);
                    setMode('signin');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className="w-full py-3.5 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01]"
                  style={{ background: C.brown, color: C.cream, fontWeight: 600 }}
                >
                  {L.signIn}
                </button>
              </div>
            ) : (
              // ----- Formulario de entrar / crear cuenta -----
              <>
                <div
                  className="text-xs uppercase tracking-[0.2em] mb-4"
                  style={{ color: C.mustardDark, fontWeight: 600 }}
                >
                  — {mode === 'signin' ? L.welcomeBack : L.createAccount}
                </div>
                <h1
                  className="text-4xl md:text-5xl tracking-tight mb-3"
                  style={{
                    fontWeight: 700,
                    color: C.brown,
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {L.loginTitle1}
                  <br />
                  <span style={{ color: C.mustardDark }}>{L.loginTitle2}</span>.
                </h1>
                <p className="mb-10" style={{ color: C.brownSoft }}>
                  {L.loginSubtitle}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      className="block text-sm mb-2"
                      style={{ color: C.brown, fontWeight: 500 }}
                    >
                      {L.email}
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: C.brownLight }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@ejemplo.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none transition-all"
                        style={{
                          background: 'white',
                          border: `1.5px solid ${C.creamWarm}`,
                          color: C.brown,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                        onBlur={(e) => (e.target.style.borderColor = C.creamWarm)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm" style={{ color: C.brown, fontWeight: 500 }}>
                        {L.password}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setForgotView(true); setErrorMsg(''); }}
                          className="text-xs hover:opacity-70 transition-opacity"
                          style={{ color: C.mustardDark, fontWeight: 500 }}
                        >
                          {es ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: C.brownLight }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: C.brownLight }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox de disclaimer — solo en modo signup */}
                  {mode === 'signup' && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: DISC_BG, border: `1.5px solid ${DISC_BD}` }}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 shrink-0 w-4 h-4 rounded"
                          style={{ accentColor: C.mustardDark }}
                        />
                        <span className="text-xs leading-relaxed" style={{ color: C.brown }}>
                          {es ? (
                            <>
                              Confirmo que entiendo que:{' '}
                              <strong>Zentyzone es un asistente de redacción, NO una clínica ni un proveedor de servicios médicos.</strong>{' '}
                              Soy 100% responsable de revisar, validar y firmar cada nota antes de usarla profesionalmente.
                              Soy responsable de la información que ingreso y de cumplir con las leyes de mi estado.
                              Acepto los{' '}
                              <a href="/terms" target="_blank" rel="noopener noreferrer"
                                style={{ color: C.mustardDark, fontWeight: 600 }}>
                                Términos de Servicio
                              </a>{' '}
                              y la{' '}
                              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                                style={{ color: C.mustardDark, fontWeight: 600 }}>
                                Política de Privacidad
                              </a>.
                            </>
                          ) : (
                            <>
                              I confirm I understand that:{' '}
                              <strong>Zentyzone is a writing assistant, NOT a clinic or medical service provider.</strong>{' '}
                              I am 100% responsible for reviewing, validating, and signing each note before professional use.
                              I am responsible for the information I enter and for complying with the laws of my state.
                              I accept the{' '}
                              <a href="/terms" target="_blank" rel="noopener noreferrer"
                                style={{ color: C.mustardDark, fontWeight: 600 }}>
                                Terms of Service
                              </a>{' '}
                              and{' '}
                              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                                style={{ color: C.mustardDark, fontWeight: 600 }}>
                                Privacy Policy
                              </a>.
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  )}

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
                    className="w-full py-4 rounded-2xl transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    style={{
                      background: C.brown,
                      color: C.cream,
                      fontWeight: 600,
                      boxShadow: `0 6px 20px ${C.brown}30`,
                    }}
                  >
                    {loading ? (
                      <>
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: C.cream, borderTopColor: 'transparent' }}
                        ></div>
                        {lang === 'es' ? 'Un momento...' : 'One moment...'}
                      </>
                    ) : (
                      <>
                        {mode === 'signup' ? L.createAccount : L.signIn}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm mt-2" style={{ color: C.brownSoft }}>
                    {mode === 'signin' ? L.newHere : L.haveAccount}{' '}
                    <button
                      type="button"
                      onClick={handleToggleMode}
                      style={{ color: C.mustardDark, fontWeight: 600 }}
                    >
                      {mode === 'signin' ? L.createAccount : L.signIn}
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div
        className="hidden lg:flex flex-1 p-16 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.mustard} 0%, ${C.mustardDark} 100%)` }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ background: C.cream, transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: C.olive, transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full">
          <div
            className="text-xs uppercase tracking-[0.25em]"
            style={{ color: C.cream, fontWeight: 600, opacity: 0.8 }}
          >
            — {L.sideKicker}
          </div>
          <div>
            {/* Decorative sun rays */}
            <div className="mb-8 opacity-70">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill={C.cream} />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"
                  stroke={C.cream}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <blockquote
              className="text-3xl xl:text-4xl leading-tight mb-8"
              style={{ color: C.cream, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.015em' }}
            >
              "{L.sideQuote}"
            </blockquote>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: C.cream, color: C.mustardDark, fontWeight: 700 }}
              >
                A
              </div>
              <div className="text-sm">
                <div style={{ color: C.cream, fontWeight: 600 }}>{L.sideName}</div>
                <div style={{ color: C.cream, opacity: 0.7 }}>{L.sideOrg}</div>
              </div>
            </div>
          </div>
          <div className="text-xs" style={{ color: C.cream, opacity: 0.5 }}>
            © 2026 Zentyzone · made with care
          </div>
        </div>
      </div>
    </div>
  );
}
