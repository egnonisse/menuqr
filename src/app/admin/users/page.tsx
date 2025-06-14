"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Vérifier si l'utilisateur est super admin
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  // Requêtes tRPC
  const { data: pendingUsers = [], refetch: refetchUsers } = api.user.getPendingUsers.useQuery(
    undefined,
    { enabled: isSuperAdmin }
  );

  const { data: allUsers = [] } = api.user.getAllUsers.useQuery(
    undefined,
    { enabled: isSuperAdmin }
  );

  // Mutations
  const approveUserMutation = api.user.approveUser.useMutation({
    onSuccess: () => {
      toast.success("✅ Utilisateur approuvé avec succès!");
      refetchUsers();
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de l'approbation: " + error.message);
    },
  });

  const rejectUserMutation = api.user.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("✅ Utilisateur rejeté avec succès!");
      refetchUsers();
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("❌ Erreur lors du rejet: " + error.message);
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Accès refusé
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Vous devez être super-administrateur pour accéder à cette page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = (userId: string) => {
    approveUserMutation.mutate({ userId });
  };

  const handleReject = (userId: string) => {
    setSelectedUser(userId);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (selectedUser && rejectionReason.trim()) {
      rejectUserMutation.mutate({ 
        userId: selectedUser, 
        reason: rejectionReason.trim() 
      });
    } else {
      toast.error("❌ Veuillez spécifier une raison pour le rejet");
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Validez ou rejetez les demandes d&apos;inscription des restaurateurs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingUsers.length}</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approuvés</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {allUsers.filter(u => u.role === "ADMIN").length}
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
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejetés</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {allUsers.filter(u => u.role === "REJECTED").length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table des utilisateurs en attente */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Demandes en attente de validation
            </h3>
            
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande en attente</h3>
                <p className="mt-1 text-sm text-gray-500">Toutes les demandes ont été traitées.</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d&apos;inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name?.[0] || user.email[0]?.toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.restaurant?.name || "Non spécifié"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={approveUserMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {approveUserMutation.isPending ? "..." : "Approuver"}
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={rejectUserMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal de rejet */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-2 px-7 py-3">
                  <h3 className="text-lg font-medium text-gray-900 text-center">
                    Rejeter la demande
                  </h3>
                  <div className="mt-4">
                    <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
                      Raison du rejet (obligatoire)
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Expliquez pourquoi cette demande est rejetée..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={confirmReject}
                      disabled={!rejectionReason.trim() || rejectUserMutation.isPending}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {rejectUserMutation.isPending ? "Rejet..." : "Confirmer le rejet"}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectionReason("");
                        setSelectedUser(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 