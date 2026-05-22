/**
 * Tutorial — Cómo usar Zenty
 * 5 pasos + tips
 */
import { BookOpen, FileText, MessageSquare, Globe, ClipboardCheck, Lightbulb } from 'lucide-react';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface TutorialProps {
  lang: Lang;
}

interface Step {
  icon: React.ElementType;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  bg: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: FileText,
    titleEs: 'Selecciona el tipo de nota',
    titleEn: 'Select the note type',
    descEs: 'Elige entre RBT Daily Note, SOAP Note o BCBA Progress Note según la sesión que quieres documentar.',
    descEn: 'Choose between RBT Daily Note, SOAP Note, or BCBA Progress Note depending on the session you want to document.',
    bg: C.mustardSoft,
    color: C.mustardDark,
  },
  {
    icon: MessageSquare,
    titleEs: 'Escribe tu sesión en tus propias palabras',
    titleEn: 'Write your session in your own words',
    descEs: 'No te preocupes por el formato. Escribe lo que pasó tal como lo recuerdas: programas trabajados, conductas observadas, respuestas del cliente. Zenty entiende lenguaje natural.',
    descEn: "Don't worry about format. Write what happened as you remember it: programs worked, behaviors observed, client responses. Zenty understands natural language.",
    bg: C.creamWarm,
    color: C.brownSoft,
  },
  {
    icon: MessageSquare,
    titleEs: 'Zenty puede pedirte más detalles',
    titleEn: 'Zenty may ask for more details',
    descEs: 'Si falta información clave para la nota, Zenty te hará una o dos preguntas de seguimiento. Respóndelas con libertad — cuanto más contexto, mejor la nota.',
    descEn: 'If key information is missing, Zenty will ask you one or two follow-up questions. Answer freely — the more context, the better the note.',
    bg: C.oliveSoft,
    color: '#3d4a2e',
  },
  {
    icon: Globe,
    titleEs: 'Recibe la nota en inglés y en español',
    titleEn: 'Receive the note in English and Spanish',
    descEs: 'Zenty genera la nota profesional en ambos idiomas. Puedes usarla en tu EMR en inglés o compartir la versión en español con supervisores o familias.',
    descEn: 'Zenty generates the professional note in both languages. Use the English version in your EMR or share the Spanish version with supervisors or families.',
    bg: C.mustardSoft,
    color: C.mustardDark,
  },
  {
    icon: ClipboardCheck,
    titleEs: 'Revisa, ajusta, copia y pega en tu EMR',
    titleEn: 'Review, adjust, copy and paste into your EMR',
    descEs: 'Lee la nota generada. Haz los ajustes que necesites y cópiala directo en tu sistema de registros clínicos. Siempre revisa antes de firmar.',
    descEn: 'Read the generated note. Make any adjustments you need and paste it directly into your clinical records system. Always review before signing.',
    bg: C.creamSoft,
    color: C.brownSoft,
  },
];

interface Tip {
  textEs: string;
  textEn: string;
}

const TIPS: Tip[] = [
  {
    textEs: 'Usa solo las iniciales del cliente (ej. "J.M.") para proteger su privacidad.',
    textEn: 'Use only the client\'s initials (e.g. "J.M.") to protect their privacy.',
  },
  {
    textEs: 'Más detalle = mejor nota. No hay respuesta demasiado larga.',
    textEn: 'More detail = better note. There is no answer that is too long.',
  },
  {
    textEs: 'Siempre revisa la nota generada antes de copiarla en tu EMR.',
    textEn: 'Always review the generated note before copying it into your EMR.',
  },
  {
    textEs: 'Si algo no quedó bien, describe la sesión con más detalle y genera de nuevo.',
    textEn: "If something didn't turn out right, describe the session with more detail and generate again.",
  },
];

export function Tutorial({ lang }: TutorialProps) {
  const M = tm[lang];
  const es = lang === 'es';

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl lg:text-3xl tracking-tight font-bold mb-2"
          style={{ color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.tutorialTitle}
        </h1>
        <p className="text-base" style={{ color: C.brownSoft }}>
          {es
            ? 'Aprende a generar notas clínicas perfectas en menos de 2 minutos.'
            : 'Learn to generate perfect clinical notes in less than 2 minutes.'}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="rounded-[1.75rem] p-6 flex gap-5"
              style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
            >
              {/* Number + icon */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: step.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} strokeWidth={2} />
                </div>
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    color: C.mustardDark,
                    fontSize: '1.1rem',
                  }}
                >
                  {i + 1}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-bold text-base mb-1" style={{ color: C.brown }}>
                  {es ? step.titleEs : step.titleEn}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.brownSoft }}>
                  {es ? step.descEs : step.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div
        className="rounded-[1.75rem] p-6"
        style={{ background: C.mustardSoft, boxShadow: `0 4px 20px ${C.mustardDark}10` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5" style={{ color: C.mustardDark }} />
          <h3 className="font-bold text-base" style={{ color: C.brown }}>
            {es ? 'Tips para mejores notas' : 'Tips for better notes'}
          </h3>
        </div>
        <ul className="space-y-3">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: C.brown }}>
              <span className="shrink-0" style={{ color: C.mustardDark, fontWeight: 700 }}>✦</span>
              {es ? tip.textEs : tip.textEn}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA banner */}
      <div
        className="rounded-[1.75rem] p-6 flex items-center gap-4"
        style={{ background: C.brown }}
      >
        <BookOpen className="w-8 h-8 shrink-0" style={{ color: C.mustardSoft }} />
        <div>
          <p className="font-bold text-base mb-0.5" style={{ color: C.cream }}>
            {es ? '¿Listo para empezar?' : 'Ready to start?'}
          </p>
          <p className="text-sm" style={{ color: C.creamWarm, opacity: 0.85 }}>
            {es
              ? 'Ve a "Nueva nota" y genera tu primera nota en minutos.'
              : 'Go to "New note" and generate your first note in minutes.'}
          </p>
        </div>
      </div>
    </div>
  );
}
