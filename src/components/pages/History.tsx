import type { Lang } from '../../translations';
interface HistoryProps { lang: Lang; userId: string; }
export function History({ lang }: HistoryProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Historial' : 'History'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 5 —</p>
    </div>
  );
}
