/**
 * useSessionGuard — Vigilancia de sesión única
 * -------------------------------------------------------
 * Verifica cada 30 seg (y al volver al tab) que el
 * active_session_id del servidor coincida con el guardado
 * en localStorage. Si no coincide → otro dispositivo tomó
 * la cuenta → cierra sesión y redirige a /login?reason=session_taken
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useSessionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const localSessionId = localStorage.getItem('zenty_session_id');
      if (!localSessionId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_session_id')
        .eq('id', user.id)
        .single();

      // Si el servidor tiene un session_id diferente → otra sesión activa
      if (
        profile?.active_session_id &&
        profile.active_session_id !== localSessionId
      ) {
        await supabase.auth.signOut();
        localStorage.removeItem('zenty_session_id');
        navigate('/login?reason=session_taken');
      }
    };

    // Validar cada 30 segundos
    const interval = setInterval(checkSession, 30_000);

    // Validar al volver al tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Primera validación con 2 s de gracia:
    // El guard puede montar mientras Login.tsx aún está escribiendo
    // active_session_id en la DB (await ~100 ms). Si corríamos
    // checkSession() inmediatamente, el localStorage ya tenía el nuevo
    // ID pero la DB todavía tenía el anterior → mismatch → kickout falso.
    // Con 2 s, ambos están escritos y consistentes antes de la primera
    // comparación. No afecta la detección de multi-dispositivo: el
    // visibilitychange y el intervalo de 30 s cubren esos casos.
    const initialTimer = setTimeout(checkSession, 2000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [navigate]);
}
