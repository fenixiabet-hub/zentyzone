/**
 * Zentyzone — Funcion serverless "generate-note"
 * ------------------------------------------------------------
 * Corre en el SERVIDOR de Vercel. Es el unico lugar que toca la
 * clave secreta ANTHROPIC_API_KEY.
 *
 * Funciona como una CONVERSACION: recibe el historial de mensajes
 * y Zenty responde una de dos cosas:
 *   - una PREGUNTA (si le falta informacion), o
 *   - la NOTA final (en ingles y espanol).
 *
 * CUOTAS (plan free):
 *   - 50 generaciones/mes — limite SILENCIOSO (no se muestra al usuario).
 *   - 10 copias/mes       — limite VISIBLE (gestionado en confirm-copy.ts).
 *   - Reset el dia 1 de cada mes a las 00:00 UTC.
 *
 * AUTOSUFICIENTE: el System Prompt de Zenty esta aqui mismo. Si
 * quieres cambiar como se comporta Zenty, edita getZentySystemPrompt.
 * ------------------------------------------------------------
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Modelo de Claude (verificado en docs de Anthropic, mayo 2026).
const CLAUDE_MODEL = 'claude-sonnet-4-6';
// Maximo de tokens: alto porque la nota viene en 2 idiomas.
const MAX_TOKENS = 8000;
// Limite silencioso de generaciones por mes (plan free).
const SILENT_GEN_LIMIT = 50;

type NoteType = 'rbt_daily' | 'soap' | 'bcba_progress';
type Language = 'es' | 'en';
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const VALID_NOTE_TYPES: NoteType[] = ['rbt_daily', 'soap', 'bcba_progress'];
const VALID_LANGUAGES: Language[] = ['es', 'en'];

// ============================================================
// SYSTEM PROMPT DE ZENTY  (editar aqui para cambiar su conducta)
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

FUNCIÓN: Convertir notas informales y fragmentadas de una sesión en un borrador de nota clínica profesional, claro y listo para que el profesional lo revise, ajuste y firme antes de entregarlo en su EMR.

NO eres un sistema clínico. NO tomas decisiones clínicas. NO diagnosticas. NO determinas la función de un comportamiento (eso lo hace el BCBA). NO inventas información que el profesional no proporcionó.

=== CÓMO RESPONDES ===
Estás en una conversación con el profesional. En CADA turno haces UNA de dos cosas, y tu respuesta SIEMPRE empieza con una de estas dos etiquetas exactas:

[1] Si falta información crítica para redactar una buena nota (duración de la sesión, objetivos o programas trabajados, comportamiento principal observado, o la respuesta/progreso del cliente), tu respuesta empieza EXACTAMENTE con:
PREGUNTA:
seguida de UNA sola pregunta, específica y clara, para conseguir ese dato. Una pregunta por turno. Tono cálido y directo, no robótico. Haz la pregunta en el idioma del profesional.

[2] Si ya tienes información suficiente, entregas la nota. Tu respuesta empieza EXACTAMENTE con:
NOTA:
seguida del contenido de la nota en el formato de abajo.

Pregunta SOLO cuando de verdad falte algo importante. Si el profesional ya dio lo esencial, NO preguntes de más: entrega la nota directamente. Como máximo haz 1 o 2 rondas de preguntas; no interrogues.

=== PRIVACIDAD ===
Nunca incluyas nombres completos, apellidos, fechas de nacimiento, direcciones, teléfonos ni Medicaid IDs. Solo iniciales del cliente. Refiérete al cliente como "the client" / "el cliente". Si detectas un nombre completo o fecha de nacimiento, reemplázalo por iniciales y agrega al final de cada versión: "Note: Personal identifiers were removed for privacy."

=== FORMATO DE LA NOTA (lo que va después de "NOTA:") ===
Entrega SIEMPRE la nota en DOS versiones completas que dicen exactamente lo mismo — primero inglés, luego español — con este formato EXACTO:

==================================================
ENGLISH — Submit this version to your company
==================================================

[la nota clínica completa, en inglés clínico profesional]

==================================================
ESPAÑOL — Solo para tu referencia
==================================================

[la MISMA nota, completa, en español profesional]

La terminología técnica de ABA (DRA, DRO, prompting, mand, tact, DTT, etc.) se mantiene en inglés en AMBAS versiones. Cada versión es internamente pura: no mezcles idiomas dentro de una misma versión.

=== ESTILO Y LONGITUD ===
Profesional pero claro. Narrativo extenso por defecto (excepto SOAP). Longitud adaptativa: si el profesional escribió poco, la nota es concisa; si escribió mucho, es completa. No inventes contenido para alargar. El profesional debe poder leer la nota y reconocer su sesión.

${typeInstructions[noteType]}

=== REGLAS DE SALIDA ===
- Tu respuesta SIEMPRE empieza con "PREGUNTA:" o con "NOTA:". Nunca con otra cosa.
- Sin preámbulos tipo "Aquí está tu nota:".
- Sin disclaimers al final tipo "Esta nota es un borrador" (la app ya lo aclara).`;
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
  // ── 1. Verificar la clave secreta de Anthropic ──────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'El servidor no tiene configurada la clave de Anthropic.' },
      500,
    );
  }

  // ── 2. Leer y validar el cuerpo ──────────────────────────────────────
  let body: {
    messages?: ChatMessage[];
    noteType?: NoteType;
    language?: Language;
    sessionId?: string; // UUID guardado en localStorage tras el login
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'La peticion no es un JSON valido.' }, 400);
  }

  const { messages, noteType, language, sessionId } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'Falta la conversacion (messages).' }, 400);
  }

  // Limpiar los mensajes: solo roles validos y contenido de texto no vacio.
  const cleanMessages: ChatMessage[] = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));

  if (cleanMessages.length === 0 || cleanMessages[0].role !== 'user') {
    return jsonResponse(
      { error: 'La conversacion debe empezar con un mensaje del usuario.' },
      400,
    );
  }
  if (!noteType || !VALID_NOTE_TYPES.includes(noteType)) {
    return jsonResponse({ error: 'Tipo de nota invalido (noteType).' }, 400);
  }
  if (!language || !VALID_LANGUAGES.includes(language)) {
    return jsonResponse({ error: 'Idioma invalido (language).' }, 400);
  }

  // ── 3. Autenticacion + validacion de cuotas ──────────────────────────
  // Estos campos se populan si el frontend envio sessionId + JWT.
  // Si no lo envio (ej. durante desarrollo pre-Paso5), se omite la validacion.
  type SupaClient = ReturnType<typeof createClient>;
  let supaClient: SupaClient | null = null;
  let userId: string | null = null;
  let isPro = false;
  let generationsThisMonth = 0;
  let notesGeneratedTotal = 0;
  let needsReset = false;

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (sessionId && token && supabaseUrl && supabaseAnonKey) {
    // Crear cliente con el JWT del usuario (respeta RLS)
    supaClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verificar JWT
    const {
      data: { user },
      error: authErr,
    } = await supaClient.auth.getUser();
    if (authErr || !user) {
      return jsonResponse({ error: 'Sesion no valida. Vuelve a iniciar sesion.' }, 401);
    }
    userId = user.id;

    // Leer perfil
    const { data: profile, error: profileErr } = await supaClient
      .from('profiles')
      .select(
        'subscription_status, active_session_id, generations_this_month, last_reset_date, notes_generated_count',
      )
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return jsonResponse({ error: 'No se pudo verificar tu cuenta.' }, 500);
    }

    // Validar sesion unica: el sessionId del localStorage debe coincidir
    if (profile.active_session_id && profile.active_session_id !== sessionId) {
      return jsonResponse({ error: 'Sesion invalida. Vuelve a iniciar sesion.' }, 401);
    }

    isPro = profile.subscription_status === 'pro';
    generationsThisMonth = profile.generations_this_month ?? 0;
    notesGeneratedTotal = profile.notes_generated_count ?? 0;

    if (!isPro) {
      // Determinar si corresponde un reset mensual
      const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      const lastResetMonth = (profile.last_reset_date ?? '').slice(0, 7);
      needsReset = currentMonth !== lastResetMonth;

      const effectiveGenerations = needsReset ? 0 : generationsThisMonth;

      // Limite silencioso: no revelar el numero al usuario
      if (effectiveGenerations >= SILENT_GEN_LIMIT) {
        return jsonResponse(
          { error: 'No se pudo generar la nota. Intentalo de nuevo.' },
          500,
        );
      }
    }
  }

  // ── 4. Llamar a Claude ───────────────────────────────────────────────
  try {
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = getZentySystemPrompt(noteType, language);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: cleanMessages,
    });

    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    if (!text) {
      return jsonResponse({ error: 'Claude no devolvio texto.' }, 502);
    }

    // ── 5. Interpretar: pregunta o nota ──────────────────────────────
    let type: 'question' | 'note' = 'note';
    let content = text;
    if (/^PREGUNTA:/i.test(text)) {
      type = 'question';
      content = text.replace(/^PREGUNTA:/i, '').trim();
    } else if (/^NOTA:/i.test(text)) {
      type = 'note';
      content = text.replace(/^NOTA:/i, '').trim();
    }

    // ── 6. Incrementar contadores (solo cuando se produce una NOTA) ──
    // Las preguntas intermedias NO cuentan como generaciones.
    if (supaClient && userId && type === 'note') {
      const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

      if (!isPro) {
        // Plan free: actualizar generations_this_month + reset si toca
        const newGenCount = needsReset ? 1 : generationsThisMonth + 1;
        const updateData: Record<string, unknown> = {
          generations_this_month: newGenCount,
          notes_generated_count: notesGeneratedTotal + 1,
        };
        if (needsReset) {
          updateData.copies_this_month = 0;
          updateData.last_reset_date = today;
        }
        await supaClient.from('profiles').update(updateData).eq('id', userId);
      } else {
        // Plan pro: solo registro historico, sin limite
        await supaClient
          .from('profiles')
          .update({ notes_generated_count: notesGeneratedTotal + 1 })
          .eq('id', userId);
      }
    }

    return jsonResponse({ type, content }, 200);
  } catch (err) {
    console.error('Error al llamar a Claude:', err);
    return jsonResponse(
      { error: 'No se pudo generar la nota. Intentalo de nuevo.' },
      500,
    );
  }
}
