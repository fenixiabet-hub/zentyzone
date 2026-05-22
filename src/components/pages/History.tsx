/**
 * History — Historial de notas
 * Búsqueda + filtros + lista de tarjetas + modal de vista completa
 */
import { useState, useEffect } from 'react';
import { Search, X, Eye, Copy, Trash2, Check, ChevronDown, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface Note {
  id: string;
  client_initials: string | null;
  session_date: string | null;
  note_type: string;
  output_text: string;
  created_at: string;
}

type TypeFilter = 'all' | 'rbt_daily' | 'soap' | 'bcba_progress';
type DateFilter = 'all' | 'this_month' | 'last_month';

const NOTE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  rbt_daily:     { label: 'RBT Daily',     bg: '#e8c478', color: '#8a6420' },
  soap:          { label: 'SOAP',          bg: '#a5ab8a', color: '#3d4a2e' },
  bcba_progress: { label: 'BCBA Progress', bg: '#ede4cd', color: '#6b5d4f' },
};

function getBadge(type: string) {
  return NOTE_BADGE[type] ?? { label: type, bg: '#f5efe0', color: '#6b5d4f' };
}

interface HistoryProps {
  lang: Lang;
  userId: string;
}

export function History({ lang, userId }: HistoryProps) {
  const M = tm[lang];
  const es = lang === 'es';

  const [notes, setNotes]           = useState<Note[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [copiedId, setCopiedId]       = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('notes')
      .select('id, client_initials, session_date, note_type, output_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data);
        setLoading(false);
      });
  }, [userId]);

  // ── Filtrado en cliente ──────────────────────────────────
  const filtered = notes.filter((note) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !note.client_initials?.toLowerCase().includes(q) &&
        !note.output_text.toLowerCase().includes(q)
      ) return false;
    }
    if (typeFilter !== 'all' && note.note_type !== typeFilter) return false;
    if (dateFilter !== 'all') {
      const d = new Date(note.created_at);
      const now = new Date();
      if (dateFilter === 'this_month') {
        if (d < new Date(now.getFullYear(), now.getMonth(), 1)) return false;
      } else {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e2 = new Date(now.getFullYear(), now.getMonth(), 1);
        if (d < s || d >= e2) return false;
      }
    }
    return true;
  });

  // ── Acciones ─────────────────────────────────────────────
  const handleCopy = async (note: Note) => {
    try { await navigator.clipboard.writeText(note.output_text); } catch { /* ok */ }
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
    if (viewingNote?.id === id) setViewingNote(null);
  };

  const fmtDate = (note: Note) => {
    const raw = note.session_date
      ? note.session_date + 'T12:00:00'
      : note.created_at;
    return new Date(raw).toLocaleDateString(es ? 'es-ES' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Select style ─────────────────────────────────────────
  const selStyle: React.CSSProperties = {
    background: 'white',
    border: `1.5px solid ${C.creamWarm}`,
    color: C.brown,
    fontFamily: "'DM Sans', sans-serif",
    paddingLeft: 16,
    paddingRight: 32,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 16,
    fontSize: 14,
    appearance: 'none' as const,
    cursor: 'pointer',
    outline: 'none',
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1
            className="text-2xl lg:text-3xl tracking-tight font-bold"
            style={{ color: C.brown, letterSpacing: '-0.02em' }}
          >
            {M.historyTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.brownSoft }}>
            {notes.length}{' '}
            {es ? `nota${notes.length !== 1 ? 's' : ''} en total` : `note${notes.length !== 1 ? 's' : ''} total`}
          </p>
        </div>

        {/* Búsqueda + filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: C.brownLight }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={M.historySearch}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl focus:outline-none transition-all text-sm"
              style={{ background: 'white', border: `1.5px solid ${C.creamWarm}`, color: C.brown }}
              onFocus={(e) => (e.target.style.borderColor = C.mustard)}
              onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" style={{ color: C.brownLight }} />
              </button>
            )}
          </div>

          {/* Tipo */}
          <div className="relative">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} style={selStyle}>
              <option value="all">{M.historyFilterAll}</option>
              <option value="rbt_daily">{M.historyTypeRbt}</option>
              <option value="soap">{M.historyTypeSoap}</option>
              <option value="bcba_progress">{M.historyTypeBcba}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: C.brownLight }} />
          </div>

          {/* Fecha */}
          <div className="relative">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} style={selStyle}>
              <option value="all">{M.historyFilterAll}</option>
              <option value="this_month">{M.historyFilterThisMonth}</option>
              <option value="last_month">{M.historyFilterLastMonth}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: C.brownLight }} />
          </div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div
            className="rounded-[2rem] p-12 text-center"
            style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
          >
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: C.cream }}
            >
              <FileText className="w-6 h-6" style={{ color: C.brownLight }} strokeWidth={1.5} />
            </div>
            <p className="text-sm" style={{ color: C.brownSoft }}>
              {notes.length === 0
                ? `${M.historyEmpty} ✨`
                : es ? 'No hay notas que coincidan con tu búsqueda.' : 'No notes match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((note) => {
              const badge = getBadge(note.note_type);
              const isDeleting = deletingId === note.id;
              const isCopied = copiedId === note.id;
              const preview = note.output_text.replace(/={10,}[\s\S]*?={10,}/g, '').trim().slice(0, 160);

              return (
                <div
                  key={note.id}
                  className="rounded-[1.5rem] p-5"
                  style={{ background: 'white', boxShadow: `0 4px 16px ${C.mustardDark}0d` }}
                >
                  {/* Fila superior */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {note.client_initials && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: C.cream, color: C.brown }}
                      >
                        {note.client_initials}
                      </span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: C.brownLight }}>
                      {fmtDate(note)}
                    </span>
                  </div>

                  {/* Preview */}
                  <p
                    className="text-xs leading-relaxed mb-4"
                    style={{
                      color: C.brownSoft,
                      fontFamily: "'JetBrains Mono', monospace",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {preview}…
                  </p>

                  {/* Acciones */}
                  {isDeleting ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs" style={{ color: C.brownSoft }}>
                        {M.historyDeleteConfirm}
                      </span>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: '#fbeae5', color: '#b4412e' }}
                      >
                        {es ? 'Sí, borrar' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: C.creamSoft, color: C.brownSoft }}
                      >
                        {es ? 'Cancelar' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setViewingNote(note)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={{ background: C.cream, color: C.brown }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {M.historyActionView}
                      </button>
                      <button
                        onClick={() => handleCopy(note)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={isCopied
                          ? { background: C.oliveSoft, color: '#3d4a2e' }
                          : { background: C.mustardSoft, color: C.mustardDark }}
                      >
                        {isCopied
                          ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? M.historyCopied : M.historyActionCopy}
                      </button>
                      <button
                        onClick={() => setDeletingId(note.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ml-auto"
                        style={{ background: C.cream, color: C.brownLight }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fbeae5'; e.currentTarget.style.color = '#b4412e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = C.cream; e.currentTarget.style.color = C.brownLight; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {M.historyActionDelete}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: nota completa */}
      {viewingNote && (() => {
        const badge = getBadge(viewingNote.note_type);
        const isCopied = copiedId === viewingNote.id;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(61,52,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setViewingNote(null)}
          >
            <div
              className="rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col"
              style={{ background: 'white', boxShadow: `0 24px 60px ${C.brown}30` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: `1px solid ${C.creamSoft}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {viewingNote.client_initials && (
                    <span className="text-sm font-medium" style={{ color: C.brown }}>
                      {viewingNote.client_initials}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: C.brownLight }}>
                    {fmtDate(viewingNote)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(viewingNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={isCopied
                      ? { background: C.oliveSoft, color: '#3d4a2e' }
                      : { background: C.brown, color: C.cream }}
                  >
                    {isCopied
                      ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? M.historyCopied : M.historyActionCopy}
                  </button>
                  <button
                    onClick={() => setViewingNote(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                    style={{ background: C.cream, color: C.brownSoft }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="overflow-y-auto p-6">
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: C.brown }}
                >
                  {viewingNote.output_text}
                </pre>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
