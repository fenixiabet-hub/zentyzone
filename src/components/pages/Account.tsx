import type { Lang } from '../../translations';
interface AccountProps { lang: Lang; setLang: (l: Lang) => void; userId: string; userEmail: string; onLogout: () => void; }
export function Account({ lang }: AccountProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">{lang === 'es' ? 'Mi Cuenta' : 'My Account'}</h1>
      <p className="mt-2 text-sm opacity-50">— stub · implementación en Paso 5 —</p>
    </div>
  );
}
