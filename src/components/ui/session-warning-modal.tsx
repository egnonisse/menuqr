"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface SessionWarningModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  timeRemaining: number; // en secondes
}

export function SessionWarningModal({
  isOpen,
  onExtend,
  onLogout,
  timeRemaining
}: SessionWarningModalProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(timeRemaining);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-orange-600">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Session expirée</h3>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Votre session va expirer par inactivité dans :
          </p>
          
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
            <ClockIcon className="w-8 h-8 text-orange-500 mr-3" />
            <span className="text-2xl font-mono font-bold text-gray-800">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-3 text-center">
            Cliquez sur "Rester connecté" pour prolonger votre session
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtend}
            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Rester connecté
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
} 