import type { Lang } from '../../translations';
interface TutorialProps { lang: Lang; }
export function Tutorial({ lang }: TutorialProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Tutorial' : 'Tutorial'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 6 —</p>
    </div>
  );
}
