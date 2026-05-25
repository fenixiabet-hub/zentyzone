/// <reference types="node" />
/**
 * Zentyzone — Funcion serverless "confirm-copy"
 * ------------------------------------------------------------
 * Se llama cuando el usuario presiona "Aceptar y copiar" sobre
 * una nota generada. Hace tres cosas:
 *
 *   1. Valida la sesion unica (sessionId vs profiles.active_session_id).
 *   2. Verifica la cuota de copias segun plan:
 *      - canceled        : bloqueado (402)
 *      - trial           : 10 / mes (cubre los 5 dias de prueba)
 *      - plus            : 25 / mes
 *      - pro             : ilimitado
 *      - past_due        : bloqueado (402)
 *   3. Guarda la nota en la tabla `notes`.
 * ------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js';

// No existe plan free. canceled → 402. Límites activos: trial / plus / pro.
/** Limite de copias/mes durante el trial (5 dias). */
const TRIAL_COPY_LIMIT = 10;
/** Limite de copias/mes para el plan Plus. */
const PLUS_COPY_LIMIT  = 25;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body = await request.json() as any;
  } catch {
    return jsonResponse({ error: 'La peticion no es un JSON valido.' }, 400);
  }

  const { sessionId, noteContent, noteType } = body;

  if (!noteContent) {
    return jsonResponse({ error: 'Falta el contenido de la nota.' }, 400);
  }

  // ── 2. Obtener JWT del header ────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }

  const supabaseUrl    = process.env.VITE_SUPABASE_URL;
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
  if (sessionId && profile.active_session_id && profile.active_session_id !== sessionId) {
    return jsonResponse({ error: 'Sesion invalida. Vuelve a iniciar sesion.' }, 401);
  }

  const status     = profile.subscription_status ?? 'canceled';
  const isPro      = status === 'pro';
  const isPlus     = status === 'plus';
  const isTrial    = status === 'trial';
  const isPastDue  = status === 'past_due';
  const isCanceled = status === 'canceled';

  // Bloquear usuarios con suscripcion no activa
  if (isPastDue) {
    return jsonResponse(
      { error: 'Hay un problema con tu metodo de pago. Ve a Plan y Pagos para actualizarlo.' },
      402,
    );
  }
  if (isCanceled) {
    return jsonResponse(
      { error: 'Suscripcion cancelada. Ve a Plan y Pagos para reactivarla.' },
      402,
    );
  }

  // ── 7. Reset mensual (trial y plus) ──────────────────────────────────
  const today        = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const currentMonth = today.slice(0, 7);                     // 'YYYY-MM'
  const lastResetMonth = (profile.last_reset_date ?? '').slice(0, 7);
  const needsReset = !isPro && currentMonth !== lastResetMonth;

  let copiesThisMonth = needsReset ? 0 : (profile.copies_this_month ?? 0);

  // Limite segun plan (canceled y past_due ya bloqueados arriba)
  const effectiveCopyLimit = isPro    ? Infinity
    : isPlus  ? PLUS_COPY_LIMIT
    : isTrial ? TRIAL_COPY_LIMIT
    : 0; // fallback: sin cuota

  // ── 8. Verificar cuota ────────────────────────────────────────────────
  if (!isPro && copiesThisMonth >= effectiveCopyLimit) {
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return jsonResponse(
      {
        limitReached: true,
        copiesUsed: copiesThisMonth,
        copiesLimit: effectiveCopyLimit,
        nextReset: nextReset.toISOString().slice(0, 10),
      },
      200,
    );
  }

  // ── 9. Incrementar copies_this_month ─────────────────────────────────
  const newCopiesCount = copiesThisMonth + 1;
  const updateData: Record<string, unknown> = {
    copies_this_month: isPro ? copiesThisMonth : newCopiesCount,
  };
  if (needsReset) {
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
      copiesLimit: isPro ? null : effectiveCopyLimit,
    },
    200,
  );
}
