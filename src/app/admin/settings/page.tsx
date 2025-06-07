"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import ImageUpload from "@/components/ui/image-upload";

export default function SettingsPage() {
  const { data: settings, isPending: isLoadingSettings } = api.settings.getMine.useQuery();
  const { data: restaurant, refetch: refetchRestaurant } = api.restaurant.getMine.useQuery();
  const updateSettings = api.settings.update.useMutation({
    onSuccess: () => {
      alert("Paramètres mis à jour avec succès !");
    },
    onError: (error) => {
      alert("Erreur lors de la mise à jour : " + error.message);
    },
  });

  const updateRestaurantMutation = api.restaurant.update.useMutation({
    onSuccess: () => {
      refetchRestaurant();
      alert("Informations du restaurant mises à jour avec succès !");
    },
    onError: (error) => {
      alert("Erreur : " + error.message);
    },
  });

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState("#FF6600");
  const [commandeATable, setCommandeATable] = useState(false);
  const [showRating, setShowRating] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [currency, setCurrency] = useState("FCFA");

  // Restaurant form state
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl || "");
      setPrimaryColor(settings.primaryColor);
      setCommandeATable(settings.commandeATable);
      setShowRating(settings.showRating ?? true);
      setShowReviews(settings.showReviews ?? true);
      setCurrency(settings.currency || "FCFA");
    }
  }, [settings]);

  // Update restaurant form when data is loaded
  useEffect(() => {
    if (restaurant) {
      setRestaurantForm({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        logoUrl: logoUrl || undefined,
        primaryColor,
        commandeATable,
        showRating,
        showReviews,
        currency,
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantMutation.mutate(restaurantForm);
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres du restaurant</h1>
        <p className="text-gray-600">
          Configurez l'apparence et les fonctionnalités de votre restaurant
        </p>
      </div>

      <div className="space-y-8">
        {/* Restaurant Information Section */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🏢 Informations du restaurant
          </h2>
          <p className="text-gray-600 mb-6">
            Modifiez les informations publiques de votre restaurant
          </p>

          <form onSubmit={handleRestaurantSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du restaurant *
                </label>
                <input
                  type="text"
                  required
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du restaurant
                </label>
                <input
                  type="email"
                  value={restaurantForm.email}
                  onChange={(e) => setRestaurantForm({...restaurantForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={restaurantForm.phone}
                  onChange={(e) => setRestaurantForm({...restaurantForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="01 23 45 67 89"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  value={restaurantForm.address}
                  onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du restaurant
              </label>
              <textarea
                value={restaurantForm.description}
                onChange={(e) => setRestaurantForm({...restaurantForm, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Décrivez votre restaurant, sa spécialité, son ambiance..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateRestaurantMutation.isPending}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {updateRestaurantMutation.isPending ? "Sauvegarde..." : "Sauvegarder les informations"}
              </button>
            </div>
          </form>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🎨 Personnalisation visuelle
          </h2>
          <p className="text-gray-600 mb-6">
            Personnalisez l'apparence de votre menu et de votre mini-site
          </p>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo du restaurant
              </label>
              <ImageUpload
                onImageUpload={(url) => setLogoUrl(url)}
                currentImage={logoUrl}
                onRemoveImage={() => setLogoUrl("")}
                className="max-w-sm"
                type="logo"
              />
              <p className="text-sm text-gray-500 mt-1">
                Format recommandé : PNG, JPG ou WebP, taille maximale 5MB
              </p>
            </div>

            {/* Primary Color */}
            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#FF6600"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cette couleur sera utilisée pour les boutons et les éléments d'interface
              </p>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Devise
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="FCFA">FCFA (Franc CFA) - 1000 FCFA</option>
                <option value="EUR">EUR (Euro) - 10,50 €</option>
                <option value="USD">USD (Dollar) - $12.99</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Choisissez la devise qui sera affichée dans votre menu et sur votre site
              </p>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aperçu</label>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <button
                    style={{ backgroundColor: primaryColor }}
                    className="text-white px-4 py-2 rounded-lg font-medium"
                    disabled
                  >
                    Bouton exemple
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    Prix exemple: {currency === 'USD' ? '$12.99' : currency === 'EUR' ? '10,50 €' : '1000 FCFA'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🛒 Commande à table
          </h2>
          <p className="text-gray-600 mb-6">
            Activez ou désactivez la fonctionnalité de commande directe depuis les tables
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Activer la commande à table</h3>
                <p className="text-sm text-gray-600">
                  Permet aux clients de commander directement depuis leur table via le menu QR
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={commandeATable}
                  onChange={(e) => setCommandeATable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {commandeATable && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  ✅ Fonctionnalité activée
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Les boutons "Commander" apparaîtront sous chaque plat</li>
                  <li>• Les commandes seront créées automatiquement avec le numéro de table</li>
                  <li>• Vous pourrez gérer les commandes en temps réel dans le back-office</li>
                </ul>
              </div>
            )}

            {!commandeATable && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  📖 Mode consultation uniquement
                </h4>
                <p className="text-sm text-gray-600">
                  Les clients peuvent consulter le menu mais ne peuvent pas commander directement.
                  La prise de commande se fait manuellement par les serveurs.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Display Section */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ⭐ Affichage des avis
          </h2>
          <p className="text-gray-600 mb-6">
            Contrôlez l'affichage des avis et de la note moyenne sur votre mini-site
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Afficher la note moyenne</h3>
                <p className="text-sm text-gray-600">
                  Affiche la note moyenne et le nombre d'avis approuvés sur votre mini-site
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRating}
                  onChange={(e) => setShowRating(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Afficher les avis clients</h3>
                <p className="text-sm text-gray-600">
                  Affiche les avis clients approuvés dans la section témoignages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReviews}
                  onChange={(e) => setShowReviews(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">
                ℹ️ Important
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Le formulaire pour laisser un avis reste toujours accessible aux clients</li>
                <li>• Seuls les avis que vous approuvez dans la section "Avis Clients" seront affichés</li>
                <li>• Vous pouvez désactiver l'affichage sans affecter la collecte d'avis</li>
              </ul>
            </div>

            {!showRating && !showReviews && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  🔒 Affichage désactivé
                </h4>
                <p className="text-sm text-gray-600">
                  Les clients peuvent toujours laisser des avis, mais aucun avis ou note ne sera visible sur le mini-site.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updateSettings.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : (
            <>
              ⚙️ Enregistrer les paramètres
            </>
          )}
        </button>
      </div>
    </div>
  );
} 