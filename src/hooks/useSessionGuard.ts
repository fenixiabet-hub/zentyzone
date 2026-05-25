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

      // DEBUG — remover antes del deploy final
      console.log('[SESSION GUARD]', {
        activeInDB: profile?.active_session_id,
        currentSession: localSessionId,
        willKickout: !!(profile?.active_session_id && profile.active_session_id !== localSessionId),
      });

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

    // Primera validación inmediata
    checkSession();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [navigate]);
}
