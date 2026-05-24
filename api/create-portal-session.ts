/**
 * Zentyzone — /api/create-portal-session
 * ---------------------------------------------------------
 * Crea una sesión del Stripe Customer Portal para que el
 * usuario pueda gestionar su suscripción (cancelar, cambiar
 * método de pago, etc.)
 * ---------------------------------------------------------
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const stripeKey   = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl     = process.env.VITE_SITE_URL || 'https://zentyzone.com';

  if (!stripeKey || !supabaseUrl || !supabaseAnon) {
    return jsonResponse({ error: 'Server configuration missing.' }, 500);
  }

  // ── Auth ──────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return jsonResponse({ error: 'Unauthorized.' }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonResponse({ error: 'Invalid session.' }, 401);

  // ── Obtener stripe_customer_id ────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (!customerId) {
    return jsonResponse({ error: 'No subscription found.' }, 404);
  }

  // ── Crear sesión del portal ───────────────────────────────
  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/app/billing`,
    });
    return jsonResponse({ url: session.url }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Portal session error:', msg);
    return jsonResponse({ error: msg || 'Could not create portal session.' }, 500);
  }
}
