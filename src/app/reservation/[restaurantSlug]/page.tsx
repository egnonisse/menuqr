"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    peopleCount: 2,
    notes: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get restaurant info
  const { data: restaurant } = api.restaurant.getBySlug.useQuery({ slug: restaurantSlug });

  // Create reservation mutation
  const createReservationMutation = api.reservations.create.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setTimeout(() => {
        router.push(`/${restaurantSlug}`);
      }, 5000);
    },
    onError: (error) => {
      console.error("❌ Error creating reservation:", error);
      toast.error("❌ Erreur de réservation", {
        description: `Erreur lors de la création de la réservation: ${error.message}`,
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restaurant?.id && formData.name && formData.phone && formData.date && formData.time) {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      createReservationMutation.mutate({
        name: formData.name,
        phone: formData.phone,
        dateTime,
        peopleCount: parseInt(formData.peopleCount.toString(), 10),
        notes: formData.notes || undefined,
        restaurantId: restaurant.id,
      });
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Réservation confirmée !
            </h2>
            <p className="text-gray-600 mb-4">
              Merci {formData.name}, votre réservation chez {restaurant.name} a été enregistrée.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Détails de votre réservation :</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Date :</strong> {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure :</strong> {formData.time}</p>
                <p><strong>Nombre de personnes :</strong> {formData.peopleCount}</p>
                <p><strong>Téléphone :</strong> {formData.phone}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Vous allez être redirigé vers la page d'accueil...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Réserver une table</h1>
            <p className="text-sm text-gray-600 mt-1">{restaurant.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Votre nom"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="06 12 34 56 78"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                min={today}
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Heure *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                required
                value={formData.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* People Count */}
            <div>
              <label htmlFor="peopleCount" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de personnes *
              </label>
              <select
                id="peopleCount"
                name="peopleCount"
                required
                value={formData.peopleCount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} personne{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes particulières (optionnel)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Allergies, demandes spéciales..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createReservationMutation.isPending}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReservationMutation.isPending ? "Réservation en cours..." : "Confirmer ma réservation"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href={`/${restaurantSlug}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 