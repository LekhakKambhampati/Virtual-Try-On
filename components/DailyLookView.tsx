
import React, { useState } from 'react';
import type { ClothingItem, UserProfile } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';

interface DailyLookViewProps {
  wardrobe: ClothingItem[];
  setWardrobe: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
  userProfile: UserProfile;
}

interface OutfitSuggestion {
    outfit: Record<string, string>;
    justification: string;
}

export const DailyLookView: React.FC<DailyLookViewProps> = ({ wardrobe, setWardrobe, userProfile }) => {
  const [occasion, setOccasion] = useState('casual');
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateOutfit = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await geminiService.generateOutfit(wardrobe, userProfile, occasion);
      setSuggestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outfit. Add more items to your wardrobe.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const findItemByName = (name: string) => {
    if (!name) return undefined;
    const availableItems = wardrobe.filter(item => item.status === 'available');
    return availableItems.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  const suggestedItems = suggestion?.outfit ? 
    Object.values(suggestion.outfit)
          .map(findItemByName)
          .filter((item): item is ClothingItem => !!item) 
    : [];

  const handleWoreIt = () => {
    if (!suggestion) return;
    const wornItemIds = new Set(suggestedItems.map(item => item.id));
    const twoDaysFromNow = new Date().getTime() + 2 * 24 * 60 * 60 * 1000;
    
    setWardrobe(prev => prev.map(item =>
        wornItemIds.has(item.id)
            ? { ...item, status: 'laundry', laundryUntil: twoDaysFromNow }
            : item
    ));
    setSuggestion(null); // Clear suggestion after action
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Today's Outfit Suggestion</h2>
        <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
          <div>
            <label htmlFor="occasion" className="block text-sm font-medium text-gray-700">What's the occasion?</label>
            <select
              id="occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option>casual</option>
              <option>work</option>
              <option>night out</option>
              <option>formal</option>
            </select>
          </div>
          <button
            onClick={handleGenerateOutfit}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isLoading ? 'Thinking...' : 'Get Suggestion'}
          </button>
        </div>
      </div>
      
      {isLoading && <LoadingSpinner message="Crafting the perfect look for you..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {suggestion && (
        <div className="p-6 bg-white rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-bold mb-4">Your Outfit</h3>
          <p className="italic text-gray-600 mb-6">"{suggestion.justification}"</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {suggestedItems.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden border">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover"/>
                    <div className="p-2">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                    </div>
                </div>
            ))}
          </div>
          <button
            onClick={handleWoreIt}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            I Wore This!
          </button>
        </div>
      )}
    </div>
  );
};
