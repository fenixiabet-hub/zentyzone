/**
 * Zentyzone — Funcion serverless "confirm-copy"
 * ------------------------------------------------------------
 * Se llama cuando el usuario presiona "Aceptar y copiar" sobre
 * una nota generada. Hace tres cosas:
 *
 *   1. Valida la sesion unica (sessionId vs profiles.active_session_id).
 *   2. Verifica la cuota de copias del plan free (10/mes, VISIBLE).
 *      - Si el limite esta alcanzado → devuelve { limitReached: true }.
 *      - Si hay cuota disponible    → incrementa copies_this_month.
 *   3. Guarda la nota en la tabla `notes`.
 *
 * El plan Pro salta todas las validaciones de cuota.
 * ------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js';

/** Limite visible de copias por mes para el plan free. */
const COPY_LIMIT = 10;

type NoteType = 'rbt_daily' | 'soap' | 'bcba_progress';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  // ── 1. Leer y validar el cuerpo ──────────────────────────────────────
  let body: {
    sessionId?: string;
    noteContent?: string;
    noteType?: NoteType;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'La peticion no es un JSON valido.' }, 400);
  }

  const { sessionId, noteContent, noteType } = body;

  if (!sessionId) {
    return jsonResponse({ error: 'Falta el sessionId.' }, 400);
  }
  if (!noteContent) {
    return jsonResponse({ error: 'Falta el contenido de la nota.' }, 400);
  }

  // ── 2. Obtener JWT del header ────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Configuracion de base de datos no disponible.' }, 500);
  }

  // ── 3. Cliente Supabase con el JWT del usuario (respeta RLS) ─────────
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // ── 4. Verificar JWT ─────────────────────────────────────────────────
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return jsonResponse({ error: 'Sesion no valida. Vuelve a iniciar sesion.' }, 401);
  }

  // ── 5. Leer perfil ───────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('subscription_status, active_session_id, copies_this_month, last_reset_date')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    return jsonResponse({ error: 'No se pudo verificar tu cuenta.' }, 500);
  }

  // ── 6. Validar sesion unica ──────────────────────────────────────────
  if (profile.active_session_id && profile.active_session_id !== sessionId) {
    return jsonResponse({ error: 'Sesion invalida. Vuelve a iniciar sesion.' }, 401);
  }

  const isPro = profile.subscription_status === 'pro';

  // ── 7. Determinar si corresponde reset mensual ───────────────────────
  const today = new Date().toISOString().slice(0, 10);          // 'YYYY-MM-DD'
  const currentMonth = today.slice(0, 7);                        // 'YYYY-MM'
  const lastResetMonth = (profile.last_reset_date ?? '').slice(0, 7);
  const needsReset = !isPro && currentMonth !== lastResetMonth;

  let copiesThisMonth = needsReset ? 0 : (profile.copies_this_month ?? 0);

  // ── 8. Verificar cuota (solo plan free) ──────────────────────────────
  if (!isPro && copiesThisMonth >= COPY_LIMIT) {
    // Calcular fecha del proximo reset (dia 1 del mes siguiente)
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return jsonResponse(
      {
        limitReached: true,
        copiesUsed: copiesThisMonth,
        copiesLimit: COPY_LIMIT,
        nextReset: nextReset.toISOString().slice(0, 10), // 'YYYY-MM-DD'
      },
      200, // 200: no es un error del servidor, es logica de negocio
    );
  }

  // ── 9. Incrementar copies_this_month (y resetear si toca) ────────────
  const newCopiesCount = copiesThisMonth + 1;
  const updateData: Record<string, unknown> = {
    copies_this_month: isPro ? copiesThisMonth : newCopiesCount,
  };
  if (needsReset) {
    updateData.generations_this_month = 0;
    updateData.last_reset_date = today;
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (updateErr) {
    console.error('Error al actualizar copies_this_month:', updateErr);
    return jsonResponse({ error: 'No se pudo registrar la copia.' }, 500);
  }

  // ── 10. Guardar la nota en la tabla `notes` ──────────────────────────
  // No fallamos si esto falla: la copia ya fue contada.
  const { error: noteErr } = await supabase.from('notes').insert({
    user_id: user.id,
    note_type: noteType ?? null,
    output_text: noteContent,
  });
  if (noteErr) {
    console.error('Error al guardar la nota (no critico):', noteErr);
  }

  return jsonResponse(
    {
      success: true,
      copiesUsed: isPro ? null : newCopiesCount,
      copiesLimit: isPro ? null : COPY_LIMIT,
    },
    200,
  );
}
