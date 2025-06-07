"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "@/trpc/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");

  // Get restaurant for current user
  const { 
    data: restaurant, 
    isLoading: isLoadingRestaurant,
    refetch: refetchRestaurant 
  } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Get restaurant stats
  const { data: stats } = api.restaurant.getStats.useQuery(
    undefined,
    { enabled: !!restaurant }
  );

  // Create restaurant mutation
  const createRestaurantMutation = api.restaurant.create.useMutation({
    onSuccess: () => {
      refetchRestaurant();
      setShowCreateRestaurant(false);
      setRestaurantName("");
    },
  });

  const handleCreateRestaurant = () => {
    if (restaurantName.trim() && !createRestaurantMutation.isPending) {
      createRestaurantMutation.mutate({
        name: restaurantName.trim(),
      });
    }
  };

  // Show loading state while checking session and restaurant
  if (!session || isLoadingRestaurant) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

    // If user has no restaurant, show create form or welcome screen
  if (!restaurant) {
    // Show create restaurant form
    if (showCreateRestaurant) {
      return (
        <div className="py-6">
          <div className="max-w-lg mx-auto px-4 sm:px-6 md:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Créer votre restaurant
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du restaurant
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mon Super Restaurant"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowCreateRestaurant(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateRestaurant}
                    disabled={createRestaurantMutation.isPending || !restaurantName}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {createRestaurantMutation.isPending ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show welcome screen with create button
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue dans MenuQR !
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Pour commencer, créez votre restaurant.
            </p>
            <button
              onClick={() => setShowCreateRestaurant(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Créer mon restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard with restaurant stats
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Vue d'ensemble de {restaurant?.name}
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tables actives
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.tables || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Plats au menu
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.menuItems || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Réservations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.reservations || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avis clients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.feedbacks || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Welcome card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🎉 Bienvenue dans MenuQR !
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Votre restaurant <strong>{restaurant?.name}</strong> est maintenant configuré.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Informations utilisateur</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nom :</span> {session.user.name}</p>
                  <p><span className="font-medium">Email :</span> {session.user.email}</p>
                  <p><span className="font-medium">Restaurant :</span> {restaurant?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Actions rapides
            </h3>
            <div className="space-y-3">
              <a 
                href="/admin/tables"
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors block"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ajouter une table</p>
                    <p className="text-sm text-gray-500">Créer une nouvelle table avec QR code</p>
                  </div>
                </div>
              </a>
              <a 
                href="/admin/menu"
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors block"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ajouter un plat</p>
                    <p className="text-sm text-gray-500">Enrichir votre menu</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 