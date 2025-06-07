"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { StarIcon } from "@heroicons/react/24/solid";
import { PhoneIcon, MapPinIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface DayHours {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface Slider {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  order: number;
}

interface Testimonial {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  order: number;
}

interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

const daysOfWeek = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Jeu' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sam' },
  { key: 'sunday', label: 'Dim' },
];

export default function RestaurantHomePage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
    customerName: "",
  });

  // Get restaurant info and homepage data
  const { data: restaurant } = api.restaurant.getBySlug.useQuery({ slug: restaurantSlug });
  const { data: homepage } = api.homepage.getByRestaurant.useQuery({ restaurantSlug });
  const { data: settings } = api.settings.getPublic.useQuery({ restaurantSlug });
  
  // Get recent feedbacks for testimonials (fallback if no homepage testimonials)
  const { data: recentFeedbacks = [], refetch: refetchRecentFeedbacks } = api.feedbacks.getRecent.useQuery(
    { 
      restaurantId: restaurant?.id || "",
      limit: 3
    },
    { enabled: !!restaurant?.id }
  );

  const { data: feedbackStats, refetch: refetchFeedbackStats } = api.feedbacks.getApprovedStats.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Mutation to create feedback
  const createFeedbackMutation = api.feedbacks.create.useMutation({
    onSuccess: () => {
      // Reset form
      setFeedbackForm({
        rating: 5,
        comment: "",
        customerName: "",
      });
      setShowFeedbackForm(false);
      setFeedbackSubmitted(true);
      // Refetch the data to show the new feedback
      refetchRecentFeedbacks();
      refetchFeedbackStats();
      // Hide success message after 5 seconds
      setTimeout(() => setFeedbackSubmitted(false), 5000);
    },
    onError: (error) => {
      alert("Erreur lors de l'envoi de votre avis : " + error.message);
    },
  });

  // Get homepage data
  const sliders = (homepage?.sliders as unknown as Slider[]) || [];
  const homepageTestimonials = (homepage?.testimonials as unknown as Testimonial[]) || [];
  const socialLinks = (homepage?.socialLinks as unknown as SocialLink[]) || [];
  const reservationBtnText = homepage?.reservationBtnText || "Réserver une table";
  const presentation = homepage?.presentation;

  // Debug log
  useEffect(() => {
    console.log("Restaurant data:", restaurant);
    console.log("Homepage data:", homepage);
    console.log("Settings data:", settings);
    console.log("Recent feedbacks:", recentFeedbacks);
    console.log("Feedback stats:", feedbackStats);
    console.log("Sliders:", sliders);
    console.log("Number of sliders:", sliders.length);
  }, [restaurant, homepage, settings, recentFeedbacks, feedbackStats, sliders]);

  // Auto-advance slider
  useEffect(() => {
    if (sliders.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sliders.length]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatOpeningHours = (openingHours: any) => {
    if (!openingHours) {
      return "Lun-Dim: 12h-14h, 19h-22h"; // Default text
    }

    const hours = openingHours as OpeningHours;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayKey = dayKeys[today] as keyof OpeningHours;
    const currentDayHours = hours[currentDayKey];

    // Show today's hours prominently
    if (currentDayHours?.isOpen) {
      return `Aujourd'hui: ${currentDayHours.openTime} - ${currentDayHours.closeTime}`;
    } else {
      return "Fermé aujourd'hui";
    }
  };

  const renderOpeningHoursTable = (openingHours: any) => {
    if (!openingHours) return null;

    const hours = openingHours as OpeningHours;
    const today = new Date().getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return (
      <div className="space-y-2">
        {daysOfWeek.map(({ key, label }, index) => {
          const dayHours = hours[key as keyof OpeningHours];
          const isToday = (index + 1) % 7 === today; // Adjust for Monday = 0 in our array
          
          return (
            <div key={key} className={`flex justify-between items-center py-1 ${isToday ? 'font-semibold bg-indigo-50 px-2 rounded' : ''}`}>
              <span className="text-sm text-gray-900">{label}</span>
              <span className={`text-sm ${dayHours?.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                {dayHours?.isOpen && dayHours.openTime && dayHours.closeTime
                  ? `${dayHours.openTime} - ${dayHours.closeTime}`
                  : 'Fermé'
                }
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348S9.746 16.988 8.449 16.988zM15.551 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348S16.848 16.988 15.551 16.988z"/>
            <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        );
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    createFeedbackMutation.mutate({
      rating: feedbackForm.rating,
      comment: feedbackForm.comment.trim() || undefined,
      customerName: feedbackForm.customerName.trim() || undefined,
      restaurantId: restaurant.id,
    });
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant non trouvé</h1>
          <p className="text-gray-600">Le restaurant que vous cherchez n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Slider */}
      {sliders.length > 0 ? (
        <div className="relative h-screen">
          {sliders.map((slider, index) => (
            <div
              key={slider.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Background with fallback */}
              <div className="h-full relative overflow-hidden">
                {/* Image background - Always try to show the image first */}
                {slider.imageUrl && !imageLoadErrors.has(slider.imageUrl) ? (
                  <img
                    src={slider.imageUrl}
                    alt={slider.title}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    onLoad={() => {
                      console.log("Image loaded successfully:", slider.imageUrl);
                    }}
                    onError={(e) => {
                      console.log("Image failed to load:", slider.imageUrl);
                      console.log("Error details:", e);
                      setImageLoadErrors(prev => new Set(prev).add(slider.imageUrl));
                    }}
                  />
                ) : (
                  /* Fallback gradient background - only if no image URL or image failed to load */
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 z-0">
                    {/* Default pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="restaurant-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                            <circle cx="25" cy="25" r="3" fill="white" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#restaurant-pattern)"/>
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Dark gradient overlay - darker at bottom for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 z-[1]"></div>

                {/* Image status indicator for users - only show if there's actually an error */}
                {slider.imageUrl && imageLoadErrors.has(slider.imageUrl) && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm z-20">
                    📷 Image non disponible
                  </div>
                )}
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-center text-white text-center z-10">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl">
                      {slider.title}
                    </h1>
                    {slider.subtitle && (
                      <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90 drop-shadow-xl font-medium">
                        {slider.subtitle}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                      <a
                        href={`/reservation/${restaurant.slug}`}
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg text-indigo-600 bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        📅 {reservationBtnText}
                      </a>
                      <a
                        href="#menu"
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg text-white border-2 border-white hover:bg-white hover:text-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        🍽️ Voir le menu
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Slider Navigation */}
          {sliders.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % sliders.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
              
              {/* Slide Indicators */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {sliders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Default Hero Section */
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-xl md:text-2xl mb-8 opacity-90">
                  {restaurant.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`/reservation/${restaurant.slug}`}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
                >
                  📅 {reservationBtnText}
                </a>
                <a
                  href="#menu"
                  className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-colors"
                >
                  🍽️ Voir le menu
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About/Presentation Section */}
      {presentation && (
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">À propos</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
              {presentation}
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {restaurant.address && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <MapPinIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Adresse</h3>
                <p className="text-gray-600">{restaurant.address}</p>
              </div>
            )}
            
            {restaurant.phone && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <PhoneIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Téléphone</h3>
                <p className="text-gray-600">{restaurant.phone}</p>
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ClockIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Horaires</h3>
              <p className="text-gray-600">{formatOpeningHours(restaurant.openingHours)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      {(settings?.showRating || settings?.showReviews) && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
              {settings?.showRating && feedbackStats && feedbackStats.total > 0 && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    {renderStars(Math.round(feedbackStats.averageRating))}
                    <span className="ml-2 text-lg font-medium text-gray-900">
                      {feedbackStats.averageRating.toFixed(1)}
                    </span>
                    <span className="ml-1 text-gray-500">
                      ({feedbackStats.total} avis)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {settings?.showReviews && (recentFeedbacks.length > 0 || homepageTestimonials.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Use real client feedbacks first, then fall back to homepage testimonials */}
                {(recentFeedbacks.length > 0 ? recentFeedbacks : homepageTestimonials)
                  .slice(0, 3)
                  .map((testimonial) => (
                    <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center mb-4">
                        {renderStars(testimonial.rating)}
                      </div>
                      <p className="text-gray-600 mb-4 italic">
                        "{testimonial.comment}"
                      </p>
                      <p className="font-medium text-gray-900">
                        - {testimonial.customerName || "Client anonyme"}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Feedback Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Partagez votre expérience
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Votre avis nous aide à améliorer nos services
            </p>
            
            {feedbackSubmitted && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Merci pour votre avis ! Il a été publié avec succès.</span>
                </div>
              </div>
            )}
            
            {!showFeedbackForm ? (
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                ⭐ Laisser un avis
              </button>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note *
                    </label>
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                          className="focus:outline-none"
                        >
                          <StarIcon
                            className={`h-8 w-8 ${
                              star <= feedbackForm.rating
                                ? "text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Votre nom (optionnel)
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={feedbackForm.customerName}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Votre nom"
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Votre commentaire (optionnel)
                    </label>
                    <textarea
                      id="comment"
                      rows={4}
                      value={feedbackForm.comment}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Partagez votre expérience..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-4 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createFeedbackMutation.isPending}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createFeedbackMutation.isPending ? "Envoi..." : "Envoyer l'avis"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      {socialLinks.some(link => link.enabled && link.url) && (
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Suivez-nous</h2>
            <div className="flex justify-center flex-wrap gap-6">
              {socialLinks
                .filter(link => link.enabled && link.url)
                .map((link) => {
                  const getPlatformColor = (platform: string) => {
                    switch (platform.toLowerCase()) {
                      case 'facebook':
                        return 'bg-blue-600 hover:bg-blue-700 text-white';
                      case 'instagram':
                        return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white';
                      case 'twitter':
                        return 'bg-sky-500 hover:bg-sky-600 text-white';
                      case 'linkedin':
                        return 'bg-blue-700 hover:bg-blue-800 text-white';
                      case 'tiktok':
                        return 'bg-black hover:bg-gray-800 text-white';
                      case 'youtube':
                        return 'bg-red-600 hover:bg-red-700 text-white';
                      case 'whatsapp':
                        return 'bg-green-500 hover:bg-green-600 text-white';
                      default:
                        return 'bg-gray-600 hover:bg-gray-700 text-white';
                    }
                  };

                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center p-6 rounded-xl transition-all duration-300 group transform hover:scale-105 shadow-lg hover:shadow-xl ${getPlatformColor(link.platform)}`}
                    >
                      <div className="mb-3 group-hover:scale-110 transition-transform duration-300">
                        {getSocialIcon(link.platform)}
                      </div>
                      <span className="text-sm font-semibold capitalize">
                        {link.platform}
                      </span>
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Menu Preview Section */}
      <div id="menu" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Menu</h2>
            <p className="text-lg text-gray-600 mb-8">
              Découvrez nos plats délicieux préparés avec des ingrédients frais
            </p>
            <a
              href={`/menu/${restaurant.slug}/preview`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              🍽️ Voir le menu complet
            </a>
          </div>
        </div>
      </div>

      {/* Detailed Opening Hours Section */}
      {restaurant.openingHours && (
        <div className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Horaires d'ouverture</h2>
                <p className="text-gray-600">Nos horaires de service</p>
              </div>
              {renderOpeningHoursTable(restaurant.openingHours)}
            </div>
          </div>
        </div>
      )}

      {/* Final CTA Section */}
      <div className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à vivre une expérience culinaire unique ?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Réservez votre table dès maintenant et laissez-vous surprendre
          </p>
          <a
            href={`/reservation/${restaurant.slug}`}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
          >
            📅 {reservationBtnText}
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Footer Content */}
          <div className="mb-8">
            
            {/* Restaurant Logo and Presentation */}
            <div className="mb-8">
              {/* Restaurant Logo/Name */}
              <div className="flex items-center mb-4">
                {settings?.logoUrl ? (
                  <div className="mr-4">
                    <img
                      src={settings.logoUrl}
                      alt={`Logo ${restaurant.name}`}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                    />
                  </div>
                ) : (
                  <div className="bg-indigo-600 text-white rounded-lg p-3 mr-4">
                    <span className="text-2xl font-bold">{restaurant.name.charAt(0)}</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold">{restaurant.name}</h3>
              </div>
              
              {/* Restaurant Presentation */}
              {(restaurant.description || presentation) && (
                <div className="text-gray-300 leading-relaxed max-w-2xl">
                  {presentation || restaurant.description}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-t border-gray-700 pt-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Contact Information */}
              {(restaurant.address || restaurant.phone || restaurant.email) && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-indigo-400">📍 Nous contacter</h4>
                  <div className="space-y-3">
                    {restaurant.address && (
                      <div className="flex items-start">
                        <span className="text-indigo-400 mr-2">📍</span>
                        <p className="text-gray-300">{restaurant.address}</p>
                      </div>
                    )}
                    {restaurant.phone && (
                      <div className="flex items-center">
                        <span className="text-indigo-400 mr-2">📞</span>
                        <a 
                          href={`tel:${restaurant.phone}`}
                          className="text-gray-300 hover:text-white transition-colors"
                        >
                          {restaurant.phone}
                        </a>
                      </div>
                    )}
                    {restaurant.email && (
                      <div className="flex items-center">
                        <span className="text-indigo-400 mr-2">✉️</span>
                        <a 
                          href={`mailto:${restaurant.email}`}
                          className="text-gray-300 hover:text-white transition-colors"
                        >
                          {restaurant.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opening Hours Summary */}
              {restaurant.openingHours && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-indigo-400">🕒 Horaires</h4>
                  <div className="text-gray-300">
                    {formatOpeningHours(restaurant.openingHours)}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-indigo-400">🔗 Liens rapides</h4>
                <div className="space-y-2">
                  <a 
                    href={`/reservation/${restaurant.slug}`}
                    className="block text-gray-300 hover:text-white transition-colors"
                  >
                    📅 Réserver une table
                  </a>
                  <a 
                    href={`/menu/${restaurant.slug}/preview`}
                    className="block text-gray-300 hover:text-white transition-colors"
                  >
                    🍽️ Voir le menu
                  </a>
                  <a 
                    href="#testimonials"
                    className="block text-gray-300 hover:text-white transition-colors"
                  >
                    ⭐ Avis clients
                  </a>
                </div>
              </div>

              {/* Social Networks - À l'extrémité droite */}
              {socialLinks.some(link => link.enabled && link.url) && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-indigo-400">📱 Réseaux sociaux</h4>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks
                      .filter(link => link.enabled && link.url)
                      .map((link) => {
                        const getFooterHoverColor = (platform: string) => {
                          switch (platform.toLowerCase()) {
                            case 'facebook':
                              return 'hover:text-blue-400 hover:bg-blue-400/10';
                            case 'instagram':
                              return 'hover:text-pink-400 hover:bg-pink-400/10';
                            case 'twitter':
                              return 'hover:text-sky-400 hover:bg-sky-400/10';
                            case 'linkedin':
                              return 'hover:text-blue-400 hover:bg-blue-400/10';
                            case 'tiktok':
                              return 'hover:text-white hover:bg-white/10';
                            case 'youtube':
                              return 'hover:text-red-400 hover:bg-red-400/10';
                            case 'whatsapp':
                              return 'hover:text-green-400 hover:bg-green-400/10';
                            default:
                              return 'hover:text-white hover:bg-white/10';
                          }
                        };

                        return (
                          <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center p-3 rounded-lg text-gray-400 transition-all duration-300 transform hover:scale-105 ${getFooterHoverColor(link.platform)}`}
                            title={`Suivez-nous sur ${link.platform}`}
                          >
                            {getSocialIcon(link.platform)}
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} {restaurant.name}. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 