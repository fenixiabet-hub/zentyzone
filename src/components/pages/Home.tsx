import type { Lang } from '../../translations';

interface HomeProps {
  lang: Lang;
  userId: string;
  userName: string;
}

export function Home({ lang, userName }: HomeProps) {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">
        {lang === 'es' ? `Hola, ${userName} 👋` : `Hi, ${userName} 👋`}
      </h1>
      <p className="mt-2 text-sm opacity-50">
        {lang === 'es' ? '— stub Home · implementación en Paso 5 —' : '— stub Home · implementation in Step 5 —'}
      </p>
    </div>
  );
}
