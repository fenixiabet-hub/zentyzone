import type { Lang } from '../../translations';
interface FAQProps { lang: Lang; }
export function FAQ({ lang }: FAQProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">FAQ</h1>
      <p className="mt-2 text-sm opacity-50">
        {lang === 'es' ? '— stub · implementación en Paso 6 —' : '— stub · implementation in Step 6 —'}
      </p>
    </div>
  );
}
