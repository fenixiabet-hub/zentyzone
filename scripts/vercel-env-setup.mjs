/**
 * Zentyzone — Agrega todas las variables de entorno de Stripe a Vercel.
 *
 * PREREQUISITO: npx vercel login  (una sola vez)
 * USO:          node scripts/vercel-env-setup.mjs
 *
 * Este script lee .env.local y agrega a Vercel todas las vars de Stripe
 * que aún no estén configuradas allí, luego ejecuta un redeploy.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, '../.env.local');

if (!existsSync(envPath)) {
  console.error('❌ No se encontró .env.local');
  process.exit(1);
}

// Leer .env.local
const envVars = {};
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('#') || !t.includes('=')) continue;
  const idx = t.indexOf('=');
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim();
  if (key && val) envVars[key] = val;
}

// Variables a agregar a Vercel (SOLO las que Vercel necesita para las funciones serverless)
const STRIPE_VARS = [
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_PLUS',
  'STRIPE_PRICE_PRO',
  'STRIPE_WEBHOOK_SECRET',
  'VITE_SITE_URL',
];

console.log('🔗 Vinculando proyecto con Vercel...');
try {
  execSync('npx vercel link --yes --project zentyzone', { stdio: 'inherit', cwd: resolve(__dirname, '..') });
} catch {
  console.log('⚠ El link ya existe o se requiere autenticación. Continúa de todas formas.');
}

console.log('\n🌐 Agregando variables de entorno a Vercel...\n');

for (const key of STRIPE_VARS) {
  const val = envVars[key];
  if (!val) {
    console.log(`⚠ Saltando ${key} (vacío en .env.local)`);
    continue;
  }
  try {
    // Intenta eliminar si ya existe para evitar error de duplicado
    execSync(`echo "${val}" | npx vercel env rm ${key} production --yes 2>/dev/null || true`,
      { stdio: 'pipe', cwd: resolve(__dirname, '..') });
    // Agregar
    const result = execSync(
      `echo "${val}" | npx vercel env add ${key} production`,
      { stdio: 'pipe', cwd: resolve(__dirname, '..') }
    );
    console.log(`✅ ${key} → agregada`);
  } catch (err) {
    // Si falla, puede que ya exista — intentar con --force
    try {
      execSync(`printf '%s' "${val}" | npx vercel env add ${key} production`,
        { stdio: 'inherit', cwd: resolve(__dirname, '..') });
      console.log(`✅ ${key} → actualizada`);
    } catch {
      console.log(`⚠ ${key} → puede que ya exista en Vercel (revisa manualmente si es necesario)`);
    }
  }
}

console.log('\n🚀 Redesplegando en Vercel...');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit', cwd: resolve(__dirname, '..') });
  console.log('\n✅ Vercel actualizado con todas las variables de Stripe.');
} catch {
  console.log('\n⚠ El redeploy falló — usa git push para triggear el deploy automático.');
}
