/**
 * Templates — Plantillas de sesión
 * Lista, crea, edita y borra plantillas.
 * "Usar plantilla" navega a /app/new con el contenido pre-cargado.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, FileText, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface TemplatesProps {
  lang: Lang;
  userId: string;
}

type NoteType = 'rbt_daily' | 'soap' | 'bcba_progress';

interface Template {
  id: string;
  title: string;
  note_type: NoteType;
  content: string;
  created_at: string;
}

const NOTE_LABELS: Record<NoteType, { label: string; bg: string; color: string }> = {
  rbt_daily:     { label: 'RBT Daily',     bg: '#e8c478', color: '#8a6420' },
  soap:          { label: 'SOAP',          bg: '#a5ab8a', color: '#3d4a2e' },
  bcba_progress: { label: 'BCBA Progress', bg: '#ede4cd', color: '#6b5d4f' },
};

const EMPTY_FORM = { title: '', note_type: 'rbt_daily' as NoteType, content: '' };

export function Templates({ lang, userId }: TemplatesProps) {
  const M = tm[lang];
  const es = lang === 'es';
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal de crear/editar
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [saveOk, setSaveOk]         = useState(false);

  // ── Cargar plantillas ──────────────────────────────────────
  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('templates')
      .select('id, title, note_type, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setTemplates((data as Template[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (userId) loadTemplates(); }, [userId]);

  // ── Abrir modal ────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setSaveOk(false);
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ title: t.title, note_type: t.note_type, content: t.content });
    setSaveOk(false);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); };

  // ── Guardar ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    if (editId) {
      await supabase
        .from('templates')
        .update({ title: form.title.trim(), note_type: form.note_type, content: form.content.trim() })
        .eq('id', editId);
    } else {
      await supabase
        .from('templates')
        .insert({ user_id: userId, title: form.title.trim(), note_type: form.note_type, content: form.content.trim() });
    }

    await loadTemplates();
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => { closeModal(); setSaveOk(false); }, 900);
  };

  // ── Borrar ─────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return; }
    await supabase.from('templates').delete().eq('id', id);
    setDeletingId(null);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // ── Usar plantilla ─────────────────────────────────────────
  const handleUse = (t: Template) => {
    navigate('/app/new', { state: { templateContent: t.content } });
  };

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
            {M.templatesTitle}
          </h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: C.brown, color: C.cream }}
          >
            <Plus className="w-4 h-4" />
            {M.templatesNew}
          </button>
        </div>

        {/* Estado vacío */}
        {templates.length === 0 ? (
          <div
            className="rounded-[2rem] p-10 text-center"
            style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
          >
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: C.mustardSoft }}
            >
              <FileText className="w-7 h-7" style={{ color: C.mustardDark }} />
            </div>
            <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: C.brownSoft }}>
              {M.templatesEmpty}
            </p>
            <button
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: C.mustardSoft, color: C.brown }}
            >
              <Plus className="w-4 h-4" />
              {M.templatesNew}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => {
              const badge = NOTE_LABELS[tpl.note_type];
              const isConfirming = deletingId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className="rounded-[1.75rem] p-5"
                  style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}10` }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: C.brown }}>
                        {tpl.title}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(tpl)}
                        className="p-2 rounded-xl transition-all hover:opacity-70"
                        style={{ background: C.creamSoft }}
                        title={M.templatesEdit}
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: C.brownSoft }} />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-2 rounded-xl transition-all hover:opacity-70"
                        style={{ background: isConfirming ? '#fbeae5' : C.creamSoft }}
                        title={isConfirming ? (es ? '¿Confirmar?' : 'Confirm?') : M.templatesDelete}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: isConfirming ? '#b4412e' : C.brownSoft }} />
                      </button>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p
                    className="text-xs leading-relaxed mb-4"
                    style={{
                      color: C.brownLight,
                      fontFamily: "'JetBrains Mono', monospace",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tpl.content}
                  </p>

                  {/* Confirm delete or Use button */}
                  {isConfirming ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex-1 py-2 rounded-full text-xs font-semibold"
                        style={{ background: C.creamSoft, color: C.brownSoft }}
                      >
                        {es ? 'Cancelar' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="flex-1 py-2 rounded-full text-xs font-semibold"
                        style={{ background: '#fbeae5', color: '#b4412e' }}
                      >
                        {es ? 'Sí, borrar' : 'Yes, delete'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUse(tpl)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: C.mustardSoft, color: C.brown }}
                    >
                      {M.templatesUse}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal crear / editar ────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(61,52,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-[2rem] w-full max-w-lg p-6 space-y-5"
            style={{ background: 'white', boxShadow: `0 24px 60px ${C.brown}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: C.brown }}>
                {editId
                  ? (es ? 'Editar plantilla' : 'Edit template')
                  : (es ? 'Nueva plantilla' : 'New template')}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:opacity-70" style={{ background: C.creamSoft }}>
                <X className="w-4 h-4" style={{ color: C.brownSoft }} />
              </button>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.brownSoft }}>
                {M.templatesName}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={es ? 'Ej: Cliente J.M. — Mañanas' : 'E.g. Client J.M. — Mornings'}
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: C.cream, border: `1.5px solid ${C.creamWarm}`, color: C.brown }}
                onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
              />
            </div>

            {/* Tipo de nota */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.brownSoft }}>
                {es ? 'Tipo de nota' : 'Note type'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(NOTE_LABELS) as NoteType[]).map((nt) => {
                  const b = NOTE_LABELS[nt];
                  const selected = form.note_type === nt;
                  return (
                    <button
                      key={nt}
                      onClick={() => setForm(f => ({ ...f, note_type: nt }))}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: selected ? b.bg : C.creamSoft,
                        color: selected ? b.color : C.brownLight,
                        border: selected ? `1.5px solid ${b.color}40` : '1.5px solid transparent',
                      }}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: C.brownSoft }}>
                {es ? 'Descripción de sesión (plantilla)' : 'Session description (template)'}
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder={
                  es
                    ? 'Ej: Sesión de 60 min con J.M. Trabajamos DTT en identificación de colores. El cliente completó 3/5 programas con >80% de éxito…'
                    : 'E.g. 60-min session with J.M. We worked DTT on color identification. Client completed 3/5 programs with >80% success…'
                }
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none"
                style={{
                  background: C.cream,
                  border: `1.5px solid ${C.creamWarm}`,
                  color: C.brown,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = C.mustard)}
                onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
              />
              <p className="text-xs mt-1" style={{ color: C.brownLight }}>
                {es
                  ? 'Escribe la base de la sesión. Luego ajustas los detalles del día antes de generar.'
                  : "Write the session base. Then adjust the day's details before generating."}
              </p>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={saveOk
                ? { background: C.oliveSoft, color: '#3d4a2e' }
                : { background: C.brown, color: C.cream }}
            >
              {saveOk && <Check className="w-4 h-4" strokeWidth={2.5} />}
              {saving
                ? (es ? 'Guardando…' : 'Saving…')
                : saveOk
                  ? (es ? '¡Guardado!' : 'Saved!')
                  : (es ? 'Guardar plantilla' : 'Save template')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
