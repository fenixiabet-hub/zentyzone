/**
 * FAQ — Preguntas frecuentes
 * 12 ítems acordeón, tono honesto
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface FAQProps {
  lang: Lang;
}

interface FAQItem {
  qEs: string;
  qEn: string;
  aEs: string;
  aEn: string;
}

const ITEMS: FAQItem[] = [
  {
    qEs: '¿Zentyzone es HIPAA-compliant?',
    qEn: 'Is Zentyzone HIPAA-compliant?',
    aEs: 'Zentyzone está diseñado con privacidad en mente: nunca pedimos ni almacenamos nombres completos de clientes. Sin embargo, actualmente no tenemos un Business Associate Agreement (BAA) con nuestros proveedores de infraestructura. Te recomendamos usar solo iniciales y no incluir información de identificación directa hasta que completemos ese proceso.',
    aEn: 'Zentyzone is designed with privacy in mind: we never ask for or store full client names. However, we currently do not have a Business Associate Agreement (BAA) with our infrastructure providers. We recommend using only initials and not including directly identifying information until we complete that process.',
  },
  {
    qEs: '¿Pueden ver mis notas otras personas?',
    qEn: 'Can other people see my notes?',
    aEs: 'No. Cada nota está vinculada exclusivamente a tu cuenta. Ni el equipo de Zentyzone accede a tus notas de forma rutinaria. Tu historial solo es visible para ti.',
    aEn: 'No. Each note is exclusively linked to your account. The Zentyzone team does not routinely access your notes. Your history is only visible to you.',
  },
  {
    qEs: '¿Por qué solo iniciales del cliente?',
    qEn: 'Why only client initials?',
    aEs: 'Para proteger la privacidad del cliente y reducir riesgos al mínimo. Al usar "J.M." en lugar del nombre completo, el contenido de la nota no es directamente identificable aunque sea interceptado.',
    aEn: "To protect client privacy and minimize risks. By using \"J.M.\" instead of the full name, the note content is not directly identifiable even if intercepted.",
  },
  {
    qEs: '¿Qué pasa si Zenty se equivoca en una nota?',
    qEn: 'What if Zenty makes a mistake in a note?',
    aEs: 'Siempre debes revisar la nota antes de usarla. Zenty es un asistente — la responsabilidad clínica y legal de la documentación es tuya. Si la nota no es precisa, genera de nuevo con más contexto o edítala manualmente.',
    aEn: 'You should always review the note before using it. Zenty is an assistant — the clinical and legal responsibility for the documentation is yours. If the note is not accurate, generate again with more context or edit it manually.',
  },
  {
    qEs: '¿Puedo usar Zenty para mis estudios del RBT exam?',
    qEn: 'Can I use Zenty to study for the RBT exam?',
    aEs: 'Sí, el Glosario ABA incluye 35 términos clínicos con definiciones y ejemplos en inglés y español. Es un recurso útil para estudiar terminología. Para el examen completo te recomendamos complementarlo con el Task List oficial del BACB.',
    aEn: 'Yes, the ABA Glossary includes 35 clinical terms with definitions and examples in English and Spanish. It is a useful resource for studying terminology. For the full exam, we recommend supplementing it with the official BACB Task List.',
  },
  {
    qEs: '¿Cuántas notas puedo generar durante el trial?',
    qEn: 'How many notes can I generate during the trial?',
    aEs: 'Durante los 5 días de prueba puedes confirmar hasta 10 notas. El Plan Plus permite 25 notas/mes y el Plan Pro es ilimitado.',
    aEn: 'During the 5-day trial you can confirm up to 10 notes. Plus Plan allows 25 notes/month and Pro Plan is unlimited.',
  },
  {
    qEs: '¿Cómo funciona la prueba gratuita?',
    qEn: 'How does the free trial work?',
    aEs: 'Al registrarte, eliges entre Plan Plus ($19.99/mes) o Plan Pro ($29.99/mes) e ingresas tu tarjeta. No se te cobra nada durante los primeros 5 días. Si cancelas antes del día 6, no pagas nada.',
    aEn: 'When you sign up, you choose between Plus Plan ($19.99/mo) or Pro Plan ($29.99/mo) and enter your card. You are not charged anything for the first 5 days. If you cancel before day 6, you pay nothing.',
  },
  {
    qEs: '¿Puedo cancelar mi suscripción en cualquier momento?',
    qEn: 'Can I cancel my subscription at any time?',
    aEs: 'Sí. Puedes cancelar en cualquier momento desde "Plan y Pagos" en el menú lateral, sin penalización. Tu acceso se mantiene hasta el fin del período pagado.',
    aEn: 'Yes. You can cancel at any time from "Plan & Billing" in the sidebar, without penalty. Your access is maintained until the end of the paid period.',
  },
  {
    qEs: '¿Zentyzone funciona en español?',
    qEn: 'Does Zentyzone work in Spanish?',
    aEs: 'Sí. Puedes escribir tu sesión en español y Zenty genera la nota en inglés Y en español. Toda la interfaz también está disponible en español.',
    aEn: 'Yes. You can write your session in Spanish and Zenty generates the note in English AND Spanish. The entire interface is also available in Spanish.',
  },
  {
    qEs: '¿Por qué Zenty a veces me pregunta antes de generar la nota?',
    qEn: 'Why does Zenty sometimes ask questions before generating the note?',
    aEs: 'Cuando la descripción de la sesión no tiene suficiente información para una nota completa y precisa, Zenty hace preguntas de seguimiento. Esto garantiza que la nota final sea clínicamente correcta. Si prefieres que no pregunte, incluye todos los detalles desde el principio.',
    aEn: "When the session description doesn't have enough information for a complete and accurate note, Zenty asks follow-up questions. This ensures the final note is clinically correct. If you prefer it not to ask, include all the details from the beginning.",
  },
  {
    qEs: '¿Puedo editar la nota generada?',
    qEn: 'Can I edit the generated note?',
    aEs: 'Actualmente puedes copiar la nota al portapapeles y editarla en tu EMR u otro editor de texto. La edición directa dentro de Zentyzone es una función que estamos desarrollando.',
    aEn: 'Currently you can copy the note to the clipboard and edit it in your EMR or another text editor. Direct editing within Zentyzone is a feature we are developing.',
  },
  {
    qEs: '¿Mis notas se guardan automáticamente?',
    qEn: 'Are my notes saved automatically?',
    aEs: 'Sí. Cada nota que generas se guarda automáticamente en tu historial. Puedes acceder a todas tus notas anteriores desde la sección "Historial" del menú lateral.',
    aEn: 'Yes. Every note you generate is automatically saved in your history. You can access all your previous notes from the "History" section in the sidebar.',
  },
];

export function FAQ({ lang }: FAQProps) {
  const M = tm[lang];
  const es = lang === 'es';
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (i: number) => setOpenId(prev => (prev === i ? null : i));

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl lg:text-3xl tracking-tight font-bold mb-2"
          style={{ color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.faqTitle}
        </h1>
        <p className="text-base" style={{ color: C.brownSoft }}>
          {es
            ? 'Respuestas honestas a las preguntas más comunes.'
            : 'Honest answers to the most common questions.'}
        </p>
      </div>

      {/* Acordeón */}
      <div className="space-y-3">
        {ITEMS.map((item, i) => {
          const isOpen = openId === i;
          return (
            <div
              key={i}
              className="rounded-[1.5rem] overflow-hidden"
              style={{
                background: 'white',
                boxShadow: `0 4px 16px ${C.mustardDark}10`,
                border: isOpen ? `1.5px solid ${C.mustardSoft}` : '1.5px solid transparent',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Question row */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span
                  className="font-semibold text-sm leading-snug"
                  style={{ color: C.brown }}
                >
                  {es ? item.qEs : item.qEn}
                </span>
                <ChevronDown
                  className="w-4 h-4 shrink-0 transition-transform duration-200"
                  style={{
                    color: C.mustardDark,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Answer */}
              {isOpen && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: `1px solid ${C.creamSoft}` }}
                >
                  <p
                    className="text-sm leading-relaxed pt-4"
                    style={{ color: C.brownSoft }}
                  >
                    {es ? item.aEs : item.aEn}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center" style={{ color: C.brownLight }}>
        {es
          ? '¿No encontraste tu respuesta? Escríbenos a soporte — somos un equipo pequeño pero respondemos.'
          : "Didn't find your answer? Write to us at support — we're a small team but we respond."}
      </p>
    </div>
  );
}
