/// <reference types="node" />
/**
 * Zentyzone — /api/sync-subscription
 * ---------------------------------------------------------
 * Sincroniza el estado de suscripción consultando el
 * Checkout Session de Stripe directamente.
 * Recibe el session_id que Stripe incluye en el success_url
 * via {CHECKOUT_SESSION_ID}. Bypass total del webhook.
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
  const stripeKey    = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl  = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;

  if (!stripeKey || !supabaseUrl || !supabaseAnon) {
    return jsonResponse({ error: 'Server configuration missing.' }, 500);
  }

  // ── 1. Auth ────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return jsonResponse({ error: 'Unauthorized.' }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonResponse({ error: 'Invalid session.' }, 401);

  // ── 2. Leer sessionId del body ─────────────────────────────
  let sessionId: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await request.json() as any;
    sessionId = body?.sessionId;
  } catch { /* sin body → intentar sin sessionId */ }

  try {
    const stripe = new Stripe(stripeKey);

    let sub: Stripe.Subscription | null = null;
    let chosenPlan = 'plus';
    let customerId: string | null = null;

    if (sessionId && sessionId.startsWith('cs_')) {
      // ── Ruta A: Usar Checkout Session ID (más fiable) ──────
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      console.log(`[sync] session retrieved: ${session.id} status=${session.status} payment_status=${session.payment_status} subscription_type=${typeof session.subscription}`);

      if (session.status !== 'complete') {
        console.log(`[sync] returning synced:false reason: session not complete (${session.status})`);
        return jsonResponse({ synced: false, reason: `Session not complete: ${session.status}` }, 200);
      }

      customerId = session.customer as string;
      chosenPlan = session.metadata?.chosen_plan ?? 'plus';

      // session.subscription puede ser: null | string (ID) | objeto expandido
      if (!session.subscription) {
        console.log('[sync] returning synced:false reason: no_subscription_on_session');
        return jsonResponse({ synced: false, reason: 'no_subscription_on_session' }, 200);
      }
      if (typeof session.subscription === 'string') {
        console.log(`[sync] subscription is string ID=${session.subscription}, haciendo retrieve explícito`);
        sub = await stripe.subscriptions.retrieve(session.subscription);
      } else {
        console.log('[sync] subscription ya es objeto expandido');
        sub = session.subscription as Stripe.Subscription;
      }
      console.log(`[sync] subscription status=${sub.status} id=${sub.id}`);

    } else {
      // ── Ruta B: Buscar por stripe_customer_id (fallback) ───
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        return jsonResponse({ synced: false, reason: 'No Stripe customer found.' }, 200);
      }

      customerId = profile.stripe_customer_id;
      const subs = await stripe.subscriptions.list({ customer: customerId!, limit: 5, status: 'all' });
      sub = subs.data.find(s => ['trialing', 'active', 'past_due'].includes(s.status)) ?? null;
      chosenPlan = sub?.metadata?.chosen_plan ?? 'plus';
    }

    if (!sub || !customerId) {
      return jsonResponse({ synced: false, reason: 'No subscription found.' }, 200);
    }

    // ── 3. Determinar nuevo estado ─────────────────────────────
    let newStatus: string;
    if (sub.status === 'trialing')  newStatus = 'trial';
    else if (sub.status === 'past_due') newStatus = 'past_due';
    else if (sub.status === 'active')   newStatus = chosenPlan === 'pro' ? 'pro' : 'plus';
    else return jsonResponse({ synced: false, reason: `Unexpected sub status: ${sub.status}` }, 200);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodEnd   = new Date(((sub as any).current_period_end as number) * 1000).toISOString();
    const trialEnd    = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

    // ── 4. Actualizar perfil via RPC ───────────────────────────
    const rpcParams = {
      p_stripe_customer_id:  customerId,
      p_subscription_id:     sub.id,
      p_subscription_status: newStatus,
      p_chosen_plan:         chosenPlan,
      p_trial_started_at:    sub.status === 'trialing' ? new Date().toISOString() : undefined,
      p_trial_ends_at:       trialEnd ?? undefined,
      p_period_end:          periodEnd,
      p_payment_failed:      sub.status === 'past_due',
      p_clear_subscription:  false,
    };
    console.log('[sync] llamando RPC update_profile_from_stripe con:', JSON.stringify(rpcParams));

    const { error: rpcErr } = await supabase.rpc('update_profile_from_stripe', rpcParams);

    if (rpcErr) {
      console.error('[sync] RPC error:', JSON.stringify(rpcErr));
      return jsonResponse({ error: 'Failed to update profile.', detail: rpcErr.message }, 500);
    }

    console.log(`[sync] RPC OK — user=${user.id} status=${newStatus} plan=${chosenPlan}`);
    return jsonResponse({ synced: true, status: newStatus, plan: chosenPlan }, 200);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sync] Error:', msg);
    return jsonResponse({ error: msg }, 500);
  }
}
