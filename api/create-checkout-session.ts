/**
 * Zentyzone — /api/create-checkout-session
 * ---------------------------------------------------------
 * Crea una sesión de Stripe Checkout con prueba de 5 días.
 * El usuario elige 'plus' o 'pro'. Requiere JWT valido.
 * ---------------------------------------------------------
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const VALID_PLANS = ['plus', 'pro'] as const;
type Plan = (typeof VALID_PLANS)[number];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  // ── 1. Env vars ────────────────────────────────────────────
  const stripeKey    = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl  = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl      = process.env.VITE_SITE_URL || 'https://zentyzone.vercel.app';

  if (!stripeKey || !supabaseUrl || !supabaseAnon) {
    console.error('Missing env vars:', { stripeKey: !!stripeKey, supabaseUrl: !!supabaseUrl, supabaseAnon: !!supabaseAnon });
    return jsonResponse({ error: 'Server configuration missing.' }, 500);
  }

  // ── 2. Auth header ─────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return jsonResponse({ error: 'Unauthorized.' }, 401);

  // ── 3. Body ────────────────────────────────────────────────
  let body: { plan?: Plan; origin?: 'onboarding' | 'billing' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try { body = await request.json() as any; }
  catch { return jsonResponse({ error: 'Invalid JSON.' }, 400); }

  const { plan, origin } = body;
  if (!plan || !VALID_PLANS.includes(plan)) {
    return jsonResponse({ error: 'Invalid plan. Must be "plus" or "pro".' }, 400);
  }

  // ── 4. Verificar JWT ───────────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonResponse({ error: 'Invalid session.' }, 401);

  // ── 5. Price ID ────────────────────────────────────────────
  const priceId = plan === 'plus'
    ? process.env.STRIPE_PRICE_PLUS
    : process.env.STRIPE_PRICE_PRO;

  if (!priceId) {
    console.error('Price ID not configured for plan:', plan);
    return jsonResponse({ error: 'Price not configured.' }, 500);
  }

  // ── 6. Todo lo de Stripe en un solo try-catch ──────────────
  try {
    const stripe = new Stripe(stripeKey);

    // Obtener o crear cliente Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 5,
        metadata: { supabase_user_id: user.id, chosen_plan: plan },
      },
      success_url: origin === 'onboarding'
        ? `${siteUrl}/onboarding?checkout=success&plan=${plan}`
        : `${siteUrl}/app/billing?checkout=success&plan=${plan}`,
      cancel_url: origin === 'onboarding'
        ? `${siteUrl}/onboarding?checkout=canceled`
        : `${siteUrl}/app/billing?checkout=canceled`,
      metadata: { supabase_user_id: user.id, chosen_plan: plan },
    });

    return jsonResponse({ url: session.url }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Stripe/Supabase error in checkout:', msg);
    return jsonResponse({ error: msg || 'Could not create checkout session.' }, 500);
  }
}
