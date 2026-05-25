/**
 * Zentyzone — Generador de notas (modo conversación)
 * ------------------------------------------------------------
 * El profesional escribe sus ideas crudas. Zenty puede hacerle
 * preguntas (chat) si falta información, y al final entrega la
 * nota borrosa pendiente de confirmación.
 *
 * Limites plan free:
 *   - 5/10/25 copias/mes (visible) — gestionadas en /api/confirm-copy
 *   - 50 generaciones/mes (silent) — gestionadas en /api/generate-note
 *   - 3 regeneraciones por nota antes de confirmar
 *
 * Estado de la nota: 'idle' | 'blurred' | 'confirmed'
 * Una sola variable — sin riesgo de flash entre estados.
 * ------------------------------------------------------------
 */
import { useState, useEffect } from 'react';
import { FileText, Sparkles, ArrowRight, Copy, Check, Shield, X, Send, RotateCcw } from 'lucide-react';
import { C } from '../theme';
import { t, type Lang } from '../translations';
import { sendToZenty, type ZentyMessage } from '../lib/claude';
import { supabase } from '../lib/supabase';
import type { NoteType } from '../prompts/zenty-system-prompt';
import { LimitReachedScreen } from './LimitReachedScreen';
import type { PlanStatus } from './layout/AppLayout';

// ── Constantes ───────────────────────────────────────────────
const NOTE_TYPE: NoteType = 'rbt_daily';
const REGEN_LIMIT = 3;   // regeneraciones por nota

/** Límite mensual de copias según plan (y chosen_plan durante el trial). */
function copyLimitForPlan(p: PlanStatus, chosenPlan?: string | null): number {
  if (p === 'pro' || (p === 'trial' && chosenPlan === 'pro')) return Infinity;
  if (p === 'plus' || p === 'trial') return 25;
  return 0; // canceled, past_due — bloqueados en el API
}

// ── Colores de error ─────────────────────────────────────────
const ERROR_BG = '#fbeae5';
const ERROR_FG = '#b4412e';

// ── Tipo de estado de la nota ────────────────────────────────
type NoteState = 'idle' | 'blurred' | 'confirmed';

interface NoteGeneratorProps {
  lang: Lang;
  userId: string;
  initialSessionInfo?: string;
}

