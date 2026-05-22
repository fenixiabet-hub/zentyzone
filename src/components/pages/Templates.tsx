import type { Lang } from '../../translations';
interface TemplatesProps { lang: Lang; userId: string; }
export function Templates({ lang }: TemplatesProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Plantillas' : 'Templates'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 7 —</p>
    </div>
  );
}
