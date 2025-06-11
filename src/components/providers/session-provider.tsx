"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useState } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { SessionWarningModal } from "@/components/ui/session-warning-modal";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
  session?: Session | null;
}

function AutoLogoutHandler({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  
  const { extendSession, forceLogout } = useAutoLogout({
    timeout: 30, // 30 minutes d'inactivité
    warningTime: 5, // Avertissement 5 minutes avant
    onWarning: () => setShowWarning(true),
    onLogout: () => setShowWarning(false)
  });

  const handleExtendSession = () => {
    setShowWarning(false);
    extendSession();
  };

  const handleLogout = () => {
    setShowWarning(false);
    forceLogout();
  };

  return (
    <>
      {children}
      <SessionWarningModal
        isOpen={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
        timeRemaining={5 * 60} // 5 minutes en secondes
      />
    </>
  );
}

export function SessionProviderWrapper({ 
  children, 
  session 
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider session={session}>
      <AutoLogoutHandler>
        {children}
      </AutoLogoutHandler>
    </SessionProvider>
  );
} 