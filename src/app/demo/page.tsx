"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import Link from "next/link";

export default function DemoPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  
  const { data: restaurants, isLoading: restaurantsLoading } = api.demo.getAvailableRestaurants.useQuery();
  const { data: stats } = api.demo.getDemoStats.useQuery();
  const { data: demoAccounts } = api.demo.getDemoAccounts.useQuery();

  const simulateQRScan = api.demo.simulateQRScan.useMutation({
    onSuccess: (data) => {
      alert(`${data.message}\n\nRedirection vers: ${data.redirectUrl}`);
      window.open(data.redirectUrl, '_blank');
    }
  });

  const handleQRScan = (restaurantSlug: string) => {
    const tableNumber = prompt("Entrez le numéro de table (optionnel):");
    simulateQRScan.mutate({
      restaurantSlug,
      tableNumber: tableNumber || undefined
    });
  };

  if (restaurantsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données de démo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎭 MenuQR - Espace Démo</h1>
              <p className="text-gray-600 mt-1">Interface de démonstration pour vos présentations clients</p>
            </div>
            <Link 
              href="/"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques globales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.restaurants}</div>
              <div className="text-gray-600">Restaurants</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.menuItems}</div>
              <div className="text-gray-600">Plats au menu</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.tables}</div>
              <div className="text-gray-600">Tables avec QR</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.approvedFeedbacks}</div>
              <div className="text-gray-600">Avis clients</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurants de démo disponibles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🍴 Restaurants de Démo</h2>
              
              <div className="space-y-6">
                {restaurants?.map((restaurant) => (
                  <div key={restaurant.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{restaurant.description}</p>
                        <p className="text-gray-500 text-sm mt-1">📍 {restaurant.address}</p>
                      </div>
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        DÉMO
                      </span>
                    </div>

                    {/* Statistiques du restaurant */}
                    <div className="flex space-x-4 mb-4">
                      <span className="text-sm text-gray-600">
                        📋 {restaurant.stats.menuItems} plats
                      </span>
                      <span className="text-sm text-gray-600">
                        🏷️ {restaurant.stats.categories} catégories
                      </span>
                      <span className="text-sm text-gray-600">
                        🪑 {restaurant.stats.tables} tables
                      </span>
                      <span className="text-sm text-gray-600">
                        ⭐ {restaurant.stats.feedbacks} avis
                      </span>
                    </div>

                    {/* Catégories */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {restaurant.categories.map((cat, index) => (
                        <span 
                          key={index}
                          className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {cat.emoji} {cat.name} ({cat.itemCount})
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Link
                        href={restaurant.demoUrl}
                        target="_blank"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        👁️ Voir le menu
                      </Link>
                      <button
                        onClick={() => handleQRScan(restaurant.slug)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        disabled={simulateQRScan.isPending}
                      >
                        📱 Simuler scan QR
                      </button>
                      <button
                        onClick={() => setSelectedRestaurant(restaurant.slug)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm"
                      >
                        ⚙️ Actions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comptes de démo et aide */}
          <div className="space-y-6">
            {/* Comptes de démo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Comptes de Démo</h3>
              <div className="space-y-4">
                {demoAccounts?.map((account, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      📧 {account.email}<br/>
                      🔑 {account.password}
                    </div>
                    {account.restaurant && (
                      <div className="text-sm text-gray-500 mt-2">
                        🍴 {account.restaurant.name}
                      </div>
                    )}
                    <Link
                      href="/auth/signin"
                      target="_blank"
                      className="inline-block mt-2 text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    >
                      Se connecter
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide rapide */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Guide Rapide</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Cliquez sur "Voir le menu" pour l'expérience client</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>Utilisez "Simuler scan QR" pour démontrer le scan</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <span>Connectez-vous avec les comptes demo pour l'admin</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Montrez les statistiques en temps réel</span>
                </div>
              </div>
            </div>

            {/* Liens utiles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Liens Utiles</h3>
              <div className="space-y-2 text-sm">
                <Link 
                  href="/GUIDE_DEMO.md" 
                  target="_blank"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  📖 Guide de démonstration complet
                </Link>
                <Link 
                  href="/auth/signin" 
                  target="_blank"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  🔐 Page de connexion
                </Link>
                <Link 
                  href="/dashboard" 
                  target="_blank"
                  className="block text-blue-600 hover:text-blue-800"
                >
                  📊 Tableau de bord admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'aide */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Conseils pour une démo réussie
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Commencez par l'expérience client (scan QR → menu)</li>
                  <li>Montrez ensuite l'interface admin avec les comptes de démo</li>
                  <li>Insistez sur la facilité de mise à jour du menu</li>
                  <li>Présentez les statistiques de scan QR</li>
                  <li>Terminez par les questions/réponses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}