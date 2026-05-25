/**
 * Zentyzone — /api/check-email
 * ------------------------------------------------------------
 * Verifica si un email ya está registrado en auth.users.
 * Usa la función RPC `check_email_exists` (SECURITY DEFINER)
 * que consulta auth.users con match exacto de email.
 *
 * Request:  POST { "email": "user@example.com" }
 * Response: 200  { "exists": true | false }
 *
 * Nunca retorna 4xx/5xx al cliente para no filtrar info
 * sensible — en caso de error interno retorna exists:false
 * (fail-open) y el signUp normal detectará duplicados.
 * ------------------------------------------------------------
 */

export async function POST(request: Request): Promise<Response> {
  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json() as { email?: string };
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
    }

    const supabaseUrl    = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[check-email] Missing env vars');
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
    }

    // Llama a la función RPC check_email_exists (SECURITY DEFINER — accede a auth.users)
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/check_email_exists`;
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ email_to_check: email }),
    });

    if (!res.ok) {
      console.error('[check-email] RPC error:', res.status, await res.text());
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
    }

    // La función retorna un boolean JSON (true o false)
    const exists = (await res.json()) === true;

    return new Response(JSON.stringify({ exists }), { status: 200, headers: cors });

  } catch (err) {
    console.error('[check-email] unexpected error:', err);
    return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
  }
}
