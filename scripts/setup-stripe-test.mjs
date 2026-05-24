/**
 * setup-stripe-test.mjs
 * Crea productos, precios y webhook en Stripe TEST MODE.
 * Usa la sk_test_ del .env.local.
 */
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer .env.local
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) envVars[m[1]] = m[2].trim();
}

const stripeKey = envVars['STRIPE_SECRET_KEY'];
if (!stripeKey || !stripeKey.startsWith('sk_test_')) {
  console.error('ERROR: STRIPE_SECRET_KEY no es una clave de test. Abortando.');
  process.exit(1);
}

console.log('Usando clave TEST:', stripeKey.slice(0, 12) + '...');
const stripe = new Stripe(stripeKey);

async function main() {
  // ── 1. Crear producto Plus ──────────────────────────────────────────
  console.log('\n[1/5] Creando producto Plus...');
  const plusProduct = await stripe.products.create({
    name: 'Zentyzone Plus',
    description: 'Plan Plus — 25 notas/mes, soporte prioritario, exportar notas.',
  });
  console.log('  Plus product ID:', plusProduct.id);

  // ── 2. Crear precio Plus $19.99/mes ─────────────────────────────────
  console.log('[2/5] Creando precio Plus ($19.99/mes)...');
  const plusPrice = await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1999,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('  Plus price ID:', plusPrice.id);

  // ── 3. Crear producto Pro ───────────────────────────────────────────
  console.log('[3/5] Creando producto Pro...');
  const proProduct = await stripe.products.create({
    name: 'Zentyzone Pro',
    description: 'Plan Pro — Notas ilimitadas, mayor capacidad de IA, soporte prioritario.',
  });
  console.log('  Pro product ID:', proProduct.id);

  // ── 4. Crear precio Pro $29.99/mes ──────────────────────────────────
  console.log('[4/5] Creando precio Pro ($29.99/mes)...');
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2999,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('  Pro price ID:', proPrice.id);

  // ── 5. Crear webhook ────────────────────────────────────────────────
  console.log('[5/5] Creando webhook para https://zentyzone.com...');
  const webhook = await stripe.webhookEndpoints.create({
    url: 'https://zentyzone.com/api/stripe-webhook',
    enabled_events: [
      'checkout.session.completed',
      'invoice.paid',
      'invoice.payment_failed',
      'customer.subscription.deleted',
    ],
    description: 'Zentyzone production webhook (test mode)',
  });
  console.log('  Webhook ID:', webhook.id);
  console.log('  Webhook secret:', webhook.secret);

  // ── Resumen ─────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('STRIPE_PRICE_PLUS=' + plusPrice.id);
  console.log('STRIPE_PRICE_PRO=' + proPrice.id);
  console.log('STRIPE_WEBHOOK_SECRET=' + webhook.secret);
  console.log('========================================\n');

  return {
    plusPriceId: plusPrice.id,
    proPriceId: proPrice.id,
    webhookSecret: webhook.secret,
  };
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
