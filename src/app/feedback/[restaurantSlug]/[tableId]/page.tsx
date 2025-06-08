"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  const tableId = params.tableId as string;
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Array<{
    menuItemId: string;
    rating?: number;
    comment?: string;
  }>>([]);

  // Get restaurant info
  const { data: restaurant } = api.restaurant.getBySlug.useQuery({ slug: restaurantSlug });
  
  // Get menu items for tagging
  const { data: menuItems = [] } = api.menu.getItems.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Create feedback mutation
  const createFeedbackMutation = api.feedbacks.create.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setTimeout(() => {
        router.push(`/menu/${restaurantSlug}/${tableId}`);
      }, 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && restaurant?.id) {
      createFeedbackMutation.mutate({
        rating,
        comment: comment || undefined,
        restaurantId: restaurant.id,
        tableId,
        menuItems: selectedMenuItems.length > 0 ? selectedMenuItems : undefined,
      });
    }
  };

  const toggleMenuItem = (menuItemId: string, menuItemName: string) => {
    setSelectedMenuItems(prev => {
      const exists = prev.find(item => item.menuItemId === menuItemId);
      if (exists) {
        // Retirer le plat
        return prev.filter(item => item.menuItemId !== menuItemId);
      } else {
        // Ajouter le plat
        return [...prev, { menuItemId }];
      }
    });
  };

  const updateMenuItemRating = (menuItemId: string, rating: number) => {
    setSelectedMenuItems(prev => 
      prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, rating }
          : item
      )
    );
  };

  const updateMenuItemComment = (menuItemId: string, comment: string) => {
    setSelectedMenuItems(prev => 
      prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, comment }
          : item
      )
    );
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
              Merci pour votre avis !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre retour est précieux pour {restaurant.name}.
            </p>
            <p className="text-sm text-gray-500">
              Vous allez être redirigé vers le menu...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Votre avis compte</h1>
            <p className="text-sm text-gray-600 mt-1">{restaurant.name} - Table {tableId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Comment évaluez-vous votre expérience ?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-12 h-12 rounded-full transition-all ${
                      star <= rating
                        ? "text-yellow-400 scale-110"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600">
                  {rating === 0 && "Cliquez sur les étoiles"}
                  {rating === 1 && "Très décevant"}
                  {rating === 2 && "Décevant"}
                  {rating === 3 && "Correct"}
                  {rating === 4 && "Bien"}
                  {rating === 5 && "Excellent"}
                </span>
              </div>
            </div>

            {/* Menu Items Tagging */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quels plats avez-vous goûtés ? (optionnel)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {menuItems.map((item: any) => {
                  const isSelected = selectedMenuItems.find(selected => selected.menuItemId === item.id);
                  return (
                    <div key={item.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={!!isSelected}
                        onChange={() => toggleMenuItem(item.id, item.name)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`item-${item.id}`} className="ml-2 text-sm text-gray-700">
                        {item.name} 
                        {item.category && (
                          <span className="text-gray-500 ml-1">({item.category.name})</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              
              {/* Detailed ratings for selected items */}
              {selectedMenuItems.length > 0 && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Évaluez vos plats sélectionnés :
                  </h4>
                  {selectedMenuItems.map((selectedItem) => {
                    const menuItem = menuItems.find((item: any) => item.id === selectedItem.menuItemId);
                    if (!menuItem) return null;
                    
                    return (
                      <div key={selectedItem.menuItemId} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {menuItem.name}
                        </div>
                        
                        {/* Rating pour ce plat */}
                        <div className="mb-2">
                          <label className="block text-xs text-gray-600 mb-1">Note :</label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateMenuItemRating(selectedItem.menuItemId, star)}
                                className={`w-6 h-6 ${
                                  star <= (selectedItem.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300 hover:text-yellow-300"
                                } transition-colors`}
                              >
                                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Commentaire pour ce plat */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Commentaire :</label>
                          <input
                            type="text"
                            value={selectedItem.comment || ""}
                            onChange={(e) => updateMenuItemComment(selectedItem.menuItemId, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Votre avis sur ce plat..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire général (optionnel)
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Partagez votre expérience globale avec nous..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={rating === 0 || createFeedbackMutation.isPending}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createFeedbackMutation.isPending ? "Envoi en cours..." : "Envoyer mon avis"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href={`/menu/${restaurantSlug}/${tableId}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Retour au menu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 