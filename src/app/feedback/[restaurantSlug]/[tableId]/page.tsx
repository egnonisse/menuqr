"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

interface SelectedMenuItem {
  menuItemId: string;
  rating?: number;
  comment?: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  const tableId = params.tableId as string;
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMention, setCurrentMention] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMenuItems, setFilteredMenuItems] = useState<any[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  
  // Nouvelle interface de sélection de plats
  const [showMenuItemSelection, setShowMenuItemSelection] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<SelectedMenuItem[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get restaurant info
  const { data: restaurant } = api.restaurant.getBySlug.useQuery({ slug: restaurantSlug });
  
  // Get menu items for mentions and selection
  const { data: menuItems = [] } = api.menu.getItems.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Get menu items organized by category for selection interface
  const { data: menuItemsForFeedback = [] } = api.feedbacks.getMenuItemsForFeedback.useQuery(
    { restaurantId: restaurant?.id || "" },
    { enabled: !!restaurant?.id }
  );

  // Create feedback mutation
  const createFeedbackMutation = api.feedbacks.create.useMutation({
    onSuccess: () => {
      console.log('Feedback submitted successfully');
      setIsSubmitted(true);
      setTimeout(() => {
        router.push(`/menu/${restaurantSlug}/${tableId}`);
      }, 3000);
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', error.message);
      console.error('Error data:', error.data);
    },
  });

  // Parse mentions from comment text
  const parseMentions = (text: string) => {
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*?)(?=\s|$|@)/g;
    const mentions: Array<{
      menuItemId: string;
      rating?: number;
      comment?: string;
    }> = [];
    
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1]?.trim();
      if (!mentionedName) continue;
      
      const menuItem = menuItems.find((item: any) => 
        item.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
        mentionedName.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (menuItem && !mentions.find(m => m.menuItemId === menuItem.id)) {
        mentions.push({
          menuItemId: menuItem.id,
          comment: `Mentionné dans le commentaire`
        });
      }
    }
    
    return mentions;
  };

  // Combine mentions from text and selected items
  const getCombinedMenuItems = () => {
    const mentionsFromText = parseMentions(comment);
    const allItems = [...selectedMenuItems];
    
    // Add mentions from text that aren't already in selected items
    mentionsFromText.forEach(mention => {
      if (!allItems.find(item => item.menuItemId === mention.menuItemId)) {
        allItems.push(mention);
      }
    });
    
    return allItems;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && restaurant?.id) {
      const combinedMenuItems = getCombinedMenuItems();
      
      // Debug logging
      console.log('Submitting feedback with menu items:', combinedMenuItems);
      
      createFeedbackMutation.mutate({
        rating,
        comment: comment || undefined,
        restaurantId: restaurant.id,
        tableId,
        menuItems: combinedMenuItems.length > 0 ? combinedMenuItems : undefined,
      });
    }
  };

  // Handle menu item selection
  const handleMenuItemSelect = (menuItemId: string) => {
    const isSelected = selectedMenuItems.find(item => item.menuItemId === menuItemId);
    
    if (isSelected) {
      // Remove item
      setSelectedMenuItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
    } else {
      // Add item
      setSelectedMenuItems(prev => [...prev, { menuItemId }]);
    }
  };

  // Handle rating for specific menu item
  const handleMenuItemRating = (menuItemId: string, rating: number) => {
    setSelectedMenuItems(prev => 
      prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, rating }
          : item
      )
    );
  };

  // Handle comment for specific menu item
  const handleMenuItemComment = (menuItemId: string, comment: string) => {
    setSelectedMenuItems(prev => 
      prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, comment }
          : item
      )
    );
  };

  // Render star rating component
  const renderStarRating = (currentRating: number, onRatingChange: (rating: number) => void, size: "sm" | "md" = "md") => {
    const starSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${starSize} ${
              star <= currentRating ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 transition-colors`}
          >
            {star <= currentRating ? (
              <StarIcon className={starSize} />
            ) : (
              <StarOutlineIcon className={starSize} />
            )}
          </button>
        ))}
      </div>
    );
  };

  // Group menu items by category
  const menuItemsByCategory = menuItemsForFeedback.reduce((acc: any, item: any) => {
    const categoryName = item.category?.name || 'Autres';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {});

  // Handle textarea input for mentions
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setComment(value);
    setCursorPosition(cursorPos);
    
    // Check if we're typing a mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setCurrentMention(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowSuggestions(true);
        
        // Filter menu items based on current mention
        const filtered = menuItems.filter((item: any) =>
          item.name.toLowerCase().includes(textAfterAt.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions
        
        setFilteredMenuItems(filtered);
        setActiveSuggestionIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredMenuItems.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < filteredMenuItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMenuItems.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (filteredMenuItems[activeSuggestionIndex]) {
          e.preventDefault();
          insertMention(filteredMenuItems[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Insert selected mention
  const insertMention = (menuItem: any) => {
    const beforeMention = comment.substring(0, mentionPosition);
    const afterCursor = comment.substring(cursorPosition);
    const newComment = beforeMention + `@${menuItem.name} ` + afterCursor;
    
    setComment(newComment);
    setShowSuggestions(false);
    setCurrentMention("");
    
    // Focus and set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + menuItem.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Get mentioned items for display
  const getMentionedItems = () => {
    return parseMentions(comment).map(mention => {
      const menuItem = menuItems.find((item: any) => item.id === mention.menuItemId);
      return menuItem ? menuItem.name : null;
    }).filter(Boolean);
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

            {/* Enhanced Comment with Mentions */}
            <div className="relative">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Partagez votre expérience
              </label>
              <div className="mb-2">
                <p className="text-xs text-gray-500">
                  💡 Tapez <span className="bg-gray-100 px-1 rounded font-mono">@</span> suivi du nom d'un plat pour le mentionner
                </p>
              </div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={handleCommentChange}
                  onKeyDown={handleKeyDown}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Décrivez votre expérience... (utilisez @ pour mentionner un plat)"
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && filteredMenuItems.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredMenuItems.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => insertMention(item)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                          index === activeSuggestionIndex ? 'bg-orange-50 text-orange-900' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-sm">{item.category?.emoji}</span>
                          <span className="ml-2 text-sm font-medium">{item.name}</span>
                          <span className="ml-auto text-xs text-gray-500">{item.price} FCFA</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display mentioned items */}
              {getMentionedItems().length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Plats mentionnés :</p>
                  <div className="flex flex-wrap gap-1">
                    {getMentionedItems().map((itemName, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                      >
                        {itemName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Item Selection Interface */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Évaluer des plats spécifiques (optionnel)
                </label>
                <button
                  type="button"
                  onClick={() => setShowMenuItemSelection(!showMenuItemSelection)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  {showMenuItemSelection ? 'Masquer' : 'Sélectionner des plats'}
                </button>
              </div>
              
              {showMenuItemSelection && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  {Object.entries(menuItemsByCategory).map(([categoryName, items]) => (
                    <div key={categoryName}>
                      <h4 className="font-medium text-gray-900 mb-2">{categoryName}</h4>
                      <div className="space-y-2">
                        {(items as any[]).map((item) => {
                          const selectedItem = selectedMenuItems.find(si => si.menuItemId === item.id);
                          const isSelected = !!selectedItem;
                          
                          return (
                            <div key={item.id} className="bg-white rounded-lg border p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMenuItemSelect(item.id)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <div className="ml-3">
                                    <div className="flex items-center">
                                      <span className="text-sm">{item.category?.emoji}</span>
                                      <span className="ml-2 text-sm font-medium text-gray-900">{item.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{item.price} FCFA</p>
                                  </div>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="mt-3 space-y-3 border-t pt-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Note pour ce plat
                                    </label>
                                    {renderStarRating(
                                      selectedItem?.rating || 0,
                                      (rating) => handleMenuItemRating(item.id, rating),
                                      "sm"
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Commentaire sur ce plat
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={selectedItem?.comment || ''}
                                      onChange={(e) => handleMenuItemComment(item.id, e.target.value)}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-xs"
                                      placeholder={`Votre avis sur ${item.name}...`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Display selected items summary */}
              {selectedMenuItems.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Plats sélectionnés :</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMenuItems.map((selectedItem) => {
                      const menuItem = menuItemsForFeedback.find(item => item.id === selectedItem.menuItemId);
                      return (
                        <div key={selectedItem.menuItemId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <span>{menuItem?.name}</span>
                          {selectedItem.rating && (
                            <span className="ml-1 text-yellow-600">⭐ {selectedItem.rating}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={rating === 0 || createFeedbackMutation.isPending}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {createFeedbackMutation.isPending ? 'Envoi en cours...' : 'Envoyer mon avis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 