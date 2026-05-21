/**
 * Zentyzone — Generador de notas
 * ------------------------------------------------------------
 * Es el corazon de la app: el RBT/BCBA escribe sus ideas crudas y
 * el boton llama a Claude (a traves de src/lib/claude.ts) para
 * convertirlas en un borrador de nota clinica.
 *
 * Tambien aplica el limite del plan gratuito: 20 notas de por vida.
 * Al llegar al limite muestra el modal para pasar a Pro.
 * ------------------------------------------------------------
 */
import { useState, useEffect } from 'react';
import { FileText, Sparkles, ArrowRight, Copy, Check, Shield, X } from 'lucide-react';
import { C } from '../theme';
import { t, type Lang } from '../translations';
import { generateNote } from '../lib/claude';
import { supabase } from '../lib/supabase';
import type { NoteType } from '../prompts/zenty-system-prompt';
import { UpgradeModal } from './UpgradeModal';

// Tipo de nota fijo por ahora: RBT Daily.
// Cuando agreguemos el selector de tipo de nota en la interfaz,
// esto pasara a ser un estado seleccionable por el usuario.
const NOTE_TYPE: NoteType = 'rbt_daily';

// Limite de notas del plan gratuito (de por vida).
const FREE_NOTE_LIMIT = 20;

// Colores para el estado de error (no estan en la paleta principal).
const ERROR_BG = '#fbeae5';
const ERROR_FG = '#b4412e';

interface NoteGeneratorProps {
  lang: Lang;
  userId: string;
}

