import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../context/AuthContext';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes d'inactivité
const WARNING_MS = 25 * 60 * 1000; // Avertissement à 25 minutes

/**
 * Déconnecte automatiquement l'utilisateur après 30 minutes d'inactivité.
 * Suit les events : click, keydown, mousemove, scroll, touchstart.
 */
export function useSessionTimeout(isAuthenticated: boolean) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  };

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;
    clearTimers();

    // Avertissement à 25 min
    warningRef.current = setTimeout(() => {
      // On pourrait afficher un toast ici si on avait un système de notification
      console.warn('[Session] Expiration dans 5 minutes.');
    }, WARNING_MS);

    // Déconnexion à 30 min
    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    }, TIMEOUT_MS);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // Démarrer le timer au montage

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, resetTimer]);
}
