"use client";

import { useState } from "react";
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { getNotificationColor } from "@/lib/subscription";
import Link from "next/link";

interface SoftLimitNotificationProps {
  level: 'normal' | 'warning' | 'urgent' | 'critical';
  message: string;
  percentage: number;
  onDismiss?: () => void;
  showUpgrade?: boolean;
  type?: 'scans' | 'restaurants' | 'feature';
  className?: string;
}

export function SoftLimitNotification({
  level,
  message,
  percentage,
  onDismiss,
  showUpgrade = true,
  type = 'scans',
  className = '',
}: SoftLimitNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || level === 'normal') return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getIcon = () => {
    switch (level) {
      case 'critical':
      case 'urgent':
        return <ExclamationTriangleIcon className="h-5 w-5 text-current" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-current" />;
    }
  };

  const getProgressBarColor = () => {
    switch (level) {
      case 'critical':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getUpgradeText = () => {
    switch (type) {
      case 'restaurants':
        return 'Créer plus de restaurants';
      case 'feature':
        return 'Débloquer cette fonctionnalité';
      default:
        return 'Augmenter ma limite';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getNotificationColor(level)} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {message}
            </p>
            
            {/* Progress bar pour les limites d'usage */}
            {(type === 'scans' || type === 'restaurants') && (
              <div className="mt-2">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Utilisation actuelle</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            {showUpgrade && (
              <div className="mt-3 flex items-center space-x-3">
                <Link href="/pricing">
                  <Button
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-current border-current/30"
                    variant="outline"
                  >
                    {getUpgradeText()}
                  </Button>
                </Link>
                
                {level !== 'critical' && (
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-current/70 hover:text-current underline"
                  >
                    Plus tard
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bouton de fermeture */}
        <button
          onClick={handleDismiss}
          className="text-current/70 hover:text-current ml-4 flex-shrink-0"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Composant wrapper qui utilise les hooks
export function AutoSoftLimitNotification() {
  const { getScansLimitStatus, getRestaurantsLimitStatus } = useSubscription();
  
  const scansStatus = getScansLimitStatus();
  const restaurantsStatus = getRestaurantsLimitStatus();

  return (
    <div className="space-y-4">
      {/* Notification pour les scans */}
      {scansStatus?.shouldNotify && scansStatus.message && (
        <SoftLimitNotification
          level={scansStatus.level}
          message={scansStatus.message}
          percentage={scansStatus.percentage * 100}
          type="scans"
        />
      )}

      {/* Notification pour les restaurants */}
      {restaurantsStatus?.shouldNotify && restaurantsStatus.message && (
        <SoftLimitNotification
          level={restaurantsStatus.level}
          message={restaurantsStatus.message}
          percentage={restaurantsStatus.percentage * 100}
          type="restaurants"
        />
      )}
    </div>
  );
}

// Import du hook pour le composant wrapper
import { useSubscription } from "@/hooks/useSubscription"; 