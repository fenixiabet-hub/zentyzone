import type { Lang } from '../../translations';
interface GlossaryProps { lang: Lang; }
export function Glossary({ lang }: GlossaryProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Glosario ABA' : 'ABA Glossary'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 6 —</p>
    </div>
  );
}
