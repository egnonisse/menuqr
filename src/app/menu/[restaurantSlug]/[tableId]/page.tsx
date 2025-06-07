"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";
import { formatPrice, type Currency } from "@/utils/currency";

export default function MenuPage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;
  const tableId = params.tableId as string;
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<{[key: string]: {item: any, quantity: number, notes: string}}>({});
  const [showCart, setShowCart] = useState(false);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});

  // Get restaurant info
  const { data: restaurant } = api.restaurant.getBySlug.useQuery({ slug: restaurantSlug });
  
  // Get restaurant settings
  const { data: settings } = api.settings.getPublic.useQuery(
    { restaurantSlug },
    { enabled: !!restaurantSlug }
  );
  
  // Get menu items
  const { data: menuItems = [] } = api.menu.getItems.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Get categories
  const { data: categories = [] } = api.menu.getCategories.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Create order mutation
  const createOrder = api.orders.create.useMutation({
    onSuccess: () => {
      alert("Commande envoyée avec succès !");
      setCart({});
      setShowCart(false);
    },
    onError: (error) => {
      alert("Erreur lors de l'envoi de la commande : " + error.message);
    },
  });

  // Cart functions
  const addToCart = (item: any, quantityToAdd = 1) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        quantity: (prev[item.id]?.quantity || 0) + quantityToAdd,
        notes: prev[item.id]?.notes || ""
      }
    }));
    // Reset quantity selector after adding to cart
    setQuantities(prev => ({...prev, [item.id]: 1}));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId]) {
        if (newCart[itemId].quantity > 1) {
          newCart[itemId].quantity -= 1;
        } else {
          delete newCart[itemId];
        }
      }
      return newCart;
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart(prev => {
      if (prev[itemId]) {
        return {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            notes
          }
        };
      }
      return prev;
    });
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, cartItem) => 
      total + (cartItem.item.price * cartItem.quantity), 0
    );
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, cartItem) => 
      total + cartItem.quantity, 0
    );
  };

  // Get quantity for item (default 1)
  const getItemQuantity = (itemId: string) => {
    return quantities[itemId] || 1;
  };

  // Update quantity for item
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity >= 1 && quantity <= 99) {
      setQuantities(prev => ({...prev, [itemId]: quantity}));
    }
  };

  const handleOrder = async () => {
    if (Object.keys(cart).length === 0) {
      alert("Votre panier est vide !");
      return;
    }

    // Check if tableId is valid (not preview mode)
    if (tableId === "preview") {
      alert("Impossible de passer commande en mode preview. Veuillez utiliser un QR code d'une vraie table.");
      return;
    }

    const orderItems = Object.values(cart).map(cartItem => ({
      menuItemId: cartItem.item.id,
      quantity: cartItem.quantity,
      notes: cartItem.notes || undefined,
    }));

          try {
        await createOrder.mutateAsync({
          restaurantSlug,
          tableNumber: tableId,
          items: orderItems,
        });
      } catch (error) {
        // Error handled by onError callback
      }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  const filteredItems = selectedCategory 
    ? menuItems.filter((item: any) => item.category === selectedCategory)
    : menuItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {tableId === "preview" ? (
                <span className="text-orange-600 font-medium">
                  🔍 Mode Prévisualisation - Table {tableId}
                </span>
              ) : (
                `Table ${tableId}`
              )}
            </p>
            {tableId === "preview" && (
              <p className="text-xs text-orange-500 mt-1">
                La commande n'est pas disponible en mode prévisualisation
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === ""
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Tout voir
              </button>
              {categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {category.name} ({category.items})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun plat disponible</p>
            </div>
          ) : (
            filteredItems.map((item: any) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm border p-4 ${
                  !item.available ? "opacity-60" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Image du plat */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Informations du plat */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                        {!item.available && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Indisponible
                          </span>
                        )}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 mt-1 text-sm">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="text-xl font-bold text-indigo-600">
                      {formatPrice(item.price, settings?.currency as Currency)}
                    </span>
                    {settings?.commandeATable && item.available && tableId !== "preview" && (
                      <div className="mt-2 space-y-2">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-end gap-2">
                          <label className="text-sm text-gray-600">Qté:</label>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateItemQuantity(item.id, getItemQuantity(item.id) - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg"
                              disabled={getItemQuantity(item.id) <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={getItemQuantity(item.id)}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 h-8 text-center text-sm border-0 focus:outline-none"
                            />
                            <button
                              onClick={() => updateItemQuantity(item.id, getItemQuantity(item.id) + 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg"
                              disabled={getItemQuantity(item.id) >= 99}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {/* Commander Button */}
                        <button
                          onClick={() => addToCart(item, getItemQuantity(item.id))}
                          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          🛒 Commander {getItemQuantity(item.id) > 1 ? `(${getItemQuantity(item.id)})` : ''}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary (only show if ordering is enabled and cart has items) */}
        {settings?.commandeATable && getTotalItems() > 0 && tableId !== "preview" && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Votre commande</h3>
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="text-indigo-600 text-sm font-medium"
                >
                  {showCart ? "Masquer" : "Voir le détail"}
                </button>
              </div>
              
              {showCart && (
                <div className="space-y-3 mb-4">
                  {Object.values(cart).map((cartItem) => (
                    <div key={cartItem.item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <div className="font-medium">{cartItem.item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(cartItem.item.price, settings?.currency as Currency)} x {cartItem.quantity}
                        </div>
                        <input
                          type="text"
                          placeholder="Notes spéciales..."
                          value={cartItem.notes}
                          onChange={(e) => updateCartNotes(cartItem.item.id, e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => removeFromCart(cartItem.item.id)}
                          className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-bold hover:bg-red-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{cartItem.quantity}</span>
                        <button
                          onClick={() => addToCart(cartItem.item)}
                          className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-bold hover:bg-green-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total: {formatPrice(getTotalPrice(), settings?.currency as Currency)}</span>
                <span className="text-sm text-gray-500">{getTotalItems()} article(s)</span>
              </div>
              
              <button
                onClick={handleOrder}
                disabled={createOrder.isPending}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {createOrder.isPending ? "Envoi en cours..." : "🚀 Envoyer la commande"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Actions</h3>
            <div className="space-y-2">
              <a
                href={`/feedback/${restaurant.slug}/${tableId}`}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block"
              >
                ⭐ Donner votre avis
              </a>
              <a
                href={`/reservation/${restaurant.slug}`}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center block"
              >
                📅 Réserver une table
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by MenuQR</p>
        </div>
      </div>
    </div>
  );
} 