"use client";

import { useState } from "react";
import { StarIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export default function MenuAnalyticsPage() {
  const { data: session } = useSession();

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Get menu item statistics
  const { data: menuItemStats = [] } = api.feedbacks.getMenuItemStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-100";
    if (rating >= 3) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics des Plats</h1>
          <p className="mt-2 text-sm text-gray-700">
            Analysez la popularité et les avis de vos plats pour {restaurant.name}
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Statistiques par Plat
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Classés par nombre de mentions dans les avis
            </p>
          </div>
          
          {menuItemStats.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée d'analytics disponible</h3>
              <p className="text-sm text-gray-500 mb-4">
                Les analytics apparaîtront quand vos clients mentionneront des plats dans leurs avis
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Comment obtenir des analytics ?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Encouragez vos clients à mentionner des plats spécifiques</li>
                  <li>• Utilisez la fonction @ dans les avis (ex: @Pizza Margherita)</li>
                  <li>• Plus d'avis détaillés = plus d'insights utiles</li>
                </ul>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {menuItemStats.map((stat: any) => (
                <li key={stat.menuItem.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">
                            {stat.menuItem.name}
                          </h4>
                          {stat.menuItem.category && (
                            <span className="ml-2 text-xs text-gray-500">
                              {stat.menuItem.category.emoji} {stat.menuItem.category.name}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {stat.totalMentions}
                            </span>
                            <span className="ml-1 text-sm text-gray-500">
                              mention{stat.totalMentions > 1 ? 's' : ''}
                            </span>
                          </div>
                          {stat.averageRating && (
                            <div className="flex items-center">
                              <div className="flex mr-1">
                                {renderStars(Math.round(stat.averageRating))}
                              </div>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRatingColor(stat.averageRating)}`}>
                                {stat.averageRating}/5
                              </span>
                              <span className="ml-1 text-sm text-gray-500">
                                ({stat.totalRatings} note{stat.totalRatings > 1 ? 's' : ''})
                              </span>
                            </div>
                          )}
                        </div>
                        {stat.comments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 italic">
                              "{stat.comments[0]}"
                            </p>
                            {stat.comments.length > 1 && (
                              <p className="text-xs text-gray-500 mt-1">
                                +{stat.comments.length - 1} autre{stat.comments.length > 2 ? 's' : ''} commentaire{stat.comments.length > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 