"use client";

import { useState } from "react";
import { CalendarDaysIcon, ClockIcon, UserIcon, PhoneIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // tRPC queries
  const { data: reservations = [], refetch: refetchReservations } = api.reservations.getAll.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );
  
  const { data: reservationsByDate = [] } = api.reservations.getByDate.useQuery(
    { 
      restaurantId: restaurant?.id || "",
      date: new Date(selectedDate)
    },
    { enabled: !!restaurant?.id }
  );

  const { data: stats } = api.reservations.getStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // tRPC mutations
  const deleteReservationMutation = api.reservations.delete.useMutation({
    onSuccess: () => {
      refetchReservations();
    },
  });

  const handleDeleteReservation = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      deleteReservationMutation.mutate({ id });
    }
  };

  const formatDateTime = (dateTime: Date) => {
    return new Date(dateTime).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateTime: Date) => {
    return new Date(dateTime).toLocaleTimeString('fr-FR', {
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
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des Réservations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Suivez et gérez les réservations de {restaurant.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Aujourd'hui
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.today || 0}
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
                    <span className="text-white font-bold text-sm">{stats?.total || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total
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
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats?.confirmed || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Confirmées
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.confirmed || 0}
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
                    <span className="text-white font-bold text-sm">{stats?.pending || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      En attente
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.pending || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
              Filtrer par date :
            </label>
            <input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">
              {reservationsByDate.length} réservation{reservationsByDate.length > 1 ? 's' : ''} ce jour
            </span>
          </div>
        </div>

        {/* Reservations for selected date */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Réservations du {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </h3>
          </div>
          {reservationsByDate.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune réservation pour cette date</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {reservationsByDate.map((reservation: any) => (
                <li key={reservation.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(reservation.dateTime)}
                          </span>
                          <span className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {reservation.peopleCount} personne{reservation.peopleCount > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {reservation.customerPhone}
                          </span>
                        </div>
                        {reservation.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            Note: {reservation.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmée
                      </span>
                      <button 
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="text-red-600 hover:text-red-900"
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

        {/* All Reservations */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Toutes les réservations
            </h3>
          </div>
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune réservation enregistrée</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {reservations.map((reservation: any) => (
                <li key={reservation.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(reservation.dateTime)} • {reservation.peopleCount} personne{reservation.peopleCount > 1 ? 's' : ''} • {reservation.customerPhone}
                        </div>
                        {reservation.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            Note: {reservation.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmée
                      </span>
                      <button 
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="text-red-600 hover:text-red-900"
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
      </div>
    </div>
  );
} 