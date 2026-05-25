/**
 * Zentyzone — /api/check-email
 * ------------------------------------------------------------
 * Verifica si un email ya está registrado en auth.users.
 * Usa el service role key para bypassear RLS y consultar
 * auth.users directamente via GoTrue admin REST API.
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

    // Consulta directa al endpoint admin de GoTrue — no usa el SDK
    const url = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!res.ok) {
      console.error('[check-email] GoTrue admin response:', res.status);
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
    }

    const json = await res.json() as { users?: unknown[] };
    const exists = Array.isArray(json.users) && json.users.length > 0;

    return new Response(JSON.stringify({ exists }), { status: 200, headers: cors });

  } catch (err) {
    console.error('[check-email] unexpected error:', err);
    return new Response(JSON.stringify({ exists: false }), { status: 200, headers: cors });
  }
}
