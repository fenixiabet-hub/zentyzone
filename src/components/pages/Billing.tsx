import type { Lang } from '../../translations';
interface BillingProps { lang: Lang; userId: string; }
export function Billing({ lang }: BillingProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Plan y Pagos' : 'Plan & Billing'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 5 —</p>
    </div>
  );
}
