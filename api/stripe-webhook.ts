/**
 * Zentyzone — /api/stripe-webhook
 * ---------------------------------------------------------
 * Recibe eventos de Stripe y actualiza los perfiles en
 * Supabase via RPC SECURITY DEFINER (sin service role key).
 *
 * Eventos manejados:
 *   checkout.session.completed → status = 'trial'
 *   invoice.paid               → status = 'plus' | 'pro'
 *   invoice.payment_failed     → status = 'past_due'
 *   customer.subscription.deleted → status = 'canceled'
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
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl   = process.env.VITE_SUPABASE_URL;
  const supabaseAnon  = process.env.VITE_SUPABASE_ANON_KEY;

  if (!stripeKey || !supabaseUrl || !supabaseAnon) {
    return jsonResponse({ error: 'Server configuration missing.' }, 500);
  }

  // ── 1. Leer body raw como Buffer (requerido por Stripe para verificar firma) ──
  const rawBodyBuffer = Buffer.from(await request.arrayBuffer());
  const signature     = request.headers.get('stripe-signature');
  const stripe        = new Stripe(stripeKey);

  // Diagnóstico (se puede quitar después)
  console.log('[webhook] secret length:', webhookSecret?.length ?? 0,
    '| secret prefix:', webhookSecret?.slice(0, 8) ?? 'none',
    '| sig present:', !!signature,
    '| body bytes:', rawBodyBuffer.length);

  // ── 2. Verificar firma ─────────────────────────────────────
  let event: Stripe.Event;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(rawBodyBuffer, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[webhook] Signature error:', msg,
        '| secret_len:', webhookSecret.length,
        '| secret_char0:', webhookSecret.charCodeAt(0));
      return jsonResponse({ error: 'Invalid signature.' }, 400);
    }
  } else {
    // Sin secret → test mode sin firma configurada
    try {
      event = JSON.parse(rawBodyBuffer.toString('utf-8')) as Stripe.Event;
    } catch {
      return jsonResponse({ error: 'Invalid JSON.' }, 400);
    }
  }

  // ── 3. Cliente Supabase (RPC usa SECURITY DEFINER) ────────
  const supabase = createClient(supabaseUrl, supabaseAnon);

  // Helper para llamar el RPC
  const updateProfile = async (params: {
    customer_id: string;
    subscription_id?: string | null;
    status?: string | null;
    chosen_plan?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    period_end?: string | null;
    payment_failed?: boolean | null;
    clear_subscription?: boolean;
    reset_copies?: boolean;        // true al inicio de cada ciclo pagado
  }) => {
    const { error } = await supabase.rpc('update_profile_from_stripe', {
      p_stripe_customer_id:  params.customer_id,
      p_subscription_id:     params.subscription_id    ?? null,
      p_subscription_status: params.status             ?? null,
      p_chosen_plan:         params.chosen_plan        ?? null,
      p_trial_started_at:    params.trial_started_at   ?? null,
      p_trial_ends_at:       params.trial_ends_at      ?? null,
      p_period_end:          params.period_end         ?? null,
      p_payment_failed:      params.payment_failed     ?? null,
      p_clear_subscription:  params.clear_subscription ?? false,
      p_reset_copies:        params.reset_copies       ?? false,
    });
    if (error) console.error('RPC error:', error);
  };

  // ── 4. Procesar evento ─────────────────────────────────────
  try {
    switch (event.type) {

      // ── checkout.session.completed → trial ─────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subId      = session.subscription as string;
        const chosenPlan = session.metadata?.chosen_plan ?? 'plus';

        let trialEnd: string | null = null;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          trialEnd = sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null;
        }

        await updateProfile({
          customer_id:      customerId,
          subscription_id:  subId,
          status:           'trial',
          chosen_plan:      chosenPlan,
          trial_started_at: new Date().toISOString(),
          trial_ends_at:    trialEnd,
          payment_failed:   false,
        });
        break;
      }

      // ── invoice.paid → plus | pro ──────────────────────────
      case 'invoice.paid': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;

        // Stripe API 2025: subscription puede estar en invoice.subscription (legacy)
        // o en invoice.parent.subscription_details.subscription (nuevo formato)
        const subId = (invoice.subscription as string | null)
          ?? (invoice.parent?.subscription_details?.subscription as string | null)
          ?? null;

        console.log('[webhook] invoice.paid id:', invoice.id,
          '| amount_paid:', invoice.amount_paid,
          '| subId:', subId,
          '| format:', invoice.subscription ? 'legacy' : 'parent.subscription_details');

        // Ignorar la factura $0 inicial del trial
        if (!subId || invoice.amount_paid === 0) {
          console.log('[webhook] invoice.paid skipped — no subId or amount_paid=0');
          break;
        }

        const customerId = invoice.customer as string;

        const sub        = await stripe.subscriptions.retrieve(subId);
        const chosenPlan = (sub.metadata?.chosen_plan)
          ?? (invoice.parent?.subscription_details?.metadata?.chosen_plan as string | undefined)
          ?? 'plus';
        const newStatus  = chosenPlan === 'pro' ? 'pro' : 'plus';

        // Stripe API 2025: current_period_end fue eliminado del objeto Subscription.
        // Usar invoice.lines[0].period.end (próxima renovación) como fallback a billing_cycle_anchor.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEndUnix = (invoice.lines?.data?.[0]?.period?.end as number | undefined)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?? ((sub as any).billing_cycle_anchor as number | undefined);
        const periodEnd  = periodEndUnix
          ? new Date(periodEndUnix * 1000).toISOString()
          : null;

        await updateProfile({
          customer_id:     customerId,
          subscription_id: subId,
          status:          newStatus,
          chosen_plan:     chosenPlan,
          period_end:      periodEnd,
          payment_failed:  false,
          reset_copies:    true,   // nuevo ciclo de facturación: reset copies_this_month
        });
        break;
      }

      // ── invoice.payment_failed → past_due ──────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await updateProfile({
          customer_id:   customerId,
          status:        'past_due',
          payment_failed: true,
        });
        break;
      }

      // ── customer.subscription.deleted → canceled ───────────
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await updateProfile({
          customer_id:        customerId,
          status:             'canceled',
          payment_failed:     false,
          clear_subscription: true,
        });
        break;
      }

      default:
        // Ignorar otros eventos
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return jsonResponse({ error: 'Processing error.' }, 500);
  }

  return jsonResponse({ received: true }, 200);
}
