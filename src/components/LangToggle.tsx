/**
 * Zentyzone — Boton para cambiar idioma (ES / EN)
 */
import { Languages } from 'lucide-react';
import { C } from '../theme';
import type { Lang } from '../translations';

interface LangToggleProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export function LangToggle({ lang, setLang }: LangToggleProps) {
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:bg-white"
      style={{
        border: `1px solid ${C.creamWarm}`,
        color: C.brownSoft,
        background: 'rgba(255,255,255,0.6)',
        fontWeight: 500,
      }}
    >
      <Languages className="w-3.5 h-3.5" />
      <span style={{ fontWeight: lang === 'es' ? 700 : 400, opacity: lang === 'es' ? 1 : 0.5 }}>
        ES
      </span>
      <span style={{ opacity: 0.3 }}>/</span>
      <span style={{ fontWeight: lang === 'en' ? 700 : 400, opacity: lang === 'en' ? 1 : 0.5 }}>
        EN
      </span>
    </button>
  );
}
