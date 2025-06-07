"use client";

import { useState, useRef } from "react";
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

export default function MenuPage() {
  const { data: session } = useSession();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    categoryName: "",
    description: "",
    image: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    emoji: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Get user's restaurant
  const { data: restaurant } = api.restaurant.getMine.useQuery(
    undefined,
    { enabled: !!session }
  );

  // tRPC queries
  const { data: menuItems = [], refetch: refetchItems } = api.menu.getItems.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );
  
  const { data: categories = [], refetch: refetchCategories } = api.menu.getCategories.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  const { data: stats } = api.menu.getStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // tRPC mutations for menu items
  const createItemMutation = api.menu.createItem.useMutation({
    onSuccess: () => {
      refetchItems();
      refetchCategories();
      setNewItem({ name: "", price: "", categoryName: "", description: "", image: "" });
      setShowAddModal(false);
    },
  });

  const toggleAvailabilityMutation = api.menu.updateItemAvailability.useMutation({
    onSuccess: () => {
      refetchItems();
    },
  });

  const deleteItemMutation = api.menu.deleteItem.useMutation({
    onSuccess: () => {
      refetchItems();
      refetchCategories();
    },
  });

  const updateItemMutation = api.menu.updateItem.useMutation({
    onSuccess: () => {
      refetchItems();
      refetchCategories();
      setEditingItem(null);
      setShowEditItemModal(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // tRPC mutations for categories
  const createCategoryMutation = api.menu.createCategory.useMutation({
    onSuccess: () => {
      refetchCategories();
      setNewCategory({ name: "", emoji: "", description: "" });
      setShowAddCategoryModal(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const updateCategoryMutation = api.menu.updateCategory.useMutation({
    onSuccess: () => {
      refetchCategories();
      setEditingCategory(null);
      setShowEditCategoryModal(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const deleteCategoryMutation = api.menu.deleteCategory.useMutation({
    onSuccess: () => {
      refetchCategories();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse. Taille maximum: 5MB");
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner un fichier image valide");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setNewItem(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.categoryName && restaurant?.id) {
      createItemMutation.mutate({
        name: newItem.name,
        price: parseFloat(newItem.price),
        categoryName: newItem.categoryName,
        description: newItem.description,
        image: newItem.image || undefined,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name && restaurant?.id) {
      createCategoryMutation.mutate({
        name: newCategory.name,
        emoji: newCategory.emoji || undefined,
        description: newCategory.description || undefined,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = () => {
    if (editingCategory && restaurant?.id) {
      updateCategoryMutation.mutate({
        categoryId: editingCategory.id,
        name: editingCategory.name,
        emoji: editingCategory.emoji || undefined,
        description: editingCategory.description || undefined,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (restaurant?.id && confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      deleteCategoryMutation.mutate({
        categoryId,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleToggleAvailability = (itemId: string, available: boolean) => {
    if (restaurant?.id) {
      toggleAvailabilityMutation.mutate({
        itemId,
        available: !available,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (restaurant?.id && confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) {
      deleteItemMutation.mutate({
        itemId,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      categoryName: item.category?.name || "",
      description: item.description || "",
      image: item.image || "",
    });
    setShowEditItemModal(true);
  };

  const handleUpdateItem = () => {
    if (editingItem && restaurant?.id) {
      updateItemMutation.mutate({
        itemId: editingItem.id,
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        categoryName: editingItem.categoryName,
        description: editingItem.description,
        image: editingItem.image || undefined,
        restaurantId: restaurant.id,
      });
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse. Taille maximum: 5MB");
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner un fichier image valide");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setEditingItem(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Popular category suggestions
  const popularCategories = [
    { emoji: "🥗", name: "Entrée" },
    { emoji: "🍽️", name: "Plat principal" },
    { emoji: "🍰", name: "Dessert" },
    { emoji: "🍷", name: "Boisson alcoolisée" },
    { emoji: "🧃", name: "Boisson non alcoolisée" },
    { emoji: "🍽️", name: "Menu enfant" },
    { emoji: "🥦", name: "Végétarien" },
  ];

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
              <h1 className="text-2xl font-semibold text-gray-900">Gestion du Menu</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gérez vos catégories et plats pour {restaurant.name}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Ajouter une catégorie
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Ajouter un plat
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats?.categories || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Catégories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.categories || 0}
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
                    <span className="text-white font-bold text-sm">{stats?.totalItems || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total plats
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalItems || 0}
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
                    <span className="text-white font-bold text-sm">{stats?.availableItems || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Disponibles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.availableItems || 0}
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
                    <span className="text-white font-bold text-sm">{stats?.unavailableItems || 0}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Indisponibles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.unavailableItems || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories management */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Gestion des Catégories
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gérez les catégories de votre menu avec des emojis personnalisés.
            </p>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune catégorie créée. Ajoutez votre première catégorie !</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {categories.map((category: any) => (
                <li key={category.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">{category.emoji || "📁"}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {category.items} plat(s)
                          </span>
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditCategory(category)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifier la catégorie"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.items > 0 || deleteCategoryMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title={category.items > 0 ? "Impossible de supprimer une catégorie avec des plats" : "Supprimer la catégorie"}
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

        {/* Menu Items list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Plats du Menu
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gérez tous les plats de votre menu.
            </p>
          </div>
          {menuItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun plat au menu. Ajoutez votre premier plat !</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {menuItems.map((item: any) => (
                <li key={item.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Disponible' : 'Indisponible'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.description || 'Aucune description'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <span className="font-semibold text-indigo-600">{item.price}€</span>
                          {item.category && (
                            <span className="ml-2">• {item.category.emoji} {item.category.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleToggleAvailability(item.id, item.available)}
                        className={`text-sm px-3 py-1 rounded ${
                          item.available 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {item.available ? 'Désactiver' : 'Activer'}
                      </button>
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifier le plat"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
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

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter une nouvelle catégorie
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: Entrées, Plats principaux..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={newCategory.emoji}
                      onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="🥗"
                      maxLength={4}
                    />
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Suggestions populaires:</p>
                      <div className="flex flex-wrap gap-1">
                        {popularCategories.map((cat, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setNewCategory({ ...newCategory, emoji: cat.emoji, name: newCategory.name || cat.name })}
                            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                          >
                            {cat.emoji} {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      rows={2}
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Description de la catégorie..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowAddCategoryModal(false);
                      setNewCategory({ name: "", emoji: "", description: "" });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name || createCategoryMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {createCategoryMutation.isPending ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditCategoryModal && editingCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Modifier la catégorie
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={editingCategory.emoji || ""}
                      onChange={(e) => setEditingCategory({ ...editingCategory, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="🥗"
                      maxLength={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      rows={2}
                      value={editingCategory.description || ""}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Description de la catégorie..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowEditCategoryModal(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={!editingCategory.name || updateCategoryMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {updateCategoryMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter un nouveau plat
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du plat
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: Burger Royal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: 12.50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={newItem.categoryName}
                      onChange={(e) => setNewItem({ ...newItem, categoryName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.name}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Vous devez d'abord créer au moins une catégorie.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Description du plat..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image du plat
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Choisir une image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {newItem.image && (
                        <img 
                          src={newItem.image} 
                          alt="Aperçu"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF jusqu'à 5MB
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!newItem.name || !newItem.price || !newItem.categoryName || createItemMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {createItemMutation.isPending ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditItemModal && editingItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Modifier le plat
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du plat
                    </label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: Burger Royal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: 12.50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={editingItem.categoryName}
                      onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.name}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Description du plat..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image du plat
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Changer l'image
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="hidden"
                      />
                      {editingItem.image && (
                        <img 
                          src={editingItem.image} 
                          alt="Aperçu"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF jusqu'à 5MB
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowEditItemModal(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateItem}
                    disabled={!editingItem.name || !editingItem.price || !editingItem.categoryName || updateItemMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {updateItemMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
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