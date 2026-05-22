/**
 * NewNote — Generador de notas dentro del nuevo layout
 * ------------------------------------------------------------
 * Añade un encabezado de página limpio y renderiza el
 * NoteGenerator existente. Lee templateContent del router state
 * para pre-llenar el textarea cuando viene de una plantilla.
 * ------------------------------------------------------------
 */
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { NoteGenerator } from '../NoteGenerator';
import { C } from '../../theme';
import type { Lang } from '../../translations';

interface NewNoteProps {
  lang: Lang;
  userId: string;
}

export function NewNote({ lang, userId }: NewNoteProps) {
  const es = lang === 'es';
  const location = useLocation();
  const templateContent: string = (location.state as { templateContent?: string } | null)?.templateContent ?? '';

  const dateStr = new Date().toLocaleDateString(es ? 'es-ES' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* ── Encabezado de página ── */}
      <div className="mb-6">
        <div
          className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] mb-2"
          style={{ color: C.mustardDark, fontWeight: 600 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>— {dateStr}</span>
        </div>
        <h1
          className="text-2xl lg:text-3xl tracking-tight"
          style={{ fontWeight: 700, color: C.brown, letterSpacing: '-0.02em' }}
        >
          {es ? 'Nueva Nota' : 'New Note'}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: C.brownSoft }}>
          {es
            ? 'Escribe tus ideas y Zenty las convierte en una nota clínica profesional.'
            : 'Write your thoughts and Zenty turns them into a professional clinical note.'}
        </p>
        {templateContent && (
          <p className="mt-1 text-xs font-semibold" style={{ color: C.mustardDark }}>
            {es ? '✦ Plantilla cargada — ajusta los detalles del día' : '✦ Template loaded — adjust today\'s details'}
          </p>
        )}
      </div>

      {/* ── Generador ── */}
      <NoteGenerator lang={lang} userId={userId} initialSessionInfo={templateContent} />
    </div>
  );
}
