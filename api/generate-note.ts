/**
 * Zentyzone — Funcion serverless "generate-note"
 * ------------------------------------------------------------
 * Este archivo corre en el SERVIDOR de Vercel, NUNCA en el navegador.
 * Es el unico lugar que toca la clave secreta ANTHROPIC_API_KEY.
 *
 * IMPORTANTE: este archivo es AUTOSUFICIENTE a proposito. Incluye el
 * System Prompt de Zenty aqui mismo, sin importarlo de la carpeta
 * src/, porque las funciones serverless de Vercel deben ser
 * autocontenidas. Si quieres cambiar COMO redacta Zenty, edita la
 * funcion getZentySystemPrompt mas abajo en ESTE archivo.
 *
 * Vercel sirve este archivo en la ruta /api/generate-note.
 * ------------------------------------------------------------
 */
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// CONFIGURACION
// ------------------------------------------------------------
// Modelo de Claude que usa Zenty. Verificado en la documentacion
// oficial de Anthropic (mayo 2026): Claude Sonnet 4.6 es el mejor
// equilibrio entre velocidad, calidad y costo.
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// Maximo de tokens (longitud) de la nota generada.
const MAX_TOKENS = 4096;
// ============================================================

type NoteType = 'rbt_daily' | 'soap' | 'bcba_progress';
type Language = 'es' | 'en';

const VALID_NOTE_TYPES: NoteType[] = ['rbt_daily', 'soap', 'bcba_progress'];
const VALID_LANGUAGES: Language[] = ['es', 'en'];

// ============================================================
// SYSTEM PROMPT DE ZENTY
// ------------------------------------------------------------
// Esta es la "personalidad" e instrucciones de Zenty. Es la copia
// que usa el servidor de verdad. Para ajustarla, edita aqui.
// ============================================================
function getZentySystemPrompt(noteType: NoteType, language: Language): string {
  const typeInstructions = {
    rbt_daily:
      language === 'es'
        ? 'TIPO DE NOTA: RBT Daily Session Note (narrativa diaria extensa, no por secciones).'
        : 'NOTE TYPE: RBT Daily Session Note (extended narrative, not by sections).',
    soap:
      language === 'es'
        ? 'TIPO DE NOTA: SOAP. Estructura en 4 secciones: Subjective (S), Objective (O), Assessment (A), Plan (P).'
        : 'NOTE TYPE: SOAP. Structure in 4 sections: Subjective (S), Objective (O), Assessment (A), Plan (P).',
    bcba_progress:
      language === 'es'
        ? 'TIPO DE NOTA: BCBA Progress Report. Enfócate en progreso del cliente, análisis de datos, ajustes al plan de tratamiento y recomendaciones clínicas.'
        : 'NOTE TYPE: BCBA Progress Report. Focus on client progress, data analysis, treatment plan adjustments, and clinical recommendations.',
  };

  return `Eres Zenty, un asistente de redacción para profesionales RBT y BCBA que trabajan en servicios de ABA (Applied Behavior Analysis) en Estados Unidos.

FUNCIÓN: Convertir notas informales y fragmentadas en un borrador narrativo profesional, claro y listo para que el profesional lo revise, ajuste y firme antes de entregarlo en su EMR.

NO eres un sistema clínico. NO tomas decisiones clínicas. NO diagnosticas. NO determinas la función de un comportamiento (eso lo hace el BCBA). NO inventas información que el profesional no proporcionó.

PRIVACIDAD: Nunca incluyas en la nota nombres completos, apellidos, fechas de nacimiento, direcciones, números de teléfono, ni Medicaid IDs. Solo iniciales del cliente. Refiérete al cliente como "the client" o "el cliente". Si detectas un nombre completo o fecha de nacimiento en el input, reemplázalo automáticamente por iniciales y agrega al final: "Note: Personal identifiers were removed for privacy."

IDIOMA: Detecta el idioma del input. Si está mayormente en español, redacta en ESPAÑOL PROFESIONAL. Si está mayormente en inglés, redacta en INGLÉS CLÍNICO. NUNCA mezcles. La terminología técnica de ABA (DRA, DRO, prompting, mand, tact, etc.) se mantiene en inglés incluso dentro de una nota en español.

LONGITUD: Adaptativa al input. Si el RBT escribe poco, la nota es concisa. Si escribe mucho, la nota es completa. No inventes contenido para alargar.

DATOS FALTANTES: Si falta información crítica (duración de la sesión, objetivos trabajados, comportamiento principal), PREGUNTA antes de generar. Formato de pregunta: "Antes de redactar tu nota, necesito que me confirmes: [pregunta específica]". Una sola pregunta por turno. Sé directo, no robótico.

ESTILO: Profesional pero claro. Narrativo extenso por defecto (excepto SOAP). Sin jerga innecesaria. El RBT debe poder leer la nota y reconocer su sesión.

${typeInstructions[noteType]}

OUTPUT: Solo el borrador de la nota. Sin preámbulos como "Aquí está tu nota:". Sin disclaimers al final como "Esta nota es un borrador" (la app ya lo dice). Solo el contenido clínico.`;
}

/** Construye una respuesta JSON con el codigo de estado indicado. */
function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Maneja las peticiones POST a /api/generate-note */
export async function POST(request: Request): Promise<Response> {
  // --- 1. Verificar que la clave secreta este configurada en el servidor ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'El servidor no tiene configurada la clave de Anthropic.' },
      500,
    );
  }

  // --- 2. Leer y validar el cuerpo de la peticion ---
  let body: {
    inputText?: string;
    noteType?: NoteType;
    language?: Language;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'La peticion no es un JSON valido.' }, 400);
  }

  const { inputText, noteType, language } = body;

  if (!inputText || inputText.trim().length === 0) {
    return jsonResponse(
      { error: 'Falta el texto de la sesion (inputText).' },
      400,
    );
  }
  if (!noteType || !VALID_NOTE_TYPES.includes(noteType)) {
    return jsonResponse({ error: 'Tipo de nota invalido (noteType).' }, 400);
  }
  if (!language || !VALID_LANGUAGES.includes(language)) {
    return jsonResponse({ error: 'Idioma invalido (language).' }, 400);
  }

  // --- 3. Llamar a Claude ---
  try {
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = getZentySystemPrompt(noteType, language);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: inputText }],
    });

    // --- 4. Extraer el texto de la respuesta ---
    const note = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    if (!note) {
      return jsonResponse({ error: 'Claude no devolvio texto.' }, 502);
    }

    return jsonResponse({ note }, 200);
  } catch (err) {
    console.error('Error al llamar a Claude:', err);
    return jsonResponse(
      { error: 'No se pudo generar la nota. Intentalo de nuevo.' },
      500,
    );
  }
}
