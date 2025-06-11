"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClockIcon } from "@heroicons/react/24/outline";

interface SessionIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function SessionIndicator({ 
  className = "",
  showText = true 
}: SessionIndicatorProps) {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;

    // Calculer le temps restant basé sur la session JWT
    const updateTimeLeft = () => {
      if (session.expires) {
        const expiresAt = new Date(session.expires).getTime();
        const now = Date.now();
        const remaining = Math.max(0, expiresAt - now);
        setTimeLeft(remaining);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, [session]);

  if (!session || timeLeft === null) return null;

  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  // Afficher seulement si moins de 2 heures restantes
  if (hoursLeft > 2) return null;

  const isLowTime = hoursLeft === 0 && minutesLeft <= 15;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ClockIcon 
        className={`w-4 h-4 ${isLowTime ? 'text-red-500' : 'text-gray-500'}`} 
      />
      {showText && (
        <span 
          className={`text-sm ${isLowTime ? 'text-red-600 font-medium' : 'text-gray-600'}`}
        >
          Session : {hoursLeft > 0 ? `${hoursLeft}h ` : ''}{minutesLeft}min
        </span>
      )}
    </div>
  );
} 