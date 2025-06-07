"use client";

import { useState } from "react";
import { StarIcon, TrashIcon } from "@heroicons/react/24/solid";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export default function FeedbacksPage() {
  const { data: session } = useSession();

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // tRPC queries
  const { data: feedbacks = [], refetch: refetchFeedbacks } = api.feedbacks.getAll.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  const { data: stats } = api.feedbacks.getStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  const { data: recentFeedbacks = [] } = api.feedbacks.getRecent.useQuery(
    { 
      restaurantId: restaurant?.id || "",
      limit: 5
    },
    { enabled: !!restaurant?.id }
  );

  // tRPC mutations
  const deleteFeedbackMutation = api.feedbacks.delete.useMutation({
    onSuccess: () => {
      refetchFeedbacks();
    },
  });

  const approveFeedbackMutation = api.feedbacks.approve.useMutation({
    onSuccess: () => {
      refetchFeedbacks();
    },
  });

  const rejectFeedbackMutation = api.feedbacks.reject.useMutation({
    onSuccess: () => {
      refetchFeedbacks();
    },
  });

  const handleDeleteFeedback = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      deleteFeedbackMutation.mutate({ id });
    }
  };

  const handleApproveFeedback = (id: string) => {
    approveFeedbackMutation.mutate({ id });
  };

  const handleRejectFeedback = (id: string) => {
    rejectFeedbackMutation.mutate({ id });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-5 w-5 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Avis Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Consultez les retours de vos clients pour {restaurant.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats?.total || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total avis
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.total || 0}
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
                    <StarIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Note moyenne
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.averageRating || 0}/5
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
                    <span className="text-white font-bold text-sm">{stats?.positive || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avis positifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.positive || 0}
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
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats?.negative || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avis négatifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.negative || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Feedbacks */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Avis récents
            </h3>
          </div>
          {recentFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun avis récent</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentFeedbacks.map((feedback: any) => (
                <li key={feedback.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {renderStars(feedback.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {feedback.rating}/5
                          </span>
                          {feedback.table && (
                            <span className="ml-4 text-sm text-gray-500">
                              Table {feedback.table.number}
                            </span>
                          )}
                        </div>
                        {feedback.comment && (
                          <p className="text-gray-700 text-sm mb-2">
                            "{feedback.comment}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* All Feedbacks */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Tous les avis
            </h3>
          </div>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun avis client enregistré</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {feedbacks.map((feedback: any) => (
                <li key={feedback.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {renderStars(feedback.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {feedback.rating}/5
                          </span>
                          {feedback.table && (
                            <span className="ml-4 text-sm text-gray-500">
                              Table {feedback.table.number}
                            </span>
                          )}
                          <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            feedback.rating >= 4 
                              ? 'bg-green-100 text-green-800' 
                              : feedback.rating >= 3
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {feedback.rating >= 4 ? 'Positif' : feedback.rating >= 3 ? 'Neutre' : 'Négatif'}
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            feedback.isApproved 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.isApproved ? '✓ Approuvé' : '⏳ En attente'}
                          </span>
                        </div>
                        {feedback.comment && (
                          <p className="text-gray-700 text-sm mb-2">
                            "{feedback.comment}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!feedback.isApproved ? (
                          <button 
                            onClick={() => handleApproveFeedback(feedback.id)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 text-xs bg-green-100 rounded"
                            title="Approuver cet avis"
                          >
                            ✓ Approuver
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRejectFeedback(feedback.id)}
                            className="text-orange-600 hover:text-orange-900 px-2 py-1 text-xs bg-orange-100 rounded"
                            title="Retirer l'approbation"
                          >
                            ⏳ Retirer
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer cet avis"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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