"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { 
  PhotoIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ShareIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import ImageUpload from "@/components/ui/image-upload";

interface Slider {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  order: number;
}



interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

export default function HomepagePage() {
  const [activeTab, setActiveTab] = useState<'general' | 'sliders' | 'social'>('general');
  const [newSlider, setNewSlider] = useState({ title: '', subtitle: '', imageUrl: '' });
  const [presentation, setPresentation] = useState('');
  const [reservationBtnText, setReservationBtnText] = useState('Réserver une table');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: 'Facebook', url: '', enabled: false },
    { platform: 'Instagram', url: '', enabled: false },
    { platform: 'Twitter', url: '', enabled: false },
  ]);
  const [linkCopied, setLinkCopied] = useState(false);

  // tRPC queries and mutations
  const { data: homepage, refetch } = api.homepage.getMine.useQuery();
  const { data: restaurant, refetch: refetchRestaurant } = api.restaurant.getMine.useQuery();
  const createOrUpdateMutation = api.homepage.createOrUpdate.useMutation({
    onSuccess: () => void refetch(),
  });
  const updateRestaurantMutation = api.restaurant.update.useMutation({
    onSuccess: () => void refetchRestaurant(),
  });
  const addSliderMutation = api.homepage.addSlider.useMutation({
    onSuccess: () => {
      void refetch();
      setNewSlider({ title: '', subtitle: '', imageUrl: '' });
    },
  });

  const deleteSliderMutation = api.homepage.deleteSlider.useMutation({
    onSuccess: () => void refetch(),
  });


  // Initialize state from homepage data
  useEffect(() => {
    if (homepage) {
      setPresentation(homepage.presentation || '');
      setReservationBtnText(homepage.reservationBtnText || 'Réserver une table');
      if (homepage.socialLinks) {
        setSocialLinks(homepage.socialLinks as unknown as SocialLink[]);
      }
    }
  }, [homepage]);

  // Initialize state from restaurant data
  useEffect(() => {
    if (restaurant) {
      setAddress(restaurant.address || '');
      setPhone(restaurant.phone || '');
    }
  }, [restaurant]);

  const sliders = (homepage?.sliders as unknown as Slider[]) || [];

  // Functions for live preview and sharing
  const getMinisiteUrl = () => {
    if (!restaurant?.slug) return '';
    return `${window.location.origin}/${restaurant.slug}`;
  };

  const previewMinisite = () => {
    const url = getMinisiteUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const copyMinisiteLink = async () => {
    const url = getMinisiteUrl();
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
      }
    }
  };

  const saveGeneral = async () => {
    await createOrUpdateMutation.mutateAsync({
      presentation,
      reservationBtnText,
      socialLinks,
    });
  };

  const saveContactInfo = async () => {
    await updateRestaurantMutation.mutateAsync({
      address,
      phone,
    });
  };

  const addSlider = async () => {
    if (newSlider.title && newSlider.imageUrl) {
      await addSliderMutation.mutateAsync(newSlider);
    }
  };





  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Configuration du Mini-site</h1>
              <p className="mt-2 text-sm text-gray-700">
                Personnalisez la page d'accueil de votre restaurant
              </p>
            </div>
            
            {/* Preview and Share Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={previewMinisite}
                disabled={!restaurant?.slug}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Voir en live
              </button>
              
              <button
                onClick={copyMinisiteLink}
                disabled={!restaurant?.slug}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {linkCopied ? (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Copié !
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                    Copier le lien
                  </>
                )}
              </button>
            </div>
          </div>
          
          {restaurant?.slug && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                URL de votre mini-site: 
                <span className="font-mono ml-2 text-indigo-600">{getMinisiteUrl()}</span>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'general', label: 'Général', icon: PencilIcon },
              { key: 'sliders', label: 'Sliders', icon: PhotoIcon },
              { key: 'social', label: 'Réseaux sociaux', icon: ShareIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations générales
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Présentation du restaurant
                  </label>
                  <textarea
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Décrivez votre restaurant, son histoire, sa philosophie..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texte du bouton de réservation
                  </label>
                  <input
                    type="text"
                    value={reservationBtnText}
                    onChange={(e) => setReservationBtnText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={saveGeneral}
                  disabled={createOrUpdateMutation.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createOrUpdateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📍 Informations de contact
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ces informations seront affichées dans le footer de votre mini-site
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Adresse du restaurant
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📞 Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 01 23 45 67 89"
                  />
                </div>

                <button
                  onClick={saveContactInfo}
                  disabled={updateRestaurantMutation.isPending}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {updateRestaurantMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les informations de contact'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sliders Tab */}
        {activeTab === 'sliders' && (
          <div className="space-y-6">
            {/* Add new slider */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ajouter un nouveau slider
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newSlider.title}
                    onChange={(e) => setNewSlider({...newSlider, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sous-titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newSlider.subtitle}
                    onChange={(e) => setNewSlider({...newSlider, subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du slider
                  </label>
                  <ImageUpload
                    onImageUpload={(imageUrl) => setNewSlider({...newSlider, imageUrl})}
                    currentImage={newSlider.imageUrl}
                    onRemoveImage={() => setNewSlider({...newSlider, imageUrl: ''})}
                  />
                </div>
              </div>

              <button
                onClick={addSlider}
                disabled={addSliderMutation.isPending || !newSlider.title || !newSlider.imageUrl}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {addSliderMutation.isPending ? 'Ajout...' : 'Ajouter le slider'}
              </button>
            </div>

            {/* Existing sliders */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sliders existants ({sliders.length})
              </h3>
              
              {sliders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun slider configuré</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sliders.map((slider) => (
                    <div key={slider.id} className="border rounded-lg p-4">
                      <img
                        src={slider.imageUrl}
                        alt={slider.title}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                      <h4 className="font-medium text-gray-900">{slider.title}</h4>
                      {slider.subtitle && (
                        <p className="text-sm text-gray-600">{slider.subtitle}</p>
                      )}
                      <button
                        onClick={() => deleteSliderMutation.mutate({ sliderId: slider.id })}
                        className="mt-2 text-red-600 hover:text-red-800 flex items-center text-sm"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Social Links Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Liens des réseaux sociaux
              </h3>
              
              <div className="space-y-4">
                {socialLinks.map((link, index) => (
                  <div key={link.platform} className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) => {
                          const newLinks = [...socialLinks];
                          newLinks[index]!.enabled = e.target.checked;
                          setSocialLinks(newLinks);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm font-medium text-gray-700 w-20">
                        {link.platform}
                      </label>
                    </div>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...socialLinks];
                        newLinks[index]!.url = e.target.value;
                        setSocialLinks(newLinks);
                      }}
                      placeholder={`URL ${link.platform}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ))}

                <button
                  onClick={saveGeneral}
                  disabled={createOrUpdateMutation.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createOrUpdateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les liens'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 