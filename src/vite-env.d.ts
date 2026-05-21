/// <reference types="vite/client" />

/**
 * Zentyzone — Tipos de las variables de entorno
 * ------------------------------------------------------------
 * Esto le dice a TypeScript que `import.meta.env.VITE_SUPABASE_URL`
 * (y la otra) existen y son texto. Solo afecta al editor/compilador.
 * ------------------------------------------------------------
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
