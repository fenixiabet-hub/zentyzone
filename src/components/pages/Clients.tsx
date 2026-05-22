/**
 * Clients — Mis Clientes
 * Lista clientes con conteo de notas y última sesión.
 * Agregar / borrar cliente. Solo iniciales (máx 4 chars).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, ArrowRight, X, Check, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface ClientsProps {
  lang: Lang;
  userId: string;
}

interface ClientRow {
  id: string;
  initials: string;
  programs: string;
  created_at: string;
  notesCount: number;
  lastSession: string | null;
}

const EMPTY_FORM = { initials: '', programs: '' };

export function Clients({ lang, userId }: ClientsProps) {
  const M = tm[lang];
  const es = lang === 'es';
  const navigate = useNavigate();

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal agregar
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [formError, setFormError] = useState('');

  // ── Cargar clientes + stats de notas ──────────────────────
  const loadClients = async () => {
    setLoading(true);

    const [{ data: clientsData }, { data: notesData }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, initials, programs, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select('client_initials, session_date, created_at')
        .eq('user_id', userId),
    ]);

    const rows: ClientRow[] = (clientsData ?? []).map((c) => {
      const clientNotes = (notesData ?? []).filter(
        (n) => (n.client_initials ?? '').toUpperCase().trim() === c.initials.toUpperCase().trim()
      );
      const dates = clientNotes
        .map((n) => n.session_date ?? n.created_at)
        .filter(Boolean)
        .sort()
        .reverse();

      return {
        id: c.id,
        initials: c.initials,
        programs: c.programs ?? '',
        created_at: c.created_at,
        notesCount: clientNotes.length,
        lastSession: dates[0] ?? null,
      };
    });

    setClients(rows);
    setLoading(false);
  };

  useEffect(() => { if (userId) loadClients(); }, [userId]);

  // ── Modal ──────────────────────────────────────────────────
  const openModal = () => {
    setForm(EMPTY_FORM);
    setSaveOk(false);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Guardar cliente ────────────────────────────────────────
  const handleSave = async () => {
    const ini = form.initials.trim().toUpperCase();
    if (!ini) { setFormError(es ? 'Las iniciales son obligatorias.' : 'Initials are required.'); return; }
    if (ini.length > 4) { setFormError(es ? 'Máximo 4 caracteres.' : 'Maximum 4 characters.'); return; }
    if (clients.some(c => c.initials.toUpperCase() === ini)) {
      setFormError(es ? 'Ya existe un cliente con esas iniciales.' : 'A client with those initials already exists.');
      return;
    }

    setSaving(true);
    setFormError('');
    await supabase.from('clients').insert({
      user_id: userId,
      initials: ini,
      programs: form.programs.trim(),
    });
    await loadClients();
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => { closeModal(); setSaveOk(false); }, 900);
  };

  // ── Borrar cliente ─────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return; }
    await supabase.from('clients').delete().eq('id', id);
    setDeletingId(null);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ── Formato de fecha ───────────────────────────────────────
  const fmtDate = (iso: string) =>
    new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
      es ? 'es-ES' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    );

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: C.mustard, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl lg:text-3xl tracking-tight font-bold"
            style={{ color: C.brown, letterSpacing: '-0.02em' }}
          >
            {M.clientsTitle}
          </h1>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: C.brown, color: C.cream }}
          >
            <Plus className="w-4 h-4" />
            {M.clientsNew}
          </button>
        </div>

        {/* Estado vacío */}
        {clients.length === 0 ? (
          <div
            className="rounded-[2rem] p-10 text-center"
            style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
          >
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: C.creamWarm }}
            >
              <Users className="w-7 h-7" style={{ color: C.brownSoft }} />
            </div>
            <p className="text-sm leading-relaxed max-w-xs mx-auto mb-5" style={{ color: C.brownSoft }}>
              {M.clientsEmpty}
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: C.mustardSoft, color: C.brown }}
            >
              <Plus className="w-4 h-4" />
              {M.clientsNew}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isConfirming = deletingId === client.id;
              return (
                <div
                  key={client.id}
                  className="rounded-[1.75rem] p-5"
                  style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}10` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: C.mustardSoft, color: C.mustardDark }}
                    >
                      {client.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-base" style={{ color: C.brown }}>
                          {client.initials}
                        </p>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 rounded-xl shrink-0 transition-all hover:opacity-70"
                          style={{ background: isConfirming ? '#fbeae5' : C.creamSoft }}
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: isConfirming ? '#b4412e' : C.brownLight }} />
                        </button>
                      </div>

                      {client.programs && (
                        <p className="text-xs mb-2 truncate" style={{ color: C.brownSoft }}>
                          <span className="font-medium">{M.clientsPrograms}:</span> {client.programs}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs" style={{ color: C.brownLight }}>
                          <span className="font-semibold" style={{ color: C.brown }}>{client.notesCount}</span>{' '}
                          {M.clientsNotes.toLowerCase()}
                        </span>
                        {client.lastSession && (
                          <span className="text-xs" style={{ color: C.brownLight }}>
                            {M.clientsLastSession}: <span className="font-medium">{fmtDate(client.lastSession)}</span>
                          </span>
                        )}
                      </div>

                      {/* Confirm delete or action */}
                      {isConfirming ? (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="flex-1 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background: C.creamSoft, color: C.brownSoft }}
                          >
                            {es ? 'Cancelar' : 'Cancel'}
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="flex-1 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background: '#fbeae5', color: '#b4412e' }}
                          >
                            {es ? 'Sí, borrar' : 'Yes, delete'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate('/app/history')}
                          className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-70"
                          style={{ color: C.mustardDark }}
                        >
                          {es ? 'Ver notas' : 'View notes'}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hint HIPAA */}
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: C.oliveSoft }}
        >
          <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3d4a2e' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#3d4a2e' }}>
            {M.clientsHipaaHint}
          </p>
        </div>
      </div>

      {/* ── Modal agregar cliente ──────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(61,52,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-[2rem] w-full max-w-sm p-6 space-y-5"
            style={{ background: 'white', boxShadow: `0 24px 60px ${C.brown}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: C.brown }}>
                {es ? 'Agregar cliente' : 'Add client'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:opacity-70" style={{ background: C.creamSoft }}>
                <X className="w-4 h-4" style={{ color: C.brownSoft }} />
              </button>
            </div>

            {/* Iniciales */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.brownSoft }}>
                {M.clientsInitials} <span style={{ color: C.mustardDark }}>*</span>
              </label>
              <input
                type="text"
                maxLength={4}
                value={form.initials}
                onChange={(e) => { setForm(f => ({ ...f, initials: e.target.value.toUpperCase() })); setFormError(''); }}
                placeholder="J.M."
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider focus:outline-none"
                style={{ background: C.cream, border: `1.5px solid ${formError ? '#b4412e' : C.creamWarm}`, color: C.brown }}
                onFocus={(e) => (e.target.style.borderColor = formError ? '#b4412e' : C.mustard)}
                onBlur={(e)  => (e.target.style.borderColor = formError ? '#b4412e' : C.creamWarm)}
              />
              {formError && <p className="text-xs mt-1" style={{ color: '#b4412e' }}>{formError}</p>}
              <p className="text-xs mt-1" style={{ color: C.brownLight }}>
                {M.clientsHipaaHint}
              </p>
            </div>

            {/* Programas */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.brownSoft }}>
                {M.clientsPrograms}
              </label>
              <input
                type="text"
                value={form.programs}
                onChange={(e) => setForm(f => ({ ...f, programs: e.target.value }))}
                placeholder={es ? 'Ej: DTT, NET, Manding' : 'E.g. DTT, NET, Manding'}
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: C.cream, border: `1.5px solid ${C.creamWarm}`, color: C.brown }}
                onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            {/* Guardar */}
            <button
              onClick={handleSave}
              disabled={saving || !form.initials.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={saveOk
                ? { background: C.oliveSoft, color: '#3d4a2e' }
                : { background: C.brown, color: C.cream }}
            >
              {saveOk && <Check className="w-4 h-4" strokeWidth={2.5} />}
              {saving
                ? (es ? 'Guardando…' : 'Saving…')
                : saveOk
                  ? (es ? '¡Agregado!' : 'Added!')
                  : (es ? 'Agregar cliente' : 'Add client')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
