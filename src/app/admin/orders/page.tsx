"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";

type OrderStatus = "pending" | "preparing" | "served" | "cancelled";

const statusConfig = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
  },
  preparing: {
    label: "En préparation", 
    color: "bg-blue-100 text-blue-800",
  },
  served: {
    label: "Servi",
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-100 text-red-800",
  },
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const { data: orders, isPending: isLoadingOrders, refetch } = api.orders.getAll.useQuery();
  const { data: stats, isPending: isLoadingStats } = api.orders.getStats.useQuery();
  
  const updateOrderStatus = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      alert("Statut de la commande mis à jour !");
      refetch();
    },
    onError: (error) => {
      alert("Erreur : " + error.message);
    },
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId,
        status: newStatus,
      });
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const filteredOrders = orders?.filter(order => 
    selectedStatus === "all" || order.status === selectedStatus
  ) || [];

  if (isLoadingOrders || isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des commandes</h1>
        <p className="text-gray-600">
          Suivez et gérez les commandes de vos clients en temps réel
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-gray-400">🛒</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="text-yellow-400">⏰</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En préparation</p>
                <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
              </div>
              <div className="text-blue-400">👨‍🍳</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Servies</p>
                <p className="text-2xl font-bold text-green-600">{stats.served}</p>
              </div>
              <div className="text-green-400">✅</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "all", label: "Toutes" },
              { key: "pending", label: "En attente" },
              { key: "preparing", label: "En préparation" },
              { key: "served", label: "Servies" },
              { key: "cancelled", label: "Annulées" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedStatus === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
            <p className="text-gray-600">
              {selectedStatus === "all" 
                ? "Aucune commande n'a été passée pour le moment."
                : `Aucune commande avec le statut "${statusConfig[selectedStatus as OrderStatus]?.label || selectedStatus}".`
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = order.status as OrderStatus;
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Table {order.tableNumber}
                        </h3>
                        <p className="text-gray-600">
                          {order.customerName && `${order.customerName} • `}
                          {new Date(order.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status]?.color}`}>
                        {statusConfig[status]?.label}
                      </span>
                      <div className="text-lg font-bold">
                        {order.totalAmount.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="font-medium">{item.menuItem.name}</div>
                          {item.notes && (
                            <div className="text-sm text-gray-500 italic">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">x{item.quantity}</span>
                          <span className="font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Notes de la commande:</div>
                      <div className="text-sm text-gray-600">{order.notes}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    {status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, "preparing")}
                          disabled={updateOrderStatus.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          👨‍🍳 Commencer la préparation
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                          disabled={updateOrderStatus.isPending}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          ❌ Annuler
                        </button>
                      </>
                    )}
                    
                    {status === "preparing" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "served")}
                        disabled={updateOrderStatus.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        ✅ Marquer comme servi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 