export function NoteGenerator({ lang, userId, initialSessionInfo = '' }: NoteGeneratorProps) {
  const L  = t[lang];
  const es = lang === 'es';

  // ── Formulario ───────────────────────────────────────────────
  const [sessionInfo, setSessionInfo]           = useState(initialSessionInfo);
  const [clientInitials, setClientInitials]     = useState('');
  const [sessionDate, setSessionDate]           = useState(new Date().toISOString().split('T')[0]);
  const [sessionDuration, setSessionDuration]   = useState('');

  // ── Conversación y nota ──────────────────────────────────────
  const [chat, setChat]                         = useState<ZentyMessage[]>([]);
  const [generatedNote, setGeneratedNote]       = useState('');
  const [noteState, setNoteState]               = useState<NoteState>('idle');
  const [answerText, setAnswerText]             = useState('');
  const [isLoading, setIsLoading]               = useState(false);
  const [errorMsg, setErrorMsg]                 = useState('');
  const [copied, setCopied]                     = useState(false);

  // ── Confirmación y regeneración ──────────────────────────────
  const [regenerationsLeft, setRegenerationsLeft] = useState(REGEN_LIMIT);
  const [confirmLoading, setConfirmLoading]       = useState(false);

  // ── Plan y cuotas ────────────────────────────────────────────
  const [plan, setPlan]                         = useState<PlanStatus>('canceled');
  const [chosenPlan, setChosenPlan]             = useState<string | null>(null);
  const [copiesThisMonth, setCopiesThisMonth]   = useState(0);
  const [profileLoaded, setProfileLoaded]       = useState(false);

  // ── Límite mensual ───────────────────────────────────────────
  const [limitReached, setLimitReached]         = useState(false);
  const [nextReset, setNextReset]               = useState('');

  // Carga el perfil al montar.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from('profiles')
      .select('subscription_status, copies_this_month, chosen_plan')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (data && !error) {
          const status = (data.subscription_status ?? 'canceled') as PlanStatus;
          const cp = (data as { chosen_plan?: string | null }).chosen_plan ?? null;
          setPlan(status);
          setChosenPlan(cp);
          const copies = data.copies_this_month ?? 0;
          setCopiesThisMonth(copies);
          const limit = copyLimitForPlan(status, cp);
          if (limit !== Infinity && limit > 0 && copies >= limit) setLimitReached(true);
        }
        setProfileLoaded(true);
      });
    return () => { active = false; };
  }, [userId]);

  // ── Envía la conversación a Zenty ────────────────────────────
  const handleSend = async (messagesToSend: ZentyMessage[], isRegen = false) => {
    setChat(messagesToSend);
    setIsLoading(true);
    setErrorMsg('');
    // Limpiar nota anterior: noteState vuelve a 'idle' durante la carga
    setGeneratedNote('');
    setNoteState('idle');

    try {
      const sessionId = localStorage.getItem('zenty_session_id') ?? undefined;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? undefined;

      const reply = await sendToZenty({
        messages: messagesToSend,
        noteType: NOTE_TYPE,
        language: lang,
        sessionId,
        token,
      });

      if (reply.type === 'question') {
        setChat([...messagesToSend, { role: 'assistant', content: reply.content }]);
      } else {
        // Ambos en el mismo bloque síncrono — React 18+ los batchea,
        // un solo render, sin frame visible sin blur.
        setGeneratedNote(reply.content);
        setNoteState('blurred');
        if (!isRegen) setRegenerationsLeft(REGEN_LIMIT);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : es
            ? 'Algo salió mal. Inténtalo de nuevo.'
            : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Botón "Aceptar y copiar" ─────────────────────────────────
  const handleAcceptAndCopy = async () => {
    if (noteState !== 'blurred' || confirmLoading) return;
    setConfirmLoading(true);
    try {
      const sessionId = localStorage.getItem('zenty_session_id') ?? undefined;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/confirm-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId, noteContent: generatedNote, noteType: NOTE_TYPE }),
      });
      const data: {
        limitReached?: boolean; nextReset?: string;
        success?: boolean; copiesUsed?: number; error?: string;
      } = await res.json().catch(() => ({}));

      if (data.limitReached) {
        setLimitReached(true);
        setNextReset(data.nextReset ?? '');
        return;
      }
      if (data.success) {
        try { await navigator.clipboard.writeText(generatedNote); }
        catch {
          const ta = document.createElement('textarea');
          ta.value = generatedNote;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setNoteState('confirmed'); // un solo setState — sin flash posible
        setCopied(true);
        if (typeof data.copiesUsed === 'number') setCopiesThisMonth(data.copiesUsed);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setErrorMsg(data.error ?? (es ? 'No se pudo confirmar.' : 'Could not confirm.'));
      }
    } catch {
      setErrorMsg(
        es ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Please try again.',
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Botón "Regenerar" ────────────────────────────────────────
  const handleRegenerate = async () => {
    if (regenerationsLeft <= 0 || isLoading || confirmLoading) return;
    setRegenerationsLeft((r) => r - 1);
    await handleSend(chat, true); // isRegen=true: mantiene el contador decrementado
  };

  // ── Botón "Darle forma" ──────────────────────────────────────
  const handleStart = async () => {
    if (!sessionInfo.trim() || isLoading) return;
    const copyLimit = copyLimitForPlan(plan, chosenPlan);
    if (copyLimit !== Infinity && copyLimit > 0 && copiesThisMonth >= copyLimit) {
      const now = new Date();
      const nr  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      setNextReset(nr.toISOString().slice(0, 10));
      setLimitReached(true);
      return;
    }
    setLimitReached(false);
    const metaParts: string[] = [];
    if (clientInitials.trim())  metaParts.push(`Client initials: ${clientInitials.trim()}`);
    if (sessionDate)             metaParts.push(`Session date: ${sessionDate}`);
    if (sessionDuration.trim())  metaParts.push(`Duration: ${sessionDuration.trim()} minutes`);
    const meta = metaParts.length > 0 ? `${metaParts.join('\n')}\n\n` : '';
    const firstMessage: ZentyMessage = { role: 'user', content: meta + sessionInfo.trim() };
    await handleSend([firstMessage]);
  };

  // ── Botón "Responder a Zenty" ────────────────────────────────
  const handleAnswer = async () => {
    if (!answerText.trim() || isLoading) return;
    const newMessages: ZentyMessage[] = [
      ...chat,
      { role: 'user', content: answerText.trim() },
    ];
    setAnswerText('');
    await handleSend(newMessages);
  };

  // ── Botón "Empezar otra nota" ────────────────────────────────
  const handleReset = () => {
    setChat([]);
    setGeneratedNote('');
    setNoteState('idle');
    setErrorMsg('');
    setAnswerText('');
    setSessionInfo('');
    setRegenerationsLeft(REGEN_LIMIT);
    // limitReached y copiesThisMonth NO se resetean — reflejan estado real del servidor
  };

  // ── Copia manual (header, después de confirmar) ──────────────
  const handleCopyAgain = async () => {
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

  // ── Valores derivados ────────────────────────────────────────
  const copyLimit  = copyLimitForPlan(plan, chosenPlan);
  const copiesLeft = copyLimit === Infinity ? Infinity : Math.max(0, copyLimit - copiesThisMonth);
  const conversationActive = chat.length > 0 || noteState !== 'idle';
  const lastMessage        = chat[chat.length - 1];
  const awaitingAnswer     =
    !isLoading && noteState === 'idle' && chat.length > 0 && lastMessage?.role === 'assistant';

  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Banner de disclaimer permanente (no removible) ── */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-2.5 mb-5"
        style={{ background: C.mustardSoft + '60', border: `1px solid ${C.mustard}` }}
      >
        <span className="text-sm shrink-0">ℹ️</span>
        <p className="text-xs leading-relaxed" style={{ color: C.mustardDark, fontWeight: 500 }}>
          {es
            ? 'Recordatorio: Zentyzone te ayuda a redactar. Tú revisas, firmas y eres responsable del contenido final.'
            : 'Reminder: Zentyzone helps you draft. You review, sign, and are responsible for the final content.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">

        {/* ═════════ Panel de entrada ═════════ */}
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
                  style={{ background: C.cream, border: '1.5px solid transparent', color: C.brown, fontWeight: 500 }}
                  onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = C.mustard; }}
                  onBlur={(e)  => { e.target.style.background = C.cream;  e.target.style.borderColor = 'transparent'; }}
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
                  onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = C.mustard; }}
                  onBlur={(e)  => { e.target.style.background = C.cream;  e.target.style.borderColor = 'transparent'; }}
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
                onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = C.mustard; }}
                onBlur={(e)  => { e.target.style.background = C.cream;  e.target.style.borderColor = 'transparent'; }}
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
                onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = C.mustard; }}
                onBlur={(e)  => { e.target.style.background = C.cream;  e.target.style.borderColor = 'transparent'; }}
              />
            </div>

            <button
              onClick={conversationActive ? handleReset : handleStart}
              disabled={isLoading || (!conversationActive && !sessionInfo.trim())}
              className="w-full py-4 rounded-full transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              style={{
                background: C.brown,
                color: C.cream,
                fontWeight: 600,
                boxShadow:
                  isLoading || (!conversationActive && !sessionInfo.trim())
                    ? 'none'
                    : `0 6px 20px ${C.brown}30`,
              }}
            >
              {conversationActive ? (
                es ? 'Empezar otra nota' : 'Start another note'
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {L.generateBtn}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Indicador de uso mensual */}
            {profileLoaded && copyLimit !== Infinity && copyLimit > 0 && (
              <p
                className="text-center text-xs"
                style={{ color: copiesLeft === 0 ? ERROR_FG : C.brownLight }}
              >
                {es
                  ? `${copiesLeft} de ${copyLimit} copias disponibles este mes`
                  : `${copiesLeft} of ${copyLimit} copies available this month`}
              </p>
            )}
            {profileLoaded && copyLimit === Infinity && (
              <p className="text-center text-xs" style={{ color: C.mustardDark, fontWeight: 600 }}>
                {es ? 'Plan Pro · notas ilimitadas' : 'Pro plan · unlimited notes'}
              </p>
            )}
          </div>
        </section>

        {/* ═════════ Panel de Zenty ═════════ */}
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
            {/* Botón copiar del header: solo visible cuando la nota fue confirmada */}
            {generatedNote && noteState === 'confirmed' && !isLoading && (
              <button
                onClick={handleCopyAgain}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                style={
                  copied
                    ? { background: C.oliveSoft, color: '#3d4a2e', border: `1px solid ${C.olive}`, fontWeight: 600 }
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

            {/* ── Límite alcanzado ── */}
            {limitReached && noteState === 'idle' ? (
              <LimitReachedScreen lang={lang} nextReset={nextReset} />

            ) : generatedNote && !isLoading ? (
              /* ── Nota generada ── */
              <div className="flex flex-col gap-3">

                {/* ── Barra de acción ENCIMA de la nota — siempre visible ── */}
                {noteState === 'blurred' && (
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: C.mustardSoft, border: `1.5px solid ${C.mustard}`, flexShrink: 0 }}
                  >
                    <p className="text-xs font-semibold text-center" style={{ color: C.mustardDark }}>
                      {es ? '¿Todo bien? Confírmala para copiarla.' : 'Looks good? Confirm to copy it.'}
                    </p>
                    {/* Error inline de confirm-copy */}
                    {errorMsg && (
                      <p className="text-xs text-center font-semibold px-2 py-1 rounded-xl"
                         style={{ background: ERROR_BG, color: ERROR_FG }}>
                        {errorMsg}
                      </p>
                    )}

                    {/* Botón principal */}
                    <button
                      onClick={handleAcceptAndCopy}
                      disabled={confirmLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: C.brown, color: C.cream }}
                    >
                      {confirmLoading ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 rounded-full animate-spin"
                            style={{ borderColor: C.cream, borderTopColor: 'transparent' }}
                          />
                          {es ? 'Procesando...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          {es ? 'Aceptar y copiar' : 'Accept and copy'}
                        </>
                      )}
                    </button>

                    {/* Disclaimer bajo el botón de confirmar */}
                    <p className="text-xs text-center px-2" style={{ color: C.mustardDark, opacity: 0.8 }}>
                      {es
                        ? 'Al confirmar reconoces que has revisado el contenido y asumes responsabilidad clínica por la nota.'
                        : 'By confirming you acknowledge you have reviewed the content and assume clinical responsibility for the note.'}
                    </p>

                    {/* Botón secundario — desaparece al llegar a 0 */}
                    {regenerationsLeft > 0 && (
                      <button
                        onClick={handleRegenerate}
                        disabled={isLoading || confirmLoading}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ border: `1.5px solid ${C.mustard}`, color: C.mustardDark, background: 'white' }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {es
                          ? `Regenerar (${regenerationsLeft} restante${regenerationsLeft === 1 ? '' : 's'})`
                          : `Regenerate (${regenerationsLeft} left)`}
                      </button>
                    )}
                  </div>
                )}

                {/* Badge "Nota lista" — solo después de confirmar */}
                {noteState === 'confirmed' && (
                  <div
                    className="flex flex-wrap items-center gap-2 text-xs"
                    style={{ color: C.brownSoft, flexShrink: 0 }}
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
                )}

                {/* Nota scrolleable — DEBAJO de la barra de acción */}
                <div
                  style={{
                    maxHeight: '55vh',
                    overflowY: 'auto',
                    borderRadius: '1rem',
                    border: `1px solid ${C.creamWarm}`,
                    background: C.cream,
                  }}
                >
                  <pre
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      padding: '1.25rem',
                      color: C.brown,
                      whiteSpace: 'pre-wrap',
                      // Sin blur para poder leer, pero sin seleccion hasta confirmar
                      userSelect:    noteState === 'blurred' ? 'none' : 'text',
                      pointerEvents: noteState === 'blurred' ? 'none' : 'auto',
                    }}
                  >
                    {generatedNote}
                  </pre>
                </div>
              </div>

            ) : errorMsg && !isLoading ? (
              /* ── Error ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: ERROR_BG }}
                >
                  <X className="w-7 h-7" style={{ color: ERROR_FG }} strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-xl" style={{ fontWeight: 700, color: C.brown }}>
                  {es ? 'No se pudo generar' : 'Could not generate'}
                </h3>
                <p className="text-sm max-w-xs" style={{ color: C.brownSoft }}>{errorMsg}</p>
              </div>

            ) : chat.length === 0 && !isLoading ? (
              /* ── Estado vacío ── */
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

            ) : (
              /* ── Conversación con Zenty ── */
              <div className="flex-1 flex flex-col">
                <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 440 }}>
                  {chat.slice(1).map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className="max-w-[88%] rounded-2xl px-4 py-3"
                        style={{
                          background: m.role === 'assistant' ? C.creamWarm : C.brown,
                          color:      m.role === 'assistant' ? C.brown     : C.cream,
                        }}
                      >
                        <div
                          className="text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color:      m.role === 'assistant' ? C.mustardDark : C.creamWarm,
                            fontWeight: 700,
                          }}
                        >
                          {m.role === 'assistant' ? 'Zenty' : es ? 'Tú' : 'You'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-2xl px-4 py-3 flex items-center gap-2"
                        style={{ background: C.creamWarm }}
                      >
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: C.mustardDark, borderTopColor: 'transparent' }}
                        />
                        <span className="text-sm" style={{ color: C.brownSoft }}>
                          {es ? 'Zenty está pensando...' : 'Zenty is thinking...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {awaitingAnswer && (
                  <div className="mt-4 flex gap-2 items-end">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder={
                        es ? 'Escribe tu respuesta a Zenty...' : 'Type your answer to Zenty...'
                      }
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-2xl focus:outline-none transition-all resize-none text-sm leading-relaxed"
                      style={{
                        background: C.cream,
                        border: `1.5px solid ${C.creamWarm}`,
                        color: C.brown,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                      onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={!answerText.trim()}
                      className="rounded-2xl p-3.5 transition-all hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: C.brown, color: C.cream }}
                      aria-label={es ? 'Enviar' : 'Send'}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recordatorio de privacidad */}
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
    </>
  );
}