export function NoteGenerator({ lang, userId }: NoteGeneratorProps) {
  const L = t[lang];
  const [sessionInfo, setSessionInfo] = useState('');
  const [clientInitials, setClientInitials] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [sessionDuration, setSessionDuration] = useState('');
  const [generatedNote, setGeneratedNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Datos del plan del usuario (cargados desde la tabla profiles).
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [notesCount, setNotesCount] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Al montar el componente, cargamos el perfil del usuario.
  useEffect(() => {
    // Sin un userId valido no consultamos (evita peticiones "undefined").
    if (!userId) return;
    let active = true;
    supabase
      .from('profiles')
      .select('plan, notes_generated_count')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (data && !error) {
          setPlan(data.plan === 'pro' ? 'pro' : 'free');
          setNotesCount(
            typeof data.notes_generated_count === 'number'
              ? data.notes_generated_count
              : 0,
          );
        }
        setProfileLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // Guarda la nota en el historial y aumenta el contador del usuario.
  // Nota: por simplicidad esto se hace desde el navegador; mas adelante
  // se puede mover al servidor para que el limite no se pueda evadir.
  const saveNoteAndIncrement = async (note: string) => {
    try {
      const durationValue = sessionDuration.trim() ? Number(sessionDuration) : null;
      await supabase.from('notes').insert({
        user_id: userId,
        client_initials: clientInitials.trim() || null,
        session_date: sessionDate || null,
        duration_minutes:
          durationValue !== null && !Number.isNaN(durationValue) ? durationValue : null,
        note_type: NOTE_TYPE,
        input_text: sessionInfo.trim(),
        output_text: note,
      });

      const newCount = notesCount + 1;
      const { error } = await supabase
        .from('profiles')
        .update({ notes_generated_count: newCount })
        .eq('id', userId);
      if (!error) setNotesCount(newCount);
    } catch {
      // Si falla guardar el historial no bloqueamos al usuario:
      // la nota ya se genero y se muestra en pantalla.
    }
  };

  const handleGenerateNote = async () => {
    if (!sessionInfo.trim() || isGenerating) return;

    // Limite del plan gratuito: si ya uso sus 20 notas, mostrar el modal.
    if (plan === 'free' && notesCount >= FREE_NOTE_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedNote('');
    setErrorMsg('');

    try {
      // Combinamos los datos de la sesion con el texto crudo para
      // darle a Zenty todo el contexto en un solo bloque.
      const metaParts: string[] = [];
      if (clientInitials.trim()) metaParts.push(`Client initials: ${clientInitials.trim()}`);
      if (sessionDate) metaParts.push(`Session date: ${sessionDate}`);
      if (sessionDuration.trim()) {
        metaParts.push(`Duration: ${sessionDuration.trim()} minutes`);
      }
      const meta = metaParts.length > 0 ? `${metaParts.join('\n')}\n\n` : '';

      const note = await generateNote({
        inputText: meta + sessionInfo.trim(),
        noteType: NOTE_TYPE,
        language: lang,
      });
      setGeneratedNote(note);

      // La nota se genero con exito: guardarla y contar +1.
      await saveNoteAndIncrement(note);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === 'es'
            ? 'Algo salio mal. Intentalo de nuevo.'
            : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedNote) return;
    try {
      await navigator.clipboard.writeText(generatedNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedNote;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const notesLeft = Math.max(0, FREE_NOTE_LIMIT - notesCount);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Input panel */}
        <section
          className="rounded-[2rem] overflow-hidden flex flex-col"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.creamSoft}` }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: C.mustardDark }} />
              <h2 className="text-sm" style={{ color: C.brown, fontWeight: 600 }}>
                {L.sessionInput}
              </h2>
            </div>
            <span
              className="text-xs"
              style={{ color: C.brownLight, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {sessionInfo.length} {L.chars}
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: C.brownSoft, fontWeight: 600 }}
                >
                  {L.clientInitials}
                </label>
                <input
                  type="text"
                  value={clientInitials}
                  onChange={(e) => setClientInitials(e.target.value.toUpperCase())}
                  placeholder="J.D."
                  maxLength={6}
                  className="w-full px-3 py-2.5 rounded-2xl focus:outline-none transition-all"
                  style={{
                    background: C.cream,
                    border: '1.5px solid transparent',
                    color: C.brown,
                    fontWeight: 500,
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = C.mustard;
                  }}
                  onBlur={(e) => {
                    e.target.style.background = C.cream;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: C.brownSoft, fontWeight: 600 }}
                >
                  {L.duration}
                </label>
                <input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2.5 rounded-2xl focus:outline-none transition-all"
                  style={{ background: C.cream, border: '1.5px solid transparent', color: C.brown }}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = C.mustard;
                  }}
                  onBlur={(e) => {
                    e.target.style.background = C.cream;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: C.brownSoft, fontWeight: 600 }}
              >
                {L.sessionDate}
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl focus:outline-none transition-all"
                style={{ background: C.cream, border: '1.5px solid transparent', color: C.brown }}
                onFocus={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = C.mustard;
                }}
                onBlur={(e) => {
                  e.target.style.background = C.cream;
                  e.target.style.borderColor = 'transparent';
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: C.brownSoft, fontWeight: 600 }}
              >
                {L.sessionDescription}
              </label>
              <textarea
                value={sessionInfo}
                onChange={(e) => setSessionInfo(e.target.value)}
                placeholder={L.sessionPlaceholder}
                rows={11}
                className="w-full px-4 py-3.5 rounded-2xl focus:outline-none transition-all resize-none leading-relaxed"
                style={{
                  background: C.cream,
                  border: '1.5px solid transparent',
                  color: C.brown,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = C.mustard;
                }}
                onBlur={(e) => {
                  e.target.style.background = C.cream;
                  e.target.style.borderColor = 'transparent';
                }}
              />
            </div>

            <button
              onClick={handleGenerateNote}
              disabled={!sessionInfo.trim() || isGenerating}
              className="w-full py-4 rounded-full transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              style={{
                background: C.brown,
                color: C.cream,
                fontWeight: 600,
                boxShadow: !sessionInfo.trim() || isGenerating ? 'none' : `0 6px 20px ${C.brown}30`,
              }}
            >
              {isGenerating ? (
                <>
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: C.cream, borderTopColor: 'transparent' }}
                  ></div>
                  {L.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {L.generateBtn}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Indicador de uso del plan */}
            {profileLoaded && plan === 'free' && (
              <p className="text-center text-xs" style={{ color: C.brownLight }}>
                {lang === 'es'
                  ? `Te quedan ${notesLeft} de ${FREE_NOTE_LIMIT} notas gratis`
                  : `${notesLeft} of ${FREE_NOTE_LIMIT} free notes left`}
              </p>
            )}
            {profileLoaded && plan === 'pro' && (
              <p
                className="text-center text-xs"
                style={{ color: C.mustardDark, fontWeight: 600 }}
              >
                {lang === 'es' ? 'Plan Pro · notas ilimitadas' : 'Pro plan · unlimited notes'}
              </p>
            )}
          </div>
        </section>

        {/* Output panel */}
        <section
          className="rounded-[2rem] overflow-hidden flex flex-col"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.creamSoft}` }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: C.mustardDark }} />
              <h2 className="text-sm" style={{ color: C.brown, fontWeight: 600 }}>
                {L.generatedNote}
              </h2>
            </div>
            {generatedNote && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                style={
                  copied
                    ? {
                        background: C.oliveSoft,
                        color: '#3d4a2e',
                        border: `1px solid ${C.olive}`,
                        fontWeight: 600,
                      }
                    : { background: C.brown, color: C.cream, fontWeight: 600 }
                }
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {L.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {L.copyNote}
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 p-6 min-h-[400px] flex flex-col">
            {!generatedNote && !isGenerating && !errorMsg && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: C.cream }}
                >
                  <FileText className="w-7 h-7" style={{ color: C.brownLight }} strokeWidth={1.5} />
                </div>
                <h3
                  className="mb-2 text-xl"
                  style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.01em' }}
                >
                  {L.emptyTitle}
                </h3>
                <p className="text-sm max-w-xs mb-6" style={{ color: C.brownSoft }}>
                  {L.emptyDesc}
                </p>
                <div
                  className="px-4 py-2 rounded-full"
                  style={{
                    background: C.creamSoft,
                    fontFamily: "'Caveat', cursive",
                    fontSize: '1.2rem',
                    color: C.mustardDark,
                  }}
                >
                  {L.breathe}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="relative mb-5">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center"
                    style={{ background: C.creamSoft }}
                  >
                    <Sparkles className="w-7 h-7 animate-pulse" style={{ color: C.mustardDark }} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-3xl border-2 animate-spin"
                    style={{ borderColor: C.mustard, borderTopColor: 'transparent' }}
                  ></div>
                </div>
                <h3 className="mb-2 text-xl" style={{ fontWeight: 700, color: C.brown }}>
                  {L.draftingTitle}
                </h3>
                <p className="text-sm" style={{ color: C.brownSoft }}>
                  {L.draftingDesc}
                </p>
              </div>
            )}

            {errorMsg && !isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: ERROR_BG }}
                >
                  <X className="w-7 h-7" style={{ color: ERROR_FG }} strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-xl" style={{ fontWeight: 700, color: C.brown }}>
                  {lang === 'es' ? 'No se pudo generar' : 'Could not generate'}
                </h3>
                <p className="text-sm max-w-xs" style={{ color: C.brownSoft }}>
                  {errorMsg}
                </p>
              </div>
            )}

            {generatedNote && !isGenerating && (
              <div className="flex-1">
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed p-5 rounded-2xl"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: C.cream,
                    color: C.brown,
                    border: `1px solid ${C.creamWarm}`,
                  }}
                >
                  {generatedNote}
                </pre>
                <div
                  className="mt-4 flex flex-wrap items-center gap-2 text-xs"
                  style={{ color: C.brownSoft }}
                >
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{ background: C.oliveSoft, color: '#3d4a2e', fontWeight: 600 }}
                  >
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    {L.noteReady}
                  </span>
                  <span>{L.noteReview}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Privacy reminder */}
      <div
        className="mt-6 rounded-[2rem] p-5 flex items-start gap-3"
        style={{ background: C.mustardSoft, border: `1px solid ${C.mustard}` }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'white' }}
        >
          <Shield className="w-4 h-4" style={{ color: C.mustardDark }} />
        </div>
        <div className="text-sm" style={{ color: C.mustardDark }}>
          <strong style={{ fontWeight: 700 }}>{L.privacyTitle}</strong>{' '}
          <span style={{ opacity: 0.85 }}>{L.privacyDesc}</span>
        </div>
      </div>

      {/* Modal de upgrade (aparece al llegar al limite del plan free) */}
      {showUpgradeModal && (
        <UpgradeModal lang={lang} onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}
