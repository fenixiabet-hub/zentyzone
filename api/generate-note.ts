/**
 * Zentyzone — Funcion serverless "generate-note"
 * ------------------------------------------------------------
 * Este archivo corre en el SERVIDOR de Vercel, NUNCA en el navegador.
 * Es el unico lugar que toca la clave secreta ANTHROPIC_API_KEY.
 *
 * Flujo:
 *   1. Recibe { inputText, noteType, language } desde el navegador.
 *   2. Valida los datos.
 *   3. Llama a Claude con el System Prompt de Zenty.
 *   4. Devuelve { note: "..." } con el borrador de la nota.
 *
 * Vercel sirve este archivo automaticamente en la ruta /api/generate-note
 * (por estar dentro de la carpeta "api").
 * ------------------------------------------------------------
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  getZentySystemPrompt,
  type NoteType,
  type Language,
} from '../src/prompts/zenty-system-prompt';

// ============================================================
// CONFIGURACION
// ------------------------------------------------------------
// Modelo de Claude que usa Zenty. El nombre del modelo cambia con
// el tiempo; se confirmara con la documentacion oficial de Anthropic
// antes de la primera prueba en vivo.
const CLAUDE_MODEL = 'claude-sonnet-4-5';

// Maximo de tokens (longitud) de la nota generada.
const MAX_TOKENS = 4096;
// ============================================================

const VALID_NOTE_TYPES: NoteType[] = ['rbt_daily', 'soap', 'bcba_progress'];
const VALID_LANGUAGES: Language[] = ['es', 'en'];

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
