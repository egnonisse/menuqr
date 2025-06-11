"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

interface UseAutoLogoutOptions {
  timeout?: number; // Temps d'inactivité en minutes (défaut: 30 min)
  warningTime?: number; // Temps d'avertissement en minutes avant déconnexion (défaut: 5 min)
  onWarning?: () => void; // Callback pour l'avertissement
  onLogout?: () => void; // Callback avant déconnexion
}

export function useAutoLogout({
  timeout = 30, // 30 minutes par défaut
  warningTime = 5, // 5 minutes d'avertissement
  onWarning,
  onLogout
}: UseAutoLogoutOptions = {}) {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Nettoyer les timers existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Définir le timer d'avertissement
    const warningTimeMs = (timeout - warningTime) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      onWarning?.();
    }, warningTimeMs);

    // Définir le timer de déconnexion
    const timeoutMs = timeout * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      onLogout?.();
      await signOut({ 
        callbackUrl: "/auth/signin?message=Session expirée par inactivité" 
      });
    }, timeoutMs);
  }, [timeout, warningTime, onWarning, onLogout]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const forceLogout = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    onLogout?.();
    await signOut({ 
      callbackUrl: "/auth/signin?message=Déconnexion manuelle" 
    });
  }, [onLogout]);

  useEffect(() => {
    if (!session) return;

    // Événements à surveiller pour détecter l'activité
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Ajouter les listeners d'événements
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Démarrer le timer initial
    resetTimer();

    // Nettoyer les listeners au démontage
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [session, resetTimer]);

  return {
    extendSession,
    forceLogout,
    timeRemaining: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = (timeout * 60 * 1000) - elapsed;
      return Math.max(0, Math.floor(remaining / 1000 / 60)); // minutes restantes
    }
  };
} 