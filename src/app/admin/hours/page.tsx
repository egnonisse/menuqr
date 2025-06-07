"use client";

import { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultDayHours: DayHours = {
  isOpen: true,
  openTime: "09:00",
  closeTime: "22:00",
};

const defaultOpeningHours: OpeningHours = {
  monday: defaultDayHours,
  tuesday: defaultDayHours,
  wednesday: defaultDayHours,
  thursday: defaultDayHours,
  friday: defaultDayHours,
  saturday: defaultDayHours,
  sunday: { isOpen: false, openTime: "09:00", closeTime: "22:00" },
};

const daysOfWeek = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export default function HoursPage() {
  const { data: session } = useSession();
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours);
  const [isSaving, setIsSaving] = useState(false);

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Get current opening hours
  const { data: currentHours } = api.restaurant.getOpeningHours.useQuery(
    undefined,
    { enabled: !!restaurant }
  );

  // Update opening hours mutation
  const updateHoursMutation = api.restaurant.updateOpeningHours.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      alert("Horaires d'ouverture mis à jour avec succès !");
    },
    onError: () => {
      setIsSaving(false);
      alert("Erreur lors de la mise à jour des horaires");
    },
  });

  // Load current hours when data is available
  useEffect(() => {
    if (currentHours) {
      setOpeningHours(currentHours as OpeningHours);
    }
  }, [currentHours]);

  const handleDayToggle = (day: keyof OpeningHours) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
      },
    }));
  };

  const handleTimeChange = (day: keyof OpeningHours, timeType: 'openTime' | 'closeTime', value: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeType]: value,
      },
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    updateHoursMutation.mutate(openingHours);
  };

  const handleCopyToAll = (sourceDay: keyof OpeningHours) => {
    const sourceHours = openingHours[sourceDay];
    const newHours = { ...openingHours };
    
    Object.keys(newHours).forEach(day => {
      if (day !== sourceDay) {
        newHours[day as keyof OpeningHours] = { ...sourceHours };
      }
    });
    
    setOpeningHours(newHours);
  };

  // Show loading if no restaurant yet
  if (!restaurant) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <p className="text-gray-500">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Horaires d'ouverture</h1>
              <p className="mt-2 text-sm text-gray-700">
                Configurez les horaires d'ouverture de {restaurant.name}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || updateHoursMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Opening Hours Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Configuration des horaires
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Définissez vos horaires d'ouverture pour chaque jour de la semaine
            </p>
          </div>
          
          <div className="px-6 py-4">
            <div className="space-y-4">
              {daysOfWeek.map(({ key, label }) => {
                const dayHours = openingHours[key as keyof OpeningHours];
                
                return (
                  <div key={key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {/* Day name */}
                    <div className="w-24">
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                    
                    {/* Open/Closed toggle */}
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dayHours.isOpen}
                          onChange={() => handleDayToggle(key as keyof OpeningHours)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm text-gray-700">
                          {dayHours.isOpen ? 'Ouvert' : 'Fermé'}
                        </span>
                      </label>
                    </div>
                    
                    {/* Time inputs */}
                    {dayHours.isOpen && (
                      <>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">De</label>
                          <input
                            type="time"
                            value={dayHours.openTime}
                            onChange={(e) => handleTimeChange(key as keyof OpeningHours, 'openTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">à</label>
                          <input
                            type="time"
                            value={dayHours.closeTime}
                            onChange={(e) => handleTimeChange(key as keyof OpeningHours, 'closeTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        {/* Copy to all button */}
                        <button
                          onClick={() => handleCopyToAll(key as keyof OpeningHours)}
                          className="text-xs text-indigo-600 hover:text-indigo-900 underline"
                        >
                          Appliquer à tous
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Helper text */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">
                  Ces horaires seront affichés sur votre page publique. 
                  Vous pouvez facilement copier les horaires d'un jour vers tous les autres jours en utilisant le bouton "Appliquer à tous".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Aperçu des horaires
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Voici comment vos horaires apparaîtront aux clients
            </p>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {daysOfWeek.map(({ key, label }) => {
                const dayHours = openingHours[key as keyof OpeningHours];
                
                return (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className={`text-sm ${dayHours.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {dayHours.isOpen 
                        ? `${dayHours.openTime} - ${dayHours.closeTime}`
                        : 'Fermé'
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 