/**
 * Account — Mi Cuenta
 * Nombre editable, email, idioma, cambio de contraseña, logout
 */
import { useState, useEffect } from 'react';
import { User, Mail, Lock, LogOut, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LangToggle } from '../LangToggle';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface AccountProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

export function Account({ lang, setLang, userEmail, onLogout }: AccountProps) {
  const M = tm[lang];
  const es = lang === 'es';

  const [name, setSavedName]      = useState('');
  const [draft, setDraft]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showPwModal, setShowPwModal]     = useState(false);
  const [pwResetSent, setPwResetSent]     = useState(false);
  const [sendingReset, setSendingReset]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const n =
        data.user?.user_metadata?.name ??
        data.user?.user_metadata?.full_name ??
        '';
      setSavedName(n);
      setDraft(n);
    });
  }, []);

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === name || saving) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { name: draft.trim() } });
    setSavedName(draft.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordReset = async () => {
    setSendingReset(true);
    await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/app/account`,
    });
    setSendingReset(false);
    setPwResetSent(true);
  };

  const initial = (userEmail.charAt(0) || 'U').toUpperCase();
  const displayName = name || userEmail.split('@')[0];

  return (
    <>
      <div className="max-w-xl space-y-6">
        {/* Header */}
        <h1
          className="text-2xl lg:text-3xl tracking-tight font-bold"
          style={{ color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.accountTitle}
        </h1>

        {/* Avatar + identidad */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: C.mustardSoft, color: C.mustardDark }}
          >
            {initial}
          </div>
          <div>
            <p className="font-semibold" style={{ color: C.brown }}>{displayName}</p>
            <p className="text-sm" style={{ color: C.brownLight }}>{userEmail}</p>
          </div>
        </div>

        {/* Formulario */}
        <div
          className="rounded-[2rem] p-6 space-y-5"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          {/* Email (solo lectura) */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: C.brownSoft }}
            >
              <Mail className="w-3 h-3" />
              {M.accountEmail}
            </label>
            <div
              className="px-4 py-3 rounded-2xl text-sm font-medium"
              style={{ background: C.creamSoft, color: C.brownSoft }}
            >
              {userEmail}
            </div>
          </div>

          {/* Nombre (editable) */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: C.brownSoft }}
            >
              <User className="w-3 h-3" />
              {M.accountName}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={userEmail.split('@')[0]}
                className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all"
                style={{ background: C.cream, border: `1.5px solid ${C.creamWarm}`, color: C.brown }}
                onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={handleSave}
                disabled={saving || !draft.trim() || draft.trim() === name}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={saved
                  ? { background: C.oliveSoft, color: '#3d4a2e' }
                  : { background: C.brown, color: C.cream }}
              >
                {saved && <Check className="w-4 h-4" strokeWidth={2.5} />}
                {saving ? (es ? 'Guardando…' : 'Saving…') : saved ? M.accountSaved : M.accountSave}
              </button>
            </div>
          </div>

          {/* Idioma */}
          <div>
            <label
              className="block text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: C.brownSoft }}
            >
              {M.accountLanguage}
            </label>
            <LangToggle lang={lang} setLang={setLang} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.creamSoft }} />

          {/* Cambiar contraseña */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: C.brownSoft }}
            >
              <Lock className="w-3 h-3" />
              {M.accountPassword}
            </label>
            <button
              onClick={() => setShowPwModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: C.creamSoft, color: C.brown }}
            >
              <Lock className="w-4 h-4" />
              {M.accountPasswordBtn}
            </button>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: '#fbeae5', color: '#b4412e' }}
        >
          <LogOut className="w-4 h-4" />
          {M.accountLogout}
        </button>
      </div>

      {/* Modal: cambio de contraseña */}
      {showPwModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(61,52,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setShowPwModal(false); setPwResetSent(false); }}
        >
          <div
            className="rounded-[2rem] w-full max-w-sm p-8"
            style={{ background: 'white', boxShadow: `0 24px 60px ${C.brown}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: C.brown }}>
              {M.accountPasswordBtn}
            </h3>

            {pwResetSent ? (
              <div className="text-center py-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: C.oliveSoft }}
                >
                  <Check className="w-5 h-5 text-[#3d4a2e]" strokeWidth={2.5} />
                </div>
                <p className="text-sm mb-4" style={{ color: C.brownSoft }}>
                  {es
                    ? `Enviamos un enlace a ${userEmail}. Revisa tu bandeja (y spam).`
                    : `We sent a link to ${userEmail}. Check your inbox (and spam).`}
                </p>
                <button
                  onClick={() => { setShowPwModal(false); setPwResetSent(false); }}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: C.brown, color: C.cream }}
                >
                  {es ? 'Cerrar' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-6" style={{ color: C.brownSoft }}>
                  {es
                    ? `Te enviaremos un email a ${userEmail} con instrucciones para cambiar tu contraseña.`
                    : `We'll send an email to ${userEmail} with instructions to change your password.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPwModal(false)}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold"
                    style={{ background: C.creamSoft, color: C.brownSoft }}
                  >
                    {es ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                    style={{ background: C.brown, color: C.cream }}
                  >
                    {sendingReset
                      ? (es ? 'Enviando…' : 'Sending…')
                      : (es ? 'Enviar email' : 'Send email')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
