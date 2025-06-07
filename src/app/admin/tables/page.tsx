"use client";

import { useState } from "react";
import { PlusIcon, QrCodeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import QrCodeGenerator from "@/components/QrCodeGenerator";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export default function TablesPage() {
  const { data: session } = useSession();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [newTableNumber, setNewTableNumber] = useState("");

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // tRPC queries
  const { data: tables = [], refetch: refetchTables } = api.tables.getAll.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );
  
  const { data: stats } = api.tables.getStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // tRPC mutations
  const createTableMutation = api.tables.create.useMutation({
    onSuccess: () => {
      refetchTables();
      setNewTableNumber("");
      setShowAddModal(false);
    },
  });

  const deleteTableMutation = api.tables.delete.useMutation({
    onSuccess: () => {
      refetchTables();
    },
  });

  const updateTableMutation = api.tables.update.useMutation({
    onSuccess: () => {
      refetchTables();
      setShowEditModal(false);
      setEditingTable(null);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleAddTable = () => {
    if (newTableNumber && !createTableMutation.isPending && restaurant?.id) {
      createTableMutation.mutate({
        number: newTableNumber.trim(),
        restaurantId: restaurant.id,
      });
    }
  };

  const handleDeleteTable = (id: string) => {
    if (!deleteTableMutation.isPending && confirm("Êtes-vous sûr de vouloir supprimer cette table ?")) {
      deleteTableMutation.mutate({ id });
    }
  };

  const handleShowQrCode = (table: any) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  const handleEditTable = (table: any) => {
    setEditingTable({
      id: table.id,
      number: table.number,
    });
    setShowEditModal(true);
  };

  const handleUpdateTable = () => {
    if (editingTable && restaurant?.id && editingTable.number.trim()) {
      updateTableMutation.mutate({
        id: editingTable.id,
        number: editingTable.number.trim(),
        restaurantId: restaurant.id,
      });
    }
  };

  const getQrCodeUrl = (table: any) => {
    if (!restaurant?.slug) return '';
    return `${window.location.origin}/menu/${restaurant.slug}/${table.number}`;
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Gestion des Tables</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gérez vos tables et leurs QR codes pour {restaurant.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={createTableMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Ajouter une table
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats?.active || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tables avec QR Code
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.withQR || 0} / {stats?.total || 0}
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
                  <QrCodeIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      QR Codes générés
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
                    <span className="text-white font-bold text-sm">{stats?.withoutQR || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tables sans QR Code
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.withoutQR || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {tables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune table configurée. Ajoutez votre première table !</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tables.map((table: any) => (
                <li key={table.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{table.number}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            Table {table.number}
                          </div>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          QR Code: {table.qrCodeUrl || 'Non généré'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleShowQrCode(table)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Voir le QR Code"
                      >
                        <QrCodeIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleEditTable(table)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifier la table"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTable(table.id)}
                        disabled={deleteTableMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Supprimer la table"
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

        {/* Add Table Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter une nouvelle table
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant de table
                  </label>
                  <input
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 4, A1, VIP-1, Terrasse-3"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez des lettres, chiffres, tirets ou espaces (max 20 caractères)
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddTable}
                    disabled={createTableMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {createTableMutation.isPending ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && selectedTable && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                  QR Code - Table {selectedTable.number}
                </h3>
                
                <div className="mb-4">
                  <QrCodeGenerator
                    value={getQrCodeUrl(selectedTable)}
                    size={200}
                    title={`Table ${selectedTable.number}`}
                    subtitle={`Scannez ce QR code pour accéder au menu`}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => window.open(getQrCodeUrl(selectedTable), '_blank')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Tester le lien
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Table Modal */}
        {showEditModal && editingTable && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Modifier la table
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant de table
                  </label>
                  <input
                    type="text"
                    value={editingTable.number}
                    onChange={(e) => setEditingTable({ ...editingTable, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 4, A1, VIP-1, Terrasse-3"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez des lettres, chiffres, tirets ou espaces (max 20 caractères)
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTable(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateTable}
                    disabled={!editingTable.number.trim() || updateTableMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {updateTableMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 