/**
 * Zentyzone — Conexion a Supabase
 * ------------------------------------------------------------
 * Crea el "cliente" de Supabase que usara la app para el login
 * de usuarios y para leer/escribir en la base de datos.
 *
 * Usa la URL y la clave PUBLICA (anon / publishable). Esa clave
 * es segura en el navegador porque la base de datos esta
 * protegida por las reglas de seguridad (RLS).
 * ------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
      'Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local',
  );
}

/** Cliente de Supabase compartido por toda la app. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// Tipos de las filas de la base de datos
// ============================================================

/** Una fila de la tabla `profiles`. */
export interface Profile {
  id: string;
  email: string | null;
  subscription_status: 'free' | 'pro';
  notes_generated_count: number;
  copies_this_month: number;
  generations_this_month: number;
  last_reset_date: string | null;
  active_session_id: string | null;
  last_login_at: string | null;
  pro_renewal_date: string | null;
  created_at: string;
}

/** Una fila de la tabla `notes`. */
export interface Note {
  id: string;
  user_id: string;
  created_at: string;
  client_initials: string | null;
  session_date: string | null;
  duration_minutes: number | null;
  note_type: 'rbt_daily' | 'soap' | 'bcba_progress' | null;
  input_text: string | null;
  output_text: string | null;
}